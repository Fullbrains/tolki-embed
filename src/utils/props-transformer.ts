import { BotProps, StylesConfig } from '../types/bot'
import { TolkiChatProps } from '../types/props'
import { HexColor } from './color'
import { Logger } from '../services/logger'

/**
 * Transform backend BotProps to TolkiChatProps format
 * Handles mapping from backend API structure to component props
 * Supports both new structure and legacy fallback
 */
export function transformBotPropsToTolkiProps(
  botProps: BotProps
): Partial<TolkiChatProps> {
  const props: Partial<TolkiChatProps> = {}

  // === Direct mappings (root props) ===

  if (botProps.avatar) {
    props.avatar = botProps.avatar
  }

  if (botProps.welcomeMessage) {
    props.welcomeMessage = botProps.welcomeMessage
  }

  if (botProps.suggestions && Array.isArray(botProps.suggestions)) {
    props.suggestions = botProps.suggestions
  }

  if (botProps.toasts && Array.isArray(botProps.toasts)) {
    props.toasts = botProps.toasts
  }

  if (typeof botProps.defaultOpen === 'boolean') {
    props.defaultOpen = botProps.defaultOpen
  }

  if (typeof botProps.expandable === 'boolean') {
    props.expandable = botProps.expandable
  }

  if (typeof botProps.unclosable === 'boolean') {
    props.unclosable = botProps.unclosable
  }

  if (botProps.messagePlaceholder) {
    props.messagePlaceholder = botProps.messagePlaceholder
  }

  if (botProps.togglePlaceholder) {
    props.togglePlaceholder = botProps.togglePlaceholder
  }

  if (botProps.lang) {
    props.lang = botProps.lang
  }

  if (botProps.locales && Array.isArray(botProps.locales)) {
    props.locales = botProps.locales
  }

  // === PRO props (backend only sends these if bot is PRO) ===

  if (botProps.icon) {
    props.icon = botProps.icon
  }

  if (typeof botProps.unbranded === 'boolean') {
    props.unbranded = botProps.unbranded
  }

  // === Extract from styles ===

  if (botProps.styles) {
    const styles = botProps.styles
    const isLegacy = hasLegacyStructure(styles)

    if (isLegacy) {
      Logger.warn(
        'Deprecated: Using legacy styles.chat.* structure. Please migrate to new styles.toggle.*, styles.message.* structure.'
      )
    }

    // Global styles
    props.position = getStyleValue(styles, 'position', null) ?? undefined
    props.margin = getMarginValue(styles)
    props.dark = getStyleValue(styles, 'dark', null) ?? undefined
    props.rounded = getStyleValue(styles, 'rounded', null) ?? undefined

    // Toggle styles
    props.toggleSize = getStyleValue(styles, 'toggle.size', null) ?? undefined
    props.toggleBackground = getToggleBackground(styles)
    props.toggleContent = getToggleForeground(styles)

    // Window styles
    props.windowSize = getStyleValue(styles, 'window.size', null) ?? undefined

    // Message styles
    props.messageBackground = getMessageBackground(styles)
    props.messageContent = getMessageForeground(styles)

    // Backdrop styles
    props.backdropColor = getStyleValue(styles, 'backdrop.color', null)
    props.backdropOpacity = getStyleValue(styles, 'backdrop.opacity', null) ?? undefined
    props.backdropBlur = getStyleValue(styles, 'backdrop.blur', null) ?? undefined
  }

  return props
}

// === Helper functions ===

/**
 * Check if styles use legacy structure
 */
function hasLegacyStructure(styles: StylesConfig): boolean {
  return !!(styles.chat?.button || styles.chat?.bubble)
}

/**
 * Get a value from nested path with type safety
 */
function getStyleValue<T>(
  styles: StylesConfig,
  path: string,
  defaultValue: T
): T {
  const parts = path.split('.')
  let value: unknown = styles

  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = (value as Record<string, unknown>)[part]
    } else {
      return defaultValue
    }
  }

  return (value as T) ?? defaultValue
}

/**
 * Get toggle background color (new structure or legacy fallback)
 */
function getToggleBackground(styles: StylesConfig): HexColor | undefined {
  // New structure (priority)
  if (styles.toggle?.background) {
    return styles.toggle.background
  }
  // Legacy fallback
  if (styles.chat?.button?.defaultBackgroundColor) {
    return styles.chat.button.defaultBackgroundColor as HexColor
  }
  return undefined
}

/**
 * Get toggle foreground color (new structure or legacy fallback)
 */
function getToggleForeground(styles: StylesConfig): HexColor | null | undefined {
  // New structure (priority)
  if (styles.toggle && 'foreground' in styles.toggle) {
    return styles.toggle.foreground
  }
  // Legacy fallback
  if (styles.chat?.button?.foregroundColor) {
    return styles.chat.button.foregroundColor as HexColor
  }
  return undefined
}

/**
 * Get message background color (new structure or legacy fallback)
 */
function getMessageBackground(styles: StylesConfig): HexColor | undefined {
  // New structure (priority)
  if (styles.message?.background) {
    return styles.message.background
  }
  // Legacy fallback
  if (styles.chat?.bubble?.backgroundColor) {
    return styles.chat.bubble.backgroundColor as HexColor
  }
  return undefined
}

/**
 * Get message foreground color (new structure or legacy fallback)
 */
function getMessageForeground(styles: StylesConfig): HexColor | null | undefined {
  // New structure (priority)
  if (styles.message && 'foreground' in styles.message) {
    return styles.message.foreground
  }
  // Legacy fallback
  if (styles.chat?.bubble?.foregroundColor) {
    return styles.chat.bubble.foregroundColor as HexColor
  }
  return undefined
}

/**
 * Get margin value (number or tuple)
 */
function getMarginValue(styles: StylesConfig): number | [number, number] | undefined {
  const margin = styles.margin
  if (typeof margin === 'number') {
    return margin
  }
  if (Array.isArray(margin) && margin.length === 2) {
    return margin as [number, number]
  }
  return undefined
}
