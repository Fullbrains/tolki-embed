import { BotProps } from '../types/bot'
import { TolkiChatProps } from '../types/props'
import { HexColor } from './color'

/**
 * Transform backend BotProps (flat structure) to TolkiChatProps format
 */
export function transformBotPropsToTolkiProps(
  botProps: BotProps
): Partial<TolkiChatProps> {
  const props: Partial<TolkiChatProps> = {}

  // === Identity ===

  if (botProps.name) {
    props.name = botProps.name
  }

  if (botProps.avatar) {
    props.avatar = botProps.avatar
  }

  // === Behavior ===

  if (typeof botProps.defaultOpen === 'boolean') {
    props.defaultOpen = botProps.defaultOpen
  }

  if (typeof botProps.expandable === 'boolean') {
    props.expandable = botProps.expandable
  }

  if (typeof botProps.unclosable === 'boolean') {
    props.unclosable = botProps.unclosable
  }

  // === Content ===

  if (botProps.welcomeMessage) {
    props.welcomeMessage = botProps.welcomeMessage
  }

  if (botProps.suggestions) {
    props.suggestions = botProps.suggestions
  }

  if (botProps.toasts) {
    props.toasts = botProps.toasts
  }

  if (botProps.messagePlaceholder) {
    props.messagePlaceholder = botProps.messagePlaceholder
  }

  if (botProps.togglePlaceholder) {
    props.togglePlaceholder = botProps.togglePlaceholder
  }

  // === i18n ===

  if (botProps.lang) {
    props.lang = botProps.lang
  }

  if (botProps.locales && Array.isArray(botProps.locales)) {
    props.locales = botProps.locales
  }

  // === PRO ===

  if (botProps.icon) {
    props.icon = botProps.icon
  }

  if (typeof botProps.unbranded === 'boolean') {
    props.unbranded = botProps.unbranded
  }

  // === Layout & positioning ===

  if (botProps.position) {
    props.position = botProps.position
  }

  if (botProps.windowSize) {
    props.windowSize = botProps.windowSize
  }

  if (botProps.toggleSize) {
    props.toggleSize = botProps.toggleSize
  }

  // Margin: API sends marginX, marginY, marginLinked
  if (typeof botProps.marginX === 'number' || typeof botProps.marginY === 'number') {
    const x = botProps.marginX ?? 20
    const y = botProps.marginY ?? 20
    if (botProps.marginLinked || x === y) {
      props.margin = x
    } else {
      props.margin = [x, y]
    }
  }

  // === Appearance ===

  // theme (with legacy `dark` fallback)
  if (botProps.theme) {
    props.theme = botProps.theme
  } else if (botProps.dark) {
    props.theme = botProps.dark
  }

  if (botProps.rounded) {
    props.rounded = botProps.rounded
  }

  // === Toggle colors ===

  if (botProps.toggleBackground) {
    props.toggleBackground = botProps.toggleBackground as HexColor
  }

  if (botProps.toggleContent) {
    props.toggleContent = botProps.toggleContent as HexColor
  }

  // === Message colors ===

  if (botProps.messageBackground) {
    props.messageBackground = botProps.messageBackground as HexColor
  }

  if (botProps.messageContent) {
    props.messageContent = botProps.messageContent as HexColor
  }

  // === Backdrop ===

  if (botProps.backdropColor) {
    props.backdropColor = botProps.backdropColor as HexColor
  }

  if (typeof botProps.backdropOpacity === 'number') {
    props.backdropOpacity = botProps.backdropOpacity
  }

  if (botProps.backdropBlur) {
    props.backdropBlur = botProps.backdropBlur
  }

  // === Features ===

  if (typeof botProps.showFeedback === 'boolean') {
    props.showFeedback = botProps.showFeedback
  }

  if (typeof botProps.showRating === 'boolean' || typeof botProps.showRating === 'number') {
    props.showRating = botProps.showRating
  }

  if (typeof botProps.showSources === 'boolean') {
    props.showSources = botProps.showSources
  }

  if (typeof botProps.showQueries === 'boolean') {
    props.showQueries = botProps.showQueries
  }

  return props
}
