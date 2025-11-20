/**
 * Default colors and type definitions
 */
import tinycolor from 'tinycolor2'

/**
 * Color pair type for default and hover states (used internally for hover generation)
 */
export interface ColorPair {
  default: string
  hover: string
}

/**
 * Default color values for the Tolki Chat component
 * These are fallback values when no props are provided
 */
const DEFAULT_BG = '#001ccb'
const DEFAULT_FG = '#ffffff'

export const defaultColors = {
  // Toggle button colors
  'toggle-background': DEFAULT_BG,
  'toggle-hover': tinycolor(DEFAULT_BG).brighten(8).toHexString(),
  'toggle-content': DEFAULT_FG, // Fallback only, auto-detected based on toggleBackground

  // User message bubble colors
  'message-background': DEFAULT_BG,
  'message-content': DEFAULT_FG, // Fallback only, auto-detected based on messageBackground

  // Bot message colors (not customizable via props)
  'bot-background': '#f3f4f6', // gray-100
  'bot-content': '#1f2937', // gray-800
} as const

export type DefaultColorKey = keyof typeof defaultColors
