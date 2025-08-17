import { ItemType, ActionResponse } from '../types/item'
import { ItemBuilder } from './item-builder'
import { UUID } from '../utils/uuid'

// Interface for the chat component to avoid circular imports
interface ChatComponent {
  clearHistory(): void
  saveHistory(): void
  addHeadingMessages(): Promise<void>
  saveSetting(key: string, value: unknown): void
  scrollToLastMessage(timeout?: number): void
  updateComplete: Promise<boolean>
}

// Interface for the state object
interface ChatState {
  history: any[]
  chat: string
}

/**
 * Service class to handle all chat commands
 * Extracted from TolkiChat component for better separation of concerns
 */
export class ChatCommandService {
  constructor(
    private chatComponent: ChatComponent,
    private state: ChatState
  ) {}

  /**
   * Show cart without removing notifications
   */
  showCart(): void {
    this.state.history.push(ItemBuilder.cart())
    this.executeStandardFlow()
  }

  /**
   * Show cart and remove any existing cart notifications
   */
  showCartAndRemoveNotification(): void {
    // Remove cart notification from history (both old action type and new cartNotification type)
    this.state.history = this.state.history.filter((item) => {
      return !(
        (item.type === ItemType.action && item.data?.isCartNotification) ||
        item.type === ItemType.cartNotification
      )
    })
    this.state.history.push(ItemBuilder.cart())
    this.executeStandardFlow()
  }

  /**
   * Reset the entire chat conversation
   */
  async resetChat(): Promise<void> {
    this.state.chat = UUID()
    this.chatComponent.saveSetting('chat', this.state.chat)
    await this.chatComponent.addHeadingMessages()
    this.chatComponent.saveSetting('history', this.state.history)
  }

  /**
   * Cancel an action and optionally remove it from history
   */
  cancelAction(data?: any, actionToRemove?: ActionResponse): void {
    if (actionToRemove) {
      this.state.history = this.state.history.filter((item) => item !== actionToRemove)
    }
  }

  /**
   * Standard flow: clear history, save, and scroll to last message
   * Common pattern used by multiple commands
   */
  private executeStandardFlow(): void {
    this.chatComponent.clearHistory()
    this.chatComponent.saveHistory()
    this.chatComponent.updateComplete.then(() => {
      this.chatComponent.scrollToLastMessage(100)
    })
  }
}

/**
 * Factory function to create the global ActionCommands object
 * This maintains backward compatibility with existing template code
 */
export function createActionCommands(commandService: ChatCommandService) {
  return {
    showCart: () => commandService.showCart(),
    showCartAndRemoveNotification: () => commandService.showCartAndRemoveNotification(),
    resetChat: () => commandService.resetChat(),
    cancelAction: (data?: any, actionToRemove?: ActionResponse) => 
      commandService.cancelAction(data, actionToRemove),
  }
}