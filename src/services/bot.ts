import { validateUUID } from '../utils/uuid'
import { Api } from './api'
import { BotStatus, BotInitResult, BotProps } from '../types/bot'


export class Bot {
  private static _uuid: string
  private static _status: BotStatus
  private static _props: BotProps

  static async init(uuid: string): Promise<BotInitResult> {
    return new Promise((resolve, reject) => {
      this._uuid = uuid || null
      this._status = BotStatus.unknown
      this._props = null

      if (this._uuid) {
        if (validateUUID(this._uuid)) {
          Api.settings(this._uuid)
            .then(({ data }) => {
              this._status = BotStatus.ok
              this._props = data as BotProps
              resolve({
                status: this._status,
                props: this._props,
                uuid: this._uuid,
              })
            })
            .catch(({ status }) => {
              if (status === 404) {
                this._status = BotStatus.notFound
              } else if (status === 403) {
                this._status = BotStatus.inactive
              } else {
                this._status = BotStatus.unknown
              }
              reject({ status: this._status })
            })
        } else {
          this._status = BotStatus.invalid
          this._uuid = null
          reject({ status: this._status })
        }
      } else {
        this._status = BotStatus.notInstalled
        reject({ status: this._status })
      }
    })
  }

  static get status(): BotStatus {
    return this._status
  }

  static get props(): BotProps {
    return this._props
  }

  static get uuid(): string {
    return this._uuid
  }
}

