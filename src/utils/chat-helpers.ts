import { Item, ItemType } from '../types/item'
import { ItemBuilder } from '../services/item-builder'

/**
 * Helper utilities for chat functionality
 * Extracted from TolkiChat component for better reusability
 */
export class ChatHelpers {
  /**
   * Standard flow for clearing and saving history with scroll
   */
  static clearAndSaveHistory(
    clearHistoryFn: () => void,
    saveHistoryFn: () => void,
    scrollFn: () => void,
    updateComplete: Promise<void>
  ): void {
    clearHistoryFn()
    saveHistoryFn()
    updateComplete.then(() => {
      scrollFn()
    })
  }

  /**
   * Create cart notification based on current cart state
   */
  static createCartNotification(): Item | null {
    const cartData = window.tolki?.cart
    const itemCount = cartData?.items?.length || 0
    const isLoading = cartData?.status === 'loading'
    
    if (itemCount > 0 || isLoading) {
      return ItemBuilder.cartNotification()
    }
    
    return null
  }

  /**
   * Filter history to remove temporary items (thinking, cart notifications)
   */
  static filterHistoryForPersistence(history: Item[]): Item[] {
    return history.filter((item: Item) => {
      return (
        item.type === ItemType.action ||
        item.type === ItemType.card ||
        item.type === ItemType.markdown ||
        item.type === ItemType.product ||
        item.type === ItemType.cart ||
        item.type === ItemType.userInput
      )
    })
  }

  /**
   * Filter history to remove thinking and cart notification items
   */
  static filterHistoryForDisplay(history: Item[]): Item[] {
    return history.filter(
      (item) => item.type !== ItemType.thinking && item.type !== ItemType.cartNotification
    )
  }

  /**
   * Get color variables for styling based on bot configuration
   */
  static getColorVariables(botProps?: any): string {
    if (!botProps?.styles?.chat) return ''

    const styles = botProps.styles.chat
    const map: { [key: string]: string } = {}
    
    // Default color imports would need to be passed as parameters
    // For now, using fallback colors
    map['toggle-default-background'] = styles?.button?.defaultBackgroundColor || '#3b82f6'
    map['toggle-hover-background'] = styles?.button?.hoverBackgroundColor || '#2563eb'
    map['toggle-dots-background'] = styles?.button?.foregroundColor || '#f8fafc'
    map['bubble-background'] = styles?.bubble?.backgroundColor || '#2563eb'
    map['bubble-color'] = styles?.bubble?.foregroundColor || '#ffffff'

    return Object.keys(map)
      .map((key: string) => `--${key}:${map[key]}`)
      .join(';')
  }

  /**
   * Validate and normalize UUID
   */
  static validateAndNormalizeUUID(uuid: string, fallbackGenerator: () => string): string {
    // This would use the validateUUID function from utils/uuid
    // For now, simple check
    if (!uuid || uuid.length < 10) {
      return fallbackGenerator()
    }
    return uuid
  }

  /**
   * Extract command and display text from suggestion
   */
  static extractSuggestionCommand(suggestionText: string): {
    command: string | null
    displayText: string
  } {
    const commandMatch = suggestionText.match(/\[([^\]]+)\]/)

    if (!commandMatch) {
      return { command: null, displayText: suggestionText }
    }

    const command = commandMatch[1]
    const textBeforeCommand = suggestionText
      .substring(0, commandMatch.index)
      .trim()

    // If there's text before the command, use that as display text
    if (textBeforeCommand) {
      return { command, displayText: textBeforeCommand }
    }

    // If only command, return the command itself as display text
    // The actual translation will be handled by the component
    return { command, displayText: command }
  }
}