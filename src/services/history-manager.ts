import { Item, ItemType } from '../types/item'

/**
 * Centralized history management service
 * Handles all chat history operations with proper state management
 */
export class HistoryManager {
  constructor(
    private getHistory: () => Item[],
    private setHistory: (history: Item[]) => void,
    private persistHistory: (history: Item[]) => void
  ) {}

  /**
   * Add a single item to history
   */
  addItem(item: Item): void {
    const history = this.getHistory()
    history.push(item)
    this.setHistory(history)
  }

  /**
   * Add multiple items to history
   */
  addItems(items: Item[]): void {
    const history = this.getHistory()
    history.push(...items)
    this.setHistory(history)
  }

  /**
   * Remove items based on predicate function
   */
  removeItems(predicate: (item: Item) => boolean): void {
    const history = this.getHistory()
    const filtered = history.filter(item => !predicate(item))
    this.setHistory(filtered)
  }

  /**
   * Replace entire history
   */
  replaceHistory(newHistory: Item[]): void {
    this.setHistory([...newHistory])
  }

  /**
   * Clear temporary items (thinking, cart notifications)
   */
  clearTemporaryItems(): void {
    this.removeItems(item => 
      item.type === ItemType.thinking || 
      item.type === ItemType.cartNotification
    )
  }

  /**
   * Get items that should be persisted (exclude temporary items)
   */
  getPersistableItems(): Item[] {
    const history = this.getHistory()
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
   * Persist current history to storage
   */
  persist(): void {
    const persistableItems = this.getPersistableItems()
    this.persistHistory(persistableItems)
  }

  /**
   * Remove cart notifications (both old and new types)
   */
  removeCartNotifications(): void {
    this.removeItems(item => {
      const isOldCartNotification = item.type === ItemType.action && 
        item.data && 
        typeof item.data === 'object' && 
        'isCartNotification' in item.data && 
        item.data.isCartNotification === true
      
      const isNewCartNotification = item.type === ItemType.cartNotification
      
      return isOldCartNotification || isNewCartNotification
    })
  }

  /**
   * Standard flow: clear temporary items, persist, then execute callback
   */
  executeStandardFlow(callback?: () => void): void {
    this.clearTemporaryItems()
    this.persist()
    if (callback) {
      callback()
    }
  }

  /**
   * Get current history (readonly copy)
   */
  getCurrentHistory(): readonly Item[] {
    return [...this.getHistory()]
  }

  /**
   * Check if history is empty
   */
  isEmpty(): boolean {
    return this.getHistory().length === 0
  }

  /**
   * Get last item in history
   */
  getLastItem(): Item | undefined {
    const history = this.getHistory()
    return history[history.length - 1]
  }
}