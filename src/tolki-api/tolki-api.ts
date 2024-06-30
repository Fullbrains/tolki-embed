import { validate as validateUuid } from 'uuid'

export interface TolkiApiResponse {
  status: number
  data: unknown
}

export enum TolkiChatApiResponseStatus {
  ok = 'ok',
  notOk = 'notOk',
  error = 'error',
  badMessage = 'badMessage',
}
export interface TolkiChatApiResponse {
  status: TolkiChatApiResponseStatus
  data: unknown
  response?: Partial<Response>
  error?: unknown
}

const TOLKI_API_BASE_URL: string = 'https://api.tolki.ai/v1/'

export class TolkiApi {
  public static async bot(id: string): Promise<TolkiApiResponse> {
    return new Promise((resolve, reject) => {
      fetch(`${TOLKI_API_BASE_URL}bot/${id}`)
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
          reject(err)
        })
    })
  }

  public static async chat(
    chat: string,
    bot: string,
    message: string
  ): Promise<TolkiChatApiResponse> {
    return new Promise((resolve, reject) => {
      if (validateUuid(chat) && validateUuid(bot) && message?.trim() !== '') {
        try {
          fetch(`${TOLKI_API_BASE_URL}chat/`, {
            method: `POST`,
            headers: {
              'Content-Type': `application/json`,
            },
            body: JSON.stringify({
              chat,
              bot,
              message,
            }),
          })
            .then((response: Response) => {
              if (response.status === 200) {
                response
                  .json()
                  .then((data) => {
                    resolve({ status: TolkiChatApiResponseStatus.ok, data })
                  })
                  .catch((error) => {
                    reject({ status: TolkiChatApiResponseStatus.error, error })
                  })
              } else {
                response
                  .json()
                  .then((data) => {
                    reject({
                      status: TolkiChatApiResponseStatus.notOk,
                      data,
                      response: {
                        status: response.status,
                        statusText: response.statusText,
                      },
                    })
                  })
                  .catch((error) => {
                    reject({ status: TolkiChatApiResponseStatus.error, error })
                  })
              }
            })
            .catch((error) => {
              reject({
                status: TolkiChatApiResponseStatus.error,
                error,
              })
            })
        } catch (error) {
          reject({
            status: TolkiChatApiResponseStatus.error,
            error,
          })
        }
      } else {
        reject({
          status: TolkiChatApiResponseStatus.badMessage,
        })
      }
    })
  }
}
