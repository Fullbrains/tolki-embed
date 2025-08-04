import { validateUUID } from '../utils/encryption'

export interface TolkiApiResponse {
  status: number
  data: unknown
}

export enum TolkiApiMessageResponseStatus {
  ok = 'ok',
  notOk = 'notOk',
  error = 'error',
  badMessage = 'badMessage',
}

export interface TolkiApiMessageResponse {
  status: TolkiApiMessageResponseStatus
  data: unknown
  response?: Partial<Response>
  error?: unknown
}

const TOLKI_API_BASE_URL: string = 'https://api.tolki.ai/chat/v1/embed/'
const TOLKI_BRAIN_API_BASE_URL: string = 'https://api.tolki.ai/brain-chat/v1/embed/'

export class TolkiApi {
  public static async settings(bot_uuid: string): Promise<TolkiApiResponse> {
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

  public static async message(
    chat_uuid: string,
    bot_uuid: string,
    message: string,
    isAdk?: boolean
  ): Promise<TolkiApiMessageResponse> {
    // api.tolki.ai/chat/v1/embed/:bot_uuid/chat/:chat_uuid/message
    // or different URL if isAdk is true

    return new Promise((resolve, reject) => {
      if (
        validateUUID(chat_uuid) &&
        validateUUID(bot_uuid) &&
        message?.trim() !== ''
      ) {
        try {
          const url = isAdk 
            ? `${TOLKI_BRAIN_API_BASE_URL}${bot_uuid}/chat/${chat_uuid}/message`
            : `${TOLKI_API_BASE_URL}${bot_uuid}/chat/${chat_uuid}/message`
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
                    resolve({ status: TolkiApiMessageResponseStatus.ok, data })
                  })
                  .catch((error) => {
                    reject({
                      status: TolkiApiMessageResponseStatus.error,
                      error,
                    })
                  })
              } else {
                response
                  .json()
                  .then((data) => {
                    reject({
                      status: TolkiApiMessageResponseStatus.notOk,
                      data,
                      response: {
                        status: response.status,
                        statusText: response.statusText,
                      },
                    })
                  })
                  .catch((error) => {
                    reject({
                      status: TolkiApiMessageResponseStatus.error,
                      error,
                    })
                  })
              }
            })
            .catch((error) => {
              reject({
                status: TolkiApiMessageResponseStatus.error,
                error,
              })
            })
        } catch (error) {
          reject({
            status: TolkiApiMessageResponseStatus.error,
            error,
          })
        }
      } else {
        console.log('Tolki: not message:', chat_uuid)
        reject({
          status: TolkiApiMessageResponseStatus.badMessage,
        })
      }
    })
  }
}
