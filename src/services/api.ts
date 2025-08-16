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

  public static async message(
    chat_uuid: string,
    bot_uuid: string,
    message: string,
    isAdk?: boolean
  ): Promise<ApiMessageResponse> {
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
        console.log('Tolki: not message:', chat_uuid)
        reject({
          status: ApiMessageResponseStatus.badMessage,
        })
      }
    })
  }
}
