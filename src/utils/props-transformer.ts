import { BotProps } from '../types/bot'
import { TolkiChatProps } from '../types/props'
import { HexColor } from './color'

/**
 * Transform backend BotProps to TolkiChatProps format
 * Handles mapping from backend API structure to component props
 */
export function transformBotPropsToTolkiProps(
  botProps: BotProps,
  isPro: boolean = false
): Partial<TolkiChatProps> {
  const props: Partial<TolkiChatProps> = {}

  // Direct mappings
  if (botProps.avatar) {
    props.avatar = botProps.avatar
  }

  if (botProps.welcomeMessage) {
    props.welcomeMessage = botProps.welcomeMessage
  }

  if (botProps.suggestions && Array.isArray(botProps.suggestions)) {
    props.suggestions = botProps.suggestions
  }

  if (typeof botProps.defaultOpen === 'boolean') {
    props.defaultOpen = botProps.defaultOpen
  }

  // PRO-only props
  if (isPro) {
    if (typeof botProps.unbranded === 'boolean') {
      props.unbranded = botProps.unbranded
    }

    // Icon from backend (if it's a URL, it's PRO only)
    if (botProps.icon) {
      props.icon = botProps.icon
    }
  }

  // Extract colors from styles object
  if (botProps.styles?.chat) {
    const chatStyles = botProps.styles.chat

    // Toggle button colors
    if (chatStyles.button) {
      const { defaultBackgroundColor, foregroundColor } = chatStyles.button

      // Toggle background color (hover is auto-generated)
      if (defaultBackgroundColor) {
        props.toggleBackground = defaultBackgroundColor as HexColor
      }

      // Toggle content color (icon/dots color)
      if (foregroundColor) {
        props.toggleContent = foregroundColor as HexColor
      }
    }

    // Message bubble colors
    if (chatStyles.bubble) {
      const { backgroundColor, foregroundColor } = chatStyles.bubble

      // Message background color
      if (backgroundColor) {
        props.messageBackground = backgroundColor as HexColor
      }

      // Message content color (text inside bubble)
      if (foregroundColor) {
        props.messageContent = foregroundColor as HexColor
      }
    }
  }

  return props
}

/**
 * Determine if the bot is on PRO plan based on bot props
 * Uses isAdk flag or other indicators
 */
export function isBotPro(botProps: BotProps): boolean {
  // Use isAdk flag to determine PRO status
  // This might need to be adjusted based on actual backend logic
  return botProps.isAdk === true
}

/**
 * Split props into PRO-only and standard props
 * PRO-only props: unbranded, icon (when it's a URL)
 * Everything else goes to standard props
 */
export function splitPropsByPriority(props: Partial<TolkiChatProps>): {
  proProps: Partial<TolkiChatProps>
  standardProps: Partial<TolkiChatProps>
} {
  const proProps: Partial<TolkiChatProps> = {}
  const standardProps: Partial<TolkiChatProps> = {}

  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null) continue

    // PRO-only props: unbranded, icon (URL only)
    if (key === 'unbranded' || key === 'icon') {
      ;(proProps as any)[key] = value
      continue
    }

    // Everything else is standard (including colors!)
    ;(standardProps as any)[key] = value
  }

  return { proProps, standardProps }
}
