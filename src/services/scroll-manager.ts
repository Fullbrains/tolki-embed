import { ScrollStateManager } from './scroll-state-manager'

/**
 * Service class to handle scroll operations on DOM elements
 * Focused purely on DOM manipulation, state is managed separately
 */
export class ScrollManager {
  private readonly CHAT_ITEM_SELECTOR = '.tk__chat-item'
  private readonly BOTTOM_OFFSET = 80 // Space from bottom
  private readonly MESSAGE_PADDING = 20 // Padding around messages
  private readonly EXTRA_SPACE = 60 // Extra space for smooth scrolling

  constructor(
    private container: HTMLElement,
    private scrollStateManager: ScrollStateManager
  ) {}

  /**
   * Scroll to the bottom of the container
   */
  scrollToBottom(timeout: number = 500, smooth: boolean = true): void {
    setTimeout(() => {
      const top = this.container.scrollHeight - (this.container.clientHeight - this.BOTTOM_OFFSET)
      this.container.scrollTo({
        top,
        behavior: smooth ? 'smooth' : 'auto',
      })
    }, timeout)
  }

  /**
   * Scroll to the last message in the chat
   */
  scrollToLastMessage(timeout: number = 500, animated: boolean = true): void {
    setTimeout(() => {
      const chatItems = this.container.querySelectorAll(this.CHAT_ITEM_SELECTOR)
      if (chatItems.length > 0) {
        const lastMessage = chatItems[chatItems.length - 1] as HTMLElement
        const messageTop = lastMessage.offsetTop - this.MESSAGE_PADDING - this.EXTRA_SPACE
        this.container.scrollTo({
          top: Math.max(0, messageTop),
          behavior: animated ? 'smooth' : 'auto',
        })
      }
    }, timeout)
  }

  /**
   * Scroll to a specific element within the container
   */
  scrollToElement(element: HTMLElement, animated: boolean = true, offset: number = 0): void {
    const elementTop = element.offsetTop - offset
    this.container.scrollTo({
      top: Math.max(0, elementTop),
      behavior: animated ? 'smooth' : 'auto',
    })
  }

  /**
   * Auto-scroll to bottom if user is at bottom (conditional scroll)
   */
  autoScrollToBottom(delay: number = 0): void {
    if (this.scrollStateManager.isAtBottom()) {
      setTimeout(() => {
        this.scrollToLastMessage(0)
      }, delay)
    }
  }

  /**
   * Handle scroll events and update state manager
   */
  handleScroll(): void {
    const { scrollTop, scrollHeight, clientHeight } = this.container
    this.scrollStateManager.updateState(scrollTop, scrollHeight, clientHeight)
  }

  /**
   * Create bound scroll event handler
   */
  createScrollHandler(): (event: Event) => void {
    return (event: Event) => {
      event.preventDefault()
      this.handleScroll()
    }
  }

  /**
   * Get current scroll position info
   */
  getScrollInfo(): {
    scrollTop: number
    scrollHeight: number
    clientHeight: number
    offsetFromBottom: number
  } {
    const { scrollTop, scrollHeight, clientHeight } = this.container
    return {
      scrollTop,
      scrollHeight,
      clientHeight,
      offsetFromBottom: scrollHeight - (scrollTop + clientHeight)
    }
  }

  /**
   * Check if container is scrollable
   */
  isScrollable(): boolean {
    return this.container.scrollHeight > this.container.clientHeight
  }
}