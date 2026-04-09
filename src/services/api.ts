import { validateUUID } from '../utils/uuid'
import {
  ApiResponse,
  ApiMessageResponse,
  ApiMessageResponseStatus,
} from '../types/api'

const TOLKI_API_BASE_URL: string = 'https://api.tolki.ai/chat/v1/embed/'
const TOLKI_BRAIN_API_BASE_URL: string = 'https://brain.tolki.ai/v1/embed/'

export class Api {
  private static _isAdk: boolean = false

  public static set isAdk(value: boolean) {
    Api._isAdk = value
  }

  private static get baseUrl(): string {
    // TEMP: always return TOLKI_API_BASE_URL during migration from
    // TOLKI_BRAIN_API_BASE_URL to TOLKI_API_BASE_URL.
    // Revert to `Api._isAdk ? TOLKI_BRAIN_API_BASE_URL : TOLKI_API_BASE_URL`
    // once migration is complete.
    return TOLKI_API_BASE_URL
  }

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
          const base = `${Api.baseUrl}${bot_uuid}/chat/${chat_uuid}/message`
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
