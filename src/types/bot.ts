import { HexColor } from '../utils/color'
import { I18nArray, I18nString } from './props'

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

/**
 * API response shape from /v1/embed/:bot_uuid/settings/:language
 */
export interface BotSettingsResponse {
  name: string
  props: BotProps
}

// === Bot Props (flat structure matching API response) ===

export interface BotProps {
  // Identity
  name: I18nString
  avatar?: string

  // Behavior
  defaultOpen?: boolean
  expandable?: boolean
  unclosable?: boolean

  // Content
  welcomeMessage?: I18nString
  suggestions?: I18nArray
  toasts?: I18nArray
  messagePlaceholder?: I18nString
  togglePlaceholder?: I18nString

  // i18n
  lang?: string
  locales?: string[]

  // PRO (backend only sends these if bot is PRO)
  icon?: string
  unbranded?: boolean

  // Layout & positioning
  position?: 'inline' | 'left' | 'center' | 'right'
  windowSize?: 'sm' | 'md' | 'lg' | 'xl'
  toggleSize?: 'sm' | 'md' | 'lg'
  marginX?: number
  marginY?: number
  marginLinked?: boolean

  // Appearance
  theme?: 'auto' | 'light' | 'dark'
  /** @deprecated Use `theme` instead */
  dark?: 'auto' | 'light' | 'dark'
  rounded?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'

  // Toggle colors
  toggleBackground?: HexColor
  toggleContent?: HexColor | string

  // Message colors
  messageBackground?: HexColor
  messageContent?: HexColor | string

  // Backdrop
  backdropColor?: HexColor
  backdropOpacity?: number
  backdropBlur?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  backdropEnabled?: boolean

  // Features
  showRating?: boolean | number
  showSources?: boolean
  showQueries?: boolean
}
