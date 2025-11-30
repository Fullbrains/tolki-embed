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
 * Size options for the chat window
 */
export type WindowSize = 'sm' | 'md' | 'lg' | 'xl'

/**
 * Size options for the toggle button
 */
export type ToggleSize = 'sm' | 'md' | 'lg'

/**
 * Dark mode options
 * - 'auto': follows system preference (prefers-color-scheme)
 * - 'light': always light mode
 * - 'dark': always dark mode
 */
export type DarkMode = 'auto' | 'light' | 'dark'

/**
 * Border radius options
 * - 'none': no border radius (0px)
 * - 'xs': extra small border radius (5px)
 * - 'sm': small border radius (10px)
 * - 'md': medium border radius (15px)
 * - 'lg': large border radius (20px)
 * - 'xl': extra large border radius (25px) - default
 */
export type RoundedSize = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/**
 * Complete props interface for TolkiChat component
 */
export interface TolkiChatProps {
  // Layout & Positioning
  position: ChatPosition
  windowSize: WindowSize
  toggleSize: ToggleSize
  margin: number | [number, number] // Margin in pixels: number (all) or [x, y] (default: 20)
  defaultOpen: boolean
  expandable: boolean
  unclosable: boolean

  // Appearance
  dark: DarkMode
  rounded: RoundedSize
  backdropColor: HexColor | null
  backdropOpacity: number // 0-1, default 0.5
  backdropBlur: 'none' | 'sm' | 'md' | 'lg' | 'xl' | null // default 'md' if null
  avatar: string | null

  // Toggle button colors
  toggleBackground: HexColor
  toggleContent: HexColor | null // Auto-generated from toggleBackground if null

  // Message bubble colors (user messages)
  messageBackground: HexColor
  messageContent: HexColor | null

  // Icon URL (PRO only)
  icon: string | null

  // Branding (PRO only)
  unbranded: boolean

  // Content
  messagePlaceholder: I18nString
  togglePlaceholder: I18nString
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
  windowSize: 'sm',
  toggleSize: 'md',
  margin: 20,
  defaultOpen: true,
  expandable: true,
  unclosable: false,

  // Appearance
  dark: 'auto',
  rounded: 'xl',
  backdropColor: null,
  backdropOpacity: 0.5,
  backdropBlur: 'md',
  avatar: null,

  // Toggle button colors
  toggleBackground: '#001ccb',
  toggleContent: null, // Auto-generated based on toggleBackground

  // Message bubble colors
  messageBackground: '#001ccb',
  messageContent: null, // Auto-generated based on messageBackground

  // Icon URL
  icon: null,

  // Branding
  unbranded: false,

  // Content
  messagePlaceholder: 'Ask Anything',
  togglePlaceholder: '',
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
export const PRO_ONLY_PROPS = ['unbranded', 'icon'] as const
export type ProOnlyProp = (typeof PRO_ONLY_PROPS)[number]

/**
 * Check if a prop is PRO only
 */
export function isProOnlyProp(propName: string): boolean {
  return PRO_ONLY_PROPS.includes(propName as ProOnlyProp)
}
