import { HexColor, HexColorPair } from '../utils/color'

/**
 * Internationalized string - can be a plain string or an object with language keys
 */
export type I18nString = string | { [lang: string]: string }

/**
 * Internationalized array - can be a plain array or an object with language keys containing arrays
 */
export type I18nArray = string[] | { [lang: string]: string }[]

/**
 * Position options for the chat widget
 */
export type ChatPosition = 'inline' | 'left' | 'center' | 'right'

/**
 * Size options for the chat widget
 */
export type ChatSize = 'md' | 'lg' | 'xl'

/**
 * Icon value - can be hex color, color pair, or URL (URL is PRO only)
 */
export type IconValue = HexColor | HexColorPair | string

/**
 * Complete props interface for TolkiChat component
 */
export interface TolkiChatProps {
  // Layout & Positioning
  position: ChatPosition
  size: ChatSize
  defaultOpen: boolean
  expandable: boolean
  unclosable: boolean

  // Appearance
  dark: boolean
  blur: boolean
  backdrop: HexColor | null
  avatar: string | null

  // Colors
  toggleColor: HexColor | HexColorPair
  icon: IconValue | null
  messageColor: HexColor | HexColorPair

  // Branding (PRO only)
  unbranded: boolean

  // Content
  placeholder: string
  welcomeMessage: I18nString | null
  suggestions: I18nArray
  toasts: I18nArray

  // Internationalization
  lang: string
  locales: string[]
}

/**
 * Default values for all props
 */
export const DEFAULT_PROPS: TolkiChatProps = {
  // Layout & Positioning
  position: 'right',
  size: 'md',
  defaultOpen: true,
  expandable: true,
  unclosable: false,

  // Appearance
  dark: false,
  blur: true,
  backdrop: null,
  avatar: null,

  // Colors
  toggleColor: '#3b82f6',
  icon: null, // Will auto-generate based on toggleColor
  messageColor: '#2563eb',

  // Branding
  unbranded: false,

  // Content
  placeholder: 'Ask Anything',
  welcomeMessage: null,
  suggestions: [],
  toasts: [],

  // Internationalization
  lang: 'en',
  locales: ['en', 'it', 'es', 'fr', 'de', 'pt'],
}

/**
 * Props that can only be set via PRO backend
 */
export const PRO_ONLY_PROPS = ['unbranded'] as const
export type ProOnlyProp = (typeof PRO_ONLY_PROPS)[number]

/**
 * Check if a prop is PRO only
 */
export function isProOnlyProp(propName: string): boolean {
  return PRO_ONLY_PROPS.includes(propName as ProOnlyProp)
}

/**
 * Check if icon value is a URL (PRO only)
 */
export function isIconUrl(icon: IconValue): boolean {
  if (typeof icon !== 'string') return false
  return icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('data:')
}
