import { HexColor } from '../utils/color'

/**
 * Internationalized string - can be a plain string or an object with language keys
 */
export type I18nString = string | { [lang: string]: string }

/**
 * Internationalized array - can be:
 * - Plain string array: ["Hello", "Help"]
 * - Per-item i18n objects: [{ en: "Hello", it: "Ciao" }, { en: "Help", it: "Aiuto" }]
 * - Per-language arrays: { en: ["Hello", "Help"], it: ["Ciao", "Aiuto"] }
 */
export type I18nArray = string[] | { [lang: string]: string }[] | { [lang: string]: string[] }

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
 * Theme options
 * - 'auto': follows system preference (prefers-color-scheme)
 * - 'light': always light mode
 * - 'dark': always dark mode
 */
export type Theme = 'auto' | 'light' | 'dark'

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
  windowMaxHeight: string | null // CSS value for max-height (e.g. '728px', '50%', '90vh', 'calc(100vh - 50px)')
  defaultOpen: boolean
  expandable: boolean
  unclosable: boolean

  // Appearance
  theme: Theme
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

  // Icon URL (backend only sends this if bot is PRO)
  icon: string | null

  // Branding (backend only sends this if bot is PRO)
  unbranded: boolean

  // Content
  name: I18nString
  messagePlaceholder: I18nString
  togglePlaceholder: I18nString
  welcomeMessage: I18nString | null
  suggestions: I18nArray
  toasts: I18nArray

  // Internationalization
  lang: string
  locales: string[]

  // Features
  showRating: boolean | number // true (default 90s), false (disabled), or number of seconds

  // Debug / development
  showSources: boolean
  showQueries: boolean
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
  windowMaxHeight: '728px',
  defaultOpen: true,
  expandable: true,
  unclosable: false,

  // Appearance
  theme: 'auto',
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

  // PRO features (backend only sends these if bot is PRO)
  icon: null,
  unbranded: false,

  // Content
  name: '',
  messagePlaceholder: {
    en: 'Ask anything',
    it: 'Chiedi qualsiasi cosa',
    es: 'Pregunta lo que quieras',
    fr: 'Demandez ce que vous voulez',
    de: 'Frag einfach',
    pt: 'Pergunte o que quiser',
  },
  togglePlaceholder: '',
  welcomeMessage: null,
  suggestions: [],
  toasts: [],

  // Internationalization
  lang: 'en',
  locales: ['en', 'it', 'es', 'fr', 'de', 'pt'],

  // Features
  showRating: true,

  // Debug / development
  showSources: false,
  showQueries: false,
}
