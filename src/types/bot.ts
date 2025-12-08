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

// === New Styles Structure ===

export interface ToggleStyles {
  size?: 'sm' | 'md' | 'lg'
  background?: HexColor
  foreground?: HexColor | null
}

export interface WindowStyles {
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export interface MessageStyles {
  background?: HexColor
  foreground?: HexColor | null
}

export interface BackdropStyles {
  color?: HexColor | null
  opacity?: number
  blur?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
}

export interface StylesConfig {
  // Global (affects entire widget)
  position?: 'inline' | 'left' | 'center' | 'right'
  margin?: number | [number, number]
  dark?: 'auto' | 'light' | 'dark'
  rounded?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'

  // Per element
  toggle?: ToggleStyles
  window?: WindowStyles
  message?: MessageStyles
  backdrop?: BackdropStyles

  // Legacy structure (for backward compatibility)
  chat?: {
    button?: {
      defaultBackgroundColor?: string
      hoverBackgroundColor?: string
      foregroundColor?: string
    }
    bubble?: {
      backgroundColor?: string
      foregroundColor?: string
    }
  }
}

// === Bot Props ===

export interface BotProps {
  // Identity
  name: string
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

  // API routing (determines which backend to use, NOT related to PRO)
  isAdk?: boolean

  // Styles
  styles?: StylesConfig

  // Legacy (deprecated, kept for backward compatibility)
  /** @deprecated - not used */
  team?: string
  /** @deprecated - not used */
  version?: string
}
