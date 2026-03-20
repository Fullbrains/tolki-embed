import { validateUUID } from '../utils/uuid'
import { ApiResponse, ApiMessageResponse, ApiMessageResponseStatus } from '../types/api'


const TOLKI_API_BASE_URL: string = 'https://api.tolki.ai/chat/v1/embed/'
const TOLKI_BRAIN_API_BASE_URL: string = 'https://brain.tolki.ai/v1/embed/'

export class Api {
  public static async settings(bot_uuid: string): Promise<ApiResponse> {
    // api.tolki.ai/chat/v1/embed/:bot_uuid/settings/:lang
    const lang: string = navigator.language || 'en'
    return new Promise((resolve, reject) => {
      fetch(`${TOLKI_API_BASE_URL}${bot_uuid}/settings/${lang}`)
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
  // Expected response shape (each item in data.items[]):
  //   { "type": "markdown", "id": "123", "content": "..." }
  // ---------------------------------------------------------------------------
  public static async message(
    chat_uuid: string,
    bot_uuid: string,
    message: string,
    isAdk?: boolean,
    showSources?: boolean
  ): Promise<ApiMessageResponse> {

    return new Promise((resolve, reject) => {
      if (
        validateUUID(chat_uuid) &&
        validateUUID(bot_uuid) &&
        message?.trim() !== ''
      ) {
        try {
          const base = isAdk
            ? `${TOLKI_BRAIN_API_BASE_URL}${bot_uuid}/chat/${chat_uuid}/message`
            : `${TOLKI_API_BASE_URL}${bot_uuid}/chat/${chat_uuid}/message`
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
  // Message feedback (like/dislike and/or text feedback on a single message)
  // ---------------------------------------------------------------------------
  // POST /v1/embed/{bot_uuid}/chat/{chat_uuid}/message/{id}/feedback
  //
  // Backend requirements:
  //   - Every item returned by the /message endpoint MUST include a top-level
  //     "id" field. At minimum on "markdown" items; ideally on every item type
  //     so we can extend feedback to other types later.
  //   - This endpoint receives the feedback and persists it.
  //   - All fields in the body are optional; the API saves whatever is sent.
  //
  // Request body:
  //   { "type"?: "like" | "dislike", "message"?: string }
  //
  // Response:
  //   200 { "ok": true }
  //   400 { "error": "invalid id" | "invalid type" }
  //   404 { "error": "message not found" }
  // ---------------------------------------------------------------------------
  public static async messageFeedback(
    bot_uuid: string,
    chat_uuid: string,
    id: string,
    type?: 'like' | 'dislike',
    message?: string
  ): Promise<void> {
    const url = `${TOLKI_API_BASE_URL}${bot_uuid}/chat/${chat_uuid}/message/${id}/feedback`
    const body: { type?: string; message?: string } = {}
    if (type) body.type = type
    if (message) body.message = message
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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
