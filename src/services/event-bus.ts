/**
 * Simple event bus for global events
 * Provides type-safe event handling
 */
export class EventBus {
  private static instance: EventBus
  private listeners: Map<string, Set<(...args: unknown[]) => void>> = new Map()

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus()
    }
    return EventBus.instance
  }

  /**
   * Subscribe to an event
   * Returns unsubscribe function
   */
  on(event: string, handler: (...args: unknown[]) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }

    this.listeners.get(event)!.add(handler)

    // Return unsubscribe function
    return () => this.off(event, handler)
  }

  /**
   * Unsubscribe from an event
   */
  off(event: string, handler: (...args: unknown[]) => void): void {
    const handlers = this.listeners.get(event)
    if (handlers) {
      handlers.delete(handler)
      if (handlers.size === 0) {
        this.listeners.delete(event)
      }
    }
  }

  /**
   * Emit an event
   */
  emit(event: string, ...args: unknown[]): void {
    const handlers = this.listeners.get(event)
    if (handlers) {
      handlers.forEach((handler) => handler(...args))
    }
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event)
    } else {
      this.listeners.clear()
    }
  }

  /**
   * Get number of listeners for an event
   */
  listenerCount(event: string): number {
    return this.listeners.get(event)?.size || 0
  }
}

// Create global instance for backward compatibility with window events
const eventBus = EventBus.getInstance()

// Bridge window events to event bus
if (typeof window !== 'undefined') {
  // Listen for window events and forward to event bus
  window.addEventListener('tolki:update', () => eventBus.emit('tolki:update'))
  window.addEventListener('tolki:cart:loaded', () =>
    eventBus.emit('tolki:cart:loaded')
  )

  // Expose update function on window.tolki
  if (!window.tolki) {
    window.tolki = {}
  }
  window.tolki.update = () => {
    window.dispatchEvent(new Event('tolki:update'))
  }
}

export { eventBus }
