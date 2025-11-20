import { I18nString, I18nArray } from '../types/props'
import { isValidHexColor, isValidHexColorPair } from './color'

/**
 * Parse boolean attribute value
 * Handles: "true", "false", "", true, false
 */
export function parseBoolean(value: string | boolean | null | undefined): boolean {
  if (typeof value === 'boolean') return value
  if (value === null || value === undefined) return false
  if (value === '') return true // Empty attribute means true
  return value.toLowerCase() === 'true'
}

/**
 * Parse string attribute value
 * Returns null if empty or undefined
 */
export function parseString(value: string | null | undefined): string | null {
  if (!value || value.trim() === '') return null
  return value.trim()
}

/**
 * Parse number attribute value
 */
export function parseNumber(value: string | number | null | undefined): number | null {
  if (typeof value === 'number') return value
  if (!value) return null
  const parsed = parseFloat(value)
  return isNaN(parsed) ? null : parsed
}

/**
 * Parse margin attribute value
 * Supports:
 * - Single number: "20" → 20
 * - Comma-separated: "20,30" → [20, 30] (x, y)
 * - JSON array: "[20,30]" → [20, 30]
 */
export function parseMargin(value: string | number | null | undefined): number | [number, number] | null {
  if (typeof value === 'number') return value
  if (!value) return null

  const trimmed = value.trim()

  // Try JSON array format first
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const parsed = tryParseJSON<number[]>(trimmed)
    if (parsed && Array.isArray(parsed) && parsed.length === 2) {
      return [parsed[0], parsed[1]]
    }
  }

  // Try comma-separated format
  if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map(p => parseFloat(p.trim()))
    if (parts.length === 2 && !parts.some(isNaN)) {
      return [parts[0], parts[1]]
    }
  }

  // Try single number
  const single = parseFloat(trimmed)
  return isNaN(single) ? null : single
}

/**
 * Try to parse JSON, return null if invalid
 */
function tryParseJSON<T = unknown>(value: string): T | null {
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

/**
 * Parse I18n string attribute
 * Supports:
 * - Plain string: "Hello"
 * - JSON object: '{"en":"Hello","it":"Ciao"}'
 * - Pipe format: "en:Hello|it:Ciao"
 */
export function parseI18nString(value: string | null | undefined): I18nString | null {
  if (!value || value.trim() === '') return null

  const trimmed = value.trim()

  // Try JSON first
  const jsonResult = tryParseJSON<{ [lang: string]: string }>(trimmed)
  if (jsonResult && typeof jsonResult === 'object' && !Array.isArray(jsonResult)) {
    return jsonResult
  }

  // Try pipe format: "en:Hello|it:Ciao"
  if (trimmed.includes(':') && trimmed.includes('|')) {
    const result: { [lang: string]: string } = {}
    const parts = trimmed.split('|')
    for (const part of parts) {
      const [lang, ...textParts] = part.split(':')
      if (lang && textParts.length > 0) {
        result[lang.trim()] = textParts.join(':').trim()
      }
    }
    if (Object.keys(result).length > 0) {
      return result
    }
  }

  // Return as plain string
  return trimmed
}

/**
 * Parse I18n array attribute
 * Supports:
 * - Comma-separated list: "item1,item2,item3"
 * - JSON array: '["item1","item2","item3"]'
 * - JSON i18n array: '[{"en":"Hi","it":"Ciao"}]'
 * - Pipe format: "en:Hi|it:Ciao,en:Hello|it:Salve"
 */
export function parseI18nArray(value: string | null | undefined): I18nArray {
  if (!value || value.trim() === '') return []

  const trimmed = value.trim()

  // Try JSON first
  const jsonResult = tryParseJSON<string[] | { [lang: string]: string }[]>(trimmed)
  if (jsonResult && Array.isArray(jsonResult)) {
    return jsonResult
  }

  // Try comma-separated list (could be pipe format or plain strings)
  if (trimmed.includes(',')) {
    const items = trimmed.split(',').map((item) => item.trim()).filter(Boolean)

    // Check if any item uses pipe format
    const hasPipeFormat = items.some(item => item.includes(':') && item.includes('|'))

    if (hasPipeFormat) {
      // Parse all items as i18n objects (convert plain strings to single-key objects)
      const i18nArray: { [lang: string]: string }[] = []
      for (const item of items) {
        if (item.includes(':') && item.includes('|')) {
          const result: { [lang: string]: string } = {}
          const parts = item.split('|')
          for (const part of parts) {
            const [lang, ...textParts] = part.split(':')
            if (lang && textParts.length > 0) {
              result[lang.trim()] = textParts.join(':').trim()
            }
          }
          i18nArray.push(result)
        } else {
          // Plain string - treat as default language
          i18nArray.push({ en: item })
        }
      }
      return i18nArray
    }

    return items
  }

  // Single item (could be pipe format or plain string)
  if (trimmed.includes(':') && trimmed.includes('|')) {
    const result: { [lang: string]: string } = {}
    const parts = trimmed.split('|')
    for (const part of parts) {
      const [lang, ...textParts] = part.split(':')
      if (lang && textParts.length > 0) {
        result[lang.trim()] = textParts.join(':').trim()
      }
    }
    if (Object.keys(result).length > 0) {
      return [result]
    }
  }

  // Single plain string
  return trimmed ? [trimmed] : []
}

/**
 * Parse string array attribute
 * Supports:
 * - Comma-separated list: "en,it,es"
 * - JSON array: '["en","it","es"]'
 */
export function parseStringArray(value: string | null | undefined): string[] {
  if (!value || value.trim() === '') return []

  // Try JSON first
  const jsonResult = tryParseJSON<string[]>(value)
  if (jsonResult && Array.isArray(jsonResult)) {
    return jsonResult
  }

  // Try comma-separated list (DSL)
  if (value.includes(',')) {
    return value.split(',').map((item) => item.trim()).filter(Boolean)
  }

  // Single item
  return value.trim() ? [value.trim()] : []
}

/**
 * Validate and parse hex color or color pair
 * Returns null if invalid
 */
export function parseHexColor(value: string | null | undefined): string | null {
  if (!value || value.trim() === '') return null

  const trimmed = value.trim()

  // Validate single color or color pair
  if (!isValidHexColorPair(trimmed)) {
    return null
  }

  return trimmed
}

/**
 * Parse enum value with validation
 * Returns null if value is not in allowed values
 */
export function parseEnum<T extends string>(
  value: string | null | undefined,
  allowedValues: readonly T[]
): T | null {
  if (!value) return null
  const trimmed = value.trim() as T
  return allowedValues.includes(trimmed) ? trimmed : null
}

/**
 * Attribute name conversion
 * Converts kebab-case to camelCase
 * Examples: "default-open" -> "defaultOpen", "toggle-color" -> "toggleColor"
 */
export function attrNameToPropName(attrName: string): string {
  return attrName.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * Property name to attribute name conversion
 * Converts camelCase to kebab-case
 */
export function propNameToAttrName(propName: string): string {
  return propName.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
}
