import { validateUUID } from '../utils/uuid'
import {
  ApiResponse,
  ApiMessageResponse,
  ApiMessageResponseStatus,
} from '../types/api'

const TOLKI_API_BASE_URL: string = 'https://api.tolki.ai/chat/v1/embed/'

export class Api {
  public static async settings(
    bot_uuid: string,
    lang?: string
  ): Promise<ApiResponse> {
    // api.tolki.ai/chat/v1/embed/:bot_uuid/settings/:lang
    const resolvedLang: string =
      lang || navigator.language?.split('-')[0] || 'en'
    return new Promise((resolve, reject) => {
      fetch(`${TOLKI_API_BASE_URL}${bot_uuid}/settings/${resolvedLang}`)
        .then((response: Response) => {
          if (response.status === 200) {
            response.json().then((data) => {
              resolve({ status: response.status, data })
            })
          } else {
            response.json().then((data) => {
              reject({
                status: response.status,
                data,
              })
            })
          }
        })
        .catch((err) => {
          console.error('Tolki: bot error:', err)
          reject(err)
        })
    })
  }

  private static isDevHost(): boolean {
    const hostname = window.location.hostname
    return hostname === 'localhost' || hostname === 'studio.tolki.ai'
  }

  // ---------------------------------------------------------------------------
  // Stream message (SSE)
  // ---------------------------------------------------------------------------
  // POST /v1/embed/{bot_uuid}/chat/{chat_uuid}/message/stream
  //
  // Returns a `text/event-stream` of NDJSON events:
  //   { "type": "text_delta", "delta": "..." }
  //   { "type": "document_search_query", ... }
  //   { "type": "document_search_results", ... }
  //   { "type": "error", "message": "..." }
  //   { "type": "done", "message_id": 123 }
  //
  // The caller passes `onEvent` to react to each chunk as it arrives. The
  // returned promise resolves once the server closes the stream.
  // ---------------------------------------------------------------------------
  public static async messageStream(
    chat_uuid: string,
    bot_uuid: string,
    message: string,
    onEvent: (event: { type: string; [key: string]: unknown }) => void
  ): Promise<void> {
    if (
      !validateUUID(chat_uuid) ||
      !validateUUID(bot_uuid) ||
      !message?.trim()
    ) {
      throw new Error('Invalid stream parameters')
    }

    const url = `${TOLKI_API_BASE_URL}${bot_uuid}/chat/${chat_uuid}/message/stream`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({ message }),
    })

    if (!response.ok || !response.body) {
      throw new Error(`Stream HTTP ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      // SSE frames are separated by a blank line; lines start with "data: "
      let sepIdx: number
      while ((sepIdx = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, sepIdx)
        buffer = buffer.slice(sepIdx + 2)
        for (const line of frame.split('\n')) {
          if (!line.startsWith('data:')) continue
          const payload = line.slice(5).trim()
          if (!payload) continue
          try {
            onEvent(JSON.parse(payload))
          } catch (e) {
            console.error('Tolki: bad SSE payload', payload, e)
          }
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Send message
  // ---------------------------------------------------------------------------
  // POST /v1/embed/{bot_uuid}/chat/{chat_uuid}/message
  //
  // Response items MUST include a top-level "id" field.
  // This is required for the like/dislike feedback endpoint to work.
  //
  // Expected response shape (data is a plain JSON array):
  //   [{ "type": "markdown", "id": "123", "content": "..." }]
  // ---------------------------------------------------------------------------
  public static async message(
    chat_uuid: string,
    bot_uuid: string,
    message: string,
    showSources?: boolean
  ): Promise<ApiMessageResponse> {
    return new Promise((resolve, reject) => {
      if (
        validateUUID(chat_uuid) &&
        validateUUID(bot_uuid) &&
        message?.trim() !== ''
      ) {
        try {
          const base = `${TOLKI_API_BASE_URL}${bot_uuid}/chat/${chat_uuid}/message`
          const includeDocs = showSources || this.isDevHost()
          const url = includeDocs ? `${base}?include_docs=true` : base
          fetch(url, {
            method: `POST`,
            headers: {
              'Content-Type': `application/json`,
            },
            body: JSON.stringify({
              message,
            }),
          })
            .then((response: Response) => {
              if (response.status === 200) {
                response
                  .json()
                  .then((data) => {
                    resolve({ status: ApiMessageResponseStatus.ok, data })
                  })
                  .catch((error) => {
                    reject({
                      status: ApiMessageResponseStatus.error,
                      error,
                    })
                  })
              } else {
                response
                  .json()
                  .then((data) => {
                    reject({
                      status: ApiMessageResponseStatus.notOk,
                      data,
                      response: {
                        status: response.status,
                        statusText: response.statusText,
                      },
                    })
                  })
                  .catch((error) => {
                    reject({
                      status: ApiMessageResponseStatus.error,
                      error,
                    })
                  })
              }
            })
            .catch((error) => {
              reject({
                status: ApiMessageResponseStatus.error,
                error,
              })
            })
        } catch (error) {
          reject({
            status: ApiMessageResponseStatus.error,
            error,
          })
        }
      } else {
        // Chat UUID not found
        reject({
          status: ApiMessageResponseStatus.badMessage,
        })
      }
    })
  }

  // ---------------------------------------------------------------------------
  // Message reaction (like/dislike on a single message)
  // ---------------------------------------------------------------------------
  // POST /v1/embed/{bot_uuid}/chat/{chat_uuid}/message/{id}/reaction
  //
  // Request body:
  //   { "type": "like" | "dislike" }
  //
  // Response:
  //   200 { "ok": true }
  // ---------------------------------------------------------------------------
  public static async messageReaction(
    bot_uuid: string,
    chat_uuid: string,
    id: string,
    type: 'like' | 'dislike'
  ): Promise<void> {
    const url = `${TOLKI_API_BASE_URL}${bot_uuid}/chat/${chat_uuid}/message/${id}/reaction`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    })
    if (!response.ok) {
      throw new Error(`Reaction failed: ${response.status}`)
    }
  }

  // ---------------------------------------------------------------------------
  // Message feedback (text feedback on a single message)
  // ---------------------------------------------------------------------------
  // POST /v1/embed/{bot_uuid}/chat/{chat_uuid}/message/{id}/feedback
  //
  // Request body:
  //   { "message": string }
  //
  // Response:
  //   200 { "ok": true }
  // ---------------------------------------------------------------------------
  public static async messageFeedback(
    bot_uuid: string,
    chat_uuid: string,
    id: string,
    message: string
  ): Promise<void> {
    const url = `${TOLKI_API_BASE_URL}${bot_uuid}/chat/${chat_uuid}/message/${id}/feedback`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    })
    if (!response.ok) {
      throw new Error(`Feedback failed: ${response.status}`)
    }
  }

  // ---------------------------------------------------------------------------
  // Conversation rating (overall satisfaction for the whole chat session)
  // ---------------------------------------------------------------------------
  // POST /v1/embed/{bot_uuid}/chat/{chat_uuid}/rating
  //
  // Request body:
  //   { "rating": 1 | 2 | 3 | 4 | 5 }
  //
  // Response:
  //   200 { "ok": true }
  //   400 { "error": "invalid rating" | "already rated" }
  //   404 { "error": "chat not found" }
  // ---------------------------------------------------------------------------
  public static async conversationRating(
    bot_uuid: string,
    chat_uuid: string,
    rating: number
  ): Promise<void> {
    const url = `${TOLKI_API_BASE_URL}${bot_uuid}/chat/${chat_uuid}/rating`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating }),
    })
    if (!response.ok) {
      throw new Error(`Rating failed: ${response.status}`)
    }
  }
}
