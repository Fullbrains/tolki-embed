/**
 * Color utility functions using tinycolor2
 */
import tinycolor from 'tinycolor2'

export type HexColor = `#${string}`
export type HexColorPair = `${HexColor},${HexColor}`

/**
 * Get contrasting color (white or black) based on luminance
 * Returns white for dark colors, black for light colors
 */
export function getContrastColor(hex: string): '#ffffff' | '#000000' {
  const color = tinycolor(hex)
  // isLight() uses WCAG standards (luminance > 0.5)
  return color.isLight() ? '#000000' : '#ffffff'
}

/**
 * Generate hover color automatically
 * Darkens most colors for a "pressed" effect
 * Very dark colors (luminance < 0.1) are lightened instead
 * Uses 8% brightness adjustment for subtle hover effect
 */
export function generateHoverColor(hex: string): HexColor {
  const color = tinycolor(hex)
  const luminance = color.getLuminance()

  // Very dark colors: lighten instead of darken
  // Luminance < 0.05 means the color is too dark to darken further
  const adjusted = luminance < 0.05
    ? color.lighten(12)  // Lighten more for very dark colors (more visible)
    : color.darken(8)

  return adjusted.toHexString() as HexColor
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
  return tinycolor(color).isValid() && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color)
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
