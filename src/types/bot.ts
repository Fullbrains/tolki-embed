export enum BotStatus {
  unknown = 'unknown',
  ok = 'ok',
  notInstalled = 'notInstalled',
  invalid = 'invalid',
  notFound = 'notFound',
  inactive = 'inactive',
}

export interface BotInitResult {
  status: BotStatus
  props?: BotProps
  uuid?: string
}

export interface BotProps {
  name: string
  team: string
  avatar?: string
  icon?: string
  unbranded?: boolean
  isAdk?: boolean
  suggestions?: string[]
  welcomeMessage?: string
  defaultOpen?: boolean
  styles: { [key: string]: { [key: string]: { [key: string]: string } } }
  version: string
}