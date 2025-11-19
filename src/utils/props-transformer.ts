import { BotProps } from '../types/bot'
import { TolkiChatProps } from '../types/props'
import { HexColor, HexColorPair } from './color'

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

    // Toggle colors (button)
    if (chatStyles.button) {
      const { defaultBackgroundColor, hoverBackgroundColor, foregroundColor } =
        chatStyles.button

      // Toggle background color (with hover if available)
      if (defaultBackgroundColor) {
        if (hoverBackgroundColor) {
          props.toggleColor =
            `${defaultBackgroundColor},${hoverBackgroundColor}` as HexColorPair
        } else {
          props.toggleColor = defaultBackgroundColor as HexColor
        }
      }

      // Icon color (foreground color of toggle button)
      if (foregroundColor) {
        props.icon = foregroundColor as HexColor
      }
    }

    // Message bubble colors
    if (chatStyles.bubble) {
      const { backgroundColor, foregroundColor } = chatStyles.bubble

      // Message background color
      if (backgroundColor) {
        props.messageColor = backgroundColor as HexColor
      }

      // Note: foregroundColor from bubble is the text color inside the bubble,
      // which we don't currently have in our props system
      // We might want to add it in the future
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
