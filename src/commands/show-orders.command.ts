import { Command } from '../services/command-registry'

/**
 * Command to show orders in chat
 */
export class ShowOrdersCommand implements Command {
  name = 'show_orders'

  constructor(
    private getHistory: () => unknown[],
    private setHistory: (history: unknown[]) => void,
    private itemBuilder: { orders: () => unknown }
  ) {}

  validate(): boolean {
    return typeof window !== 'undefined' && window.tolki?.orders !== undefined
  }

  canExecute(): boolean {
    const ordersData = window.tolki?.orders
    if (!ordersData) return false

    // Check if there are any orders
    const totalOrders = Object.values(ordersData).flat().length
    return totalOrders > 0
  }

  execute(): void {
    // Remove any existing orders messages (singleton behavior)
    const history = this.getHistory()
    const filteredHistory = history.filter(
      (item: any) => item.type !== 'orders'
    )

    // Add new orders message
    const newHistory = [...filteredHistory, this.itemBuilder.orders()]
    this.setHistory(newHistory)
  }
}
