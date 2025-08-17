import { ActionResponse } from '../types/item'
import { ItemBuilder } from './item-builder'
import { HistoryManager } from './history-manager'
import { UUID } from '../utils/uuid'

// Simplified interface for chat operations
interface ChatOperations {
  addHeadingMessages(): Promise<void>
  saveSetting(key: string, value: unknown): void
  scrollToLastMessage(timeout?: number): void
  updateComplete: Promise<boolean>
  setChatId(chatId: string): void
}

/**
 * Service class to handle all chat commands
 * Uses HistoryManager for proper state management
 */
export class ChatCommandService {
  constructor(
    private chatOps: ChatOperations,
    private historyManager: HistoryManager
  ) {}

  /**
   * Show cart without removing notifications
   */
  showCart(): void {
    this.historyManager.addItem(ItemBuilder.cart())
    this.executeStandardFlow()
  }

  /**
   * Show cart and remove any existing cart notifications
   */
  showCartAndRemoveNotification(): void {
    // Remove cart notifications using the dedicated method
    this.historyManager.removeCartNotifications()
    this.historyManager.addItem(ItemBuilder.cart())
    this.executeStandardFlow()
  }

  /**
   * Reset the entire chat conversation
   */
  async resetChat(): Promise<void> {
    const newChatId = UUID()
    this.chatOps.setChatId(newChatId)
    this.chatOps.saveSetting('chat', newChatId)
    await this.chatOps.addHeadingMessages()
    this.historyManager.persist()
  }

  /**
   * Cancel an action and optionally remove it from history
   */
  cancelAction(_data?: any, actionToRemove?: ActionResponse): void {
    if (actionToRemove) {
      this.historyManager.removeItems(item => item === actionToRemove)
    }
  }

  /**
   * Standard flow: process history and scroll to last message
   * Uses HistoryManager for consistent state management
   */
  private executeStandardFlow(): void {
    this.historyManager.executeStandardFlow(() => {
      this.chatOps.updateComplete.then(() => {
        this.chatOps.scrollToLastMessage(100)
      })
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