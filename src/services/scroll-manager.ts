/**
 * Service class to handle all scroll-related functionality
 * Extracted from TolkiChat component for better separation of concerns
 */
export class ScrollManager {
  constructor(
    private logElement: HTMLDivElement,
    private getAtBottomState: () => boolean,
    private setScrollState: (showScrollDown: boolean, atBottom: boolean) => void
  ) {}

  /**
   * Scroll to the bottom of the chat log
   */
  scrollToBottom(timeout: number = 500): void {
    setTimeout(() => {
      const top = this.logElement.scrollHeight - (this.logElement.clientHeight - 80)
      this.logElement.scrollTo({
        top,
        behavior: 'smooth',
      })
    }, timeout)
  }

  /**
   * Scroll to the last message in the chat
   */
  scrollToLastMessage(timeout: number = 500, animated: boolean = true): void {
    setTimeout(() => {
      const chatItems = this.logElement.querySelectorAll('.tk__chat-item')
      if (chatItems.length > 0) {
        const lastMessage = chatItems[chatItems.length - 1] as HTMLElement
        const messageTop = lastMessage.offsetTop - 20 - 60 // 20px log padding + 60px extra space
        this.logElement.scrollTo({
          top: Math.max(0, messageTop),
          behavior: animated ? 'smooth' : 'auto',
        })
      }
    }, timeout)
  }

  /**
   * Auto-scroll to bottom if user is already at bottom
   */
  autoScrollToBottom(updateComplete: Promise<void>): void {
    if (this.getAtBottomState()) {
      updateComplete.then(() => {
        this.scrollToLastMessage()
      })
    }
  }

  /**
   * Handle log scroll events to update scroll state
   */
  handleLogScroll(): void {
    const scrollHeight = this.logElement.scrollHeight
    const scrollTop = this.logElement.scrollTop
    const clientHeight = this.logElement.clientHeight
    const offsetFromBottom = scrollHeight - (scrollTop + clientHeight)
    
    const showScrollDown = offsetFromBottom > 200
    const atBottom = offsetFromBottom <= 50
    
    this.setScrollState(showScrollDown, atBottom)
  }

  /**
   * Create scroll event handler that can be used with addEventListener
   */
  createScrollHandler(): () => void {
    return () => this.handleLogScroll()
  }
}