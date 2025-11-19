/**
 * Color utility functions for hex color manipulation
 */

export type HexColor = `#${string}`
export type HexColorPair = `${HexColor},${HexColor}`

interface RGB {
  r: number
  g: number
  b: number
}

/**
 * Convert hex color to RGB values
 * Supports both #RGB and #RRGGBB formats
 */
export function hexToRgb(hex: string): RGB {
  // Remove # if present
  const cleanHex = hex.replace(/^#/, '')

  // Handle short format (#RGB)
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16)
    const g = parseInt(cleanHex[1] + cleanHex[1], 16)
    const b = parseInt(cleanHex[2] + cleanHex[2], 16)
    return { r, g, b }
  }

  // Handle standard format (#RRGGBB)
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16)
    const g = parseInt(cleanHex.substring(2, 4), 16)
    const b = parseInt(cleanHex.substring(4, 6), 16)
    return { r, g, b }
  }

  // Invalid hex, return black
  return { r: 0, g: 0, b: 0 }
}

/**
 * Convert RGB to hex color
 */
export function rgbToHex(r: number, g: number, b: number): HexColor {
  const toHex = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)))
    return clamped.toString(16).padStart(2, '0')
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}` as HexColor
}

/**
 * Calculate relative luminance of a color
 * Uses the formula: 0.2126 * R + 0.7152 * G + 0.0722 * B
 * Returns value between 0 (black) and 1 (white)
 */
export function getLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex)

  // Normalize to 0-1 range
  const normalize = (val: number) => {
    const normalized = val / 255
    // Apply sRGB gamma correction
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4)
  }

  const rNorm = normalize(r)
  const gNorm = normalize(g)
  const bNorm = normalize(b)

  return 0.2126 * rNorm + 0.7152 * gNorm + 0.0722 * bNorm
}

/**
 * Get contrasting color (white or black) based on luminance
 * Returns white for dark colors, black for light colors
 */
export function getContrastColor(hex: string): '#ffffff' | '#000000' {
  const luminance = getLuminance(hex)
  // Threshold at 0.5 for optimal contrast
  return luminance > 0.5 ? '#000000' : '#ffffff'
}

/**
 * Adjust brightness of a color by a percentage
 * Positive values lighten, negative values darken
 * @param hex - Hex color to adjust
 * @param percent - Percentage to adjust (-100 to 100)
 */
export function adjustBrightness(hex: string, percent: number): HexColor {
  const { r, g, b } = hexToRgb(hex)

  const adjust = (value: number) => {
    const adjusted = value + (value * percent) / 100
    return Math.max(0, Math.min(255, adjusted))
  }

  return rgbToHex(adjust(r), adjust(g), adjust(b))
}

/**
 * Generate hover color automatically based on luminance
 * Dark colors are lightened, light colors are darkened
 */
export function generateHoverColor(hex: string): HexColor {
  const luminance = getLuminance(hex)

  // For dark colors (luminance < 0.5), lighten by 15%
  // For light colors (luminance >= 0.5), darken by 15%
  const percent = luminance < 0.5 ? 15 : -15

  return adjustBrightness(hex, percent)
}

/**
 * Parse HexColorPair string into default and hover colors
 * If only one color is provided, generates hover color automatically
 */
export function parseHexColorPair(
  value: string | null | undefined
): { default: HexColor; hover: HexColor } | null {
  if (!value) return null

  // Check if it's a pair (contains comma)
  if (value.includes(',')) {
    const [defaultColor, hoverColor] = value.split(',').map((c) => c.trim())
    return {
      default: defaultColor as HexColor,
      hover: hoverColor as HexColor,
    }
  }

  // Single color - generate hover automatically
  const defaultColor = value.trim() as HexColor
  return {
    default: defaultColor,
    hover: generateHoverColor(defaultColor),
  }
}

/**
 * Validate if a string is a valid hex color
 */
export function isValidHexColor(color: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color)
}

/**
 * Validate if a string is a valid hex color pair
 */
export function isValidHexColorPair(value: string): boolean {
  if (!value.includes(',')) {
    return isValidHexColor(value)
  }

  const [color1, color2] = value.split(',').map((c) => c.trim())
  return isValidHexColor(color1) && isValidHexColor(color2)
}
