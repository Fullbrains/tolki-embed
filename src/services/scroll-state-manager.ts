/**
 * Interface for scroll state
 */
export interface ScrollState {
  showScrollDown: boolean
  atBottom: boolean
}

/**
 * Configuration for scroll thresholds
 */
export interface ScrollThresholds {
  showButtonThreshold: number
  atBottomThreshold: number
}

/**
 * Service to manage scroll state and behaviors
 * Separated from DOM manipulation for better testability
 */
export class ScrollStateManager {
  private state: ScrollState = {
    showScrollDown: false,
    atBottom: true
  }

  private listeners: Array<(state: ScrollState) => void> = []

  private thresholds: ScrollThresholds = {
    showButtonThreshold: 200,
    atBottomThreshold: 50
  }

  constructor(thresholds?: Partial<ScrollThresholds>) {
    if (thresholds) {
      this.thresholds = { ...this.thresholds, ...thresholds }
    }
  }

  /**
   * Calculate scroll state based on scroll metrics
   */
  updateState(scrollTop: number, scrollHeight: number, clientHeight: number): void {
    const offsetFromBottom = scrollHeight - (scrollTop + clientHeight)

    const newState: ScrollState = {
      showScrollDown: offsetFromBottom > this.thresholds.showButtonThreshold,
      atBottom: offsetFromBottom <= this.thresholds.atBottomThreshold
    }

    // Only notify if state actually changed
    if (this.hasStateChanged(newState)) {
      this.state = newState
      this.notifyListeners()
    }
  }

  /**
   * Get current scroll state
   */
  getState(): ScrollState {
    return { ...this.state }
  }

  /**
   * Check if user is at bottom
   */
  isAtBottom(): boolean {
    return this.state.atBottom
  }

  /**
   * Check if should show scroll down button
   */
  shouldShowScrollDown(): boolean {
    return this.state.showScrollDown
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(listener: (state: ScrollState) => void): () => void {
    this.listeners.push(listener)
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Reset state to defaults
   */
  reset(): void {
    this.state = {
      showScrollDown: false,
      atBottom: true
    }
    this.notifyListeners()
  }

  /**
   * Check if state has actually changed
   */
  private hasStateChanged(newState: ScrollState): boolean {
    return (
      this.state.showScrollDown !== newState.showScrollDown ||
      this.state.atBottom !== newState.atBottom
    )
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state))
  }
}