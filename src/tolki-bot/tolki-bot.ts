import { validateUUID } from '../utils/encryption'
import { TolkiApi } from '../tolki-api/tolki-api'

export enum TolkiBotStatus {
  unknown = 'unknown',
  ok = 'ok',
  notInstalled = 'notInstalled',
  invalid = 'invalid',
  notFound = 'notFound',
  inactive = 'inactive',
}

export interface TolkiBotInitResult {
  status: TolkiBotStatus
  props?: TolkiBotProps
  uuid?: string
}

export class TolkiBot {
  private static _uuid: string
  private static _status: TolkiBotStatus
  private static _props: TolkiBotProps

  static async init(uuid: string): Promise<TolkiBotInitResult> {
    return new Promise((resolve, reject) => {
      this._uuid = uuid || null
      this._status = TolkiBotStatus.unknown
      this._props = null

      if (this._uuid) {
        if (validateUUID(this._uuid)) {
          TolkiApi.settings(this._uuid)
            .then(({ data }) => {
              this._status = TolkiBotStatus.ok
              this._props = data as TolkiBotProps
              resolve({
                status: this._status,
                props: this._props,
                uuid: this._uuid,
              })
            })
            .catch(({ status }) => {
              if (status === 404) {
                this._status = TolkiBotStatus.notFound
              } else if (status === 403) {
                this._status = TolkiBotStatus.inactive
              } else {
                this._status = TolkiBotStatus.unknown
              }
              reject({ status: this._status })
            })
        } else {
          this._status = TolkiBotStatus.invalid
          this._uuid = null
          reject({ status: this._status })
        }
      } else {
        this._status = TolkiBotStatus.notInstalled
        reject({ status: this._status })
      }
    })
  }

  static get status(): TolkiBotStatus {
    return this._status
  }

  static get props(): TolkiBotProps {
    return this._props
  }

  static get uuid(): string {
    return this._uuid
  }
}

export interface TolkiBotProps {
  name: string
  team: string
  avatar?: string
  icon?: string
  unbranded?: boolean
  suggestions?: string[]
  welcomeMessage?: string
  styles: { [key: string]: { [key: string]: { [key: string]: string } } }
  version: string
}
