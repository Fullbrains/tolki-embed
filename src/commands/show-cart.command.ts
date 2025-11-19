import { Command } from '../services/command-registry'
import { CartHelpers } from '../utils/chat-helpers'

/**
 * Command to show cart in chat
 */
export class ShowCartCommand implements Command {
  name = 'show_cart'

  constructor(
    private getHistory: () => unknown[],
    private setHistory: (history: unknown[]) => void,
    private itemBuilder: { cart: () => unknown }
  ) {}

  validate(): boolean {
    return typeof window !== 'undefined' && window.tolki?.cart !== undefined
  }

  canExecute(): boolean {
    return CartHelpers.hasCartItems()
  }

  execute(): void {
    // Remove any existing cart messages (singleton behavior)
    const history = this.getHistory()
    const filteredHistory = history.filter(
      (item: any) => item.type !== 'cart'
    )

    // Add new cart message
    const newHistory = [...filteredHistory, this.itemBuilder.cart()]
    this.setHistory(newHistory)
  }
}
