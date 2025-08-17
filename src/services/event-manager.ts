import autosize from 'autosize'

/**
 * Interface for elements that the event manager needs to access
 */
interface ChatElements {
  textarea?: HTMLTextAreaElement
  toggle?: HTMLButtonElement
  close?: HTMLButtonElement
  reset?: HTMLButtonElement
  send?: HTMLButtonElement
  log?: HTMLDivElement
  scrollDown?: HTMLButtonElement
  suggestions?: HTMLButtonElement[]
}

/**
 * Interface for event handlers
 */
interface EventHandlers {
  sendMessage: () => Promise<void>
  toggleWindow: () => void
  resetChat: () => void
  scrollToBottom: (timeout?: number) => void
  extractCommand: (text: string) => { command: string | null; displayText: string }
  executeCommand: (command: string) => void
  logScroll: () => void
}

/**
 * Service class to handle all event management
 * Extracted from TolkiChat component for better separation of concerns
 */
export class EventManager {
  private suggestionsListenersAdded = false

  constructor(
    private elements: ChatElements,
    private handlers: EventHandlers,
    private updateComplete: Promise<void>
  ) {}

  /**
   * Setup all event listeners for the chat component
   */
  setupEventListeners(): void {
    this.setupTextareaEvents()
    this.setupButtonEvents()
    this.setupScrollEvents()
    this.setupSuggestionEvents()
  }

  /**
   * Reset suggestions listeners flag (used during language changes)
   */
  resetSuggestionsListeners(): void {
    this.removeSuggestionListeners()
    this.suggestionsListenersAdded = false
  }

  /**
   * Setup textarea-related events
   */
  private setupTextareaEvents(): void {
    if (!this.elements.textarea) return

    // Setup autosize
    autosize(this.elements.textarea)

    // Remove existing listeners
    this.elements.textarea.removeEventListener('autosize:resized', this.handleTextareaResize)
    this.elements.textarea.removeEventListener('keydown', this.handleEnterKey)

    // Add new listeners
    this.elements.textarea.addEventListener('autosize:resized', this.handleTextareaResize)
    this.elements.textarea.addEventListener('keydown', this.handleEnterKey)
  }

  /**
   * Setup button events
   */
  private setupButtonEvents(): void {
    // Toggle button
    if (this.elements.toggle) {
      this.elements.toggle.removeEventListener('click', this.handlers.toggleWindow)
      this.elements.toggle.addEventListener('click', this.handlers.toggleWindow)
    }

    // Close button
    if (this.elements.close) {
      this.elements.close.removeEventListener('click', this.handlers.toggleWindow)
      this.elements.close.addEventListener('click', this.handlers.toggleWindow)
    }

    // Reset button
    if (this.elements.reset) {
      this.elements.reset.removeEventListener('click', this.handlers.resetChat)
      this.elements.reset.addEventListener('click', this.handlers.resetChat)
    }

    // Send button
    if (this.elements.send) {
      this.elements.send.removeEventListener('click', this.handleSendClick)
      this.elements.send.addEventListener('click', this.handleSendClick)
    }

    // Scroll down button
    if (this.elements.scrollDown) {
      this.elements.scrollDown.removeEventListener('click', this.handleScrollDownClick)
      this.elements.scrollDown.addEventListener('click', this.handleScrollDownClick)
    }
  }

  /**
   * Setup scroll events
   */
  private setupScrollEvents(): void {
    if (this.elements.log) {
      this.elements.log.removeEventListener('scroll', this.handlers.logScroll)
      this.elements.log.addEventListener('scroll', this.handlers.logScroll)
    }
  }

  /**
   * Setup suggestion button events
   */
  private setupSuggestionEvents(): void {
    if (!this.elements.suggestions?.length || this.suggestionsListenersAdded) return

    this.elements.suggestions.forEach((suggestion) => {
      // Remove any existing listeners first
      const existingHandler = suggestion._tolkiClickHandler
      if (existingHandler) {
        suggestion.removeEventListener('click', existingHandler)
      }

      // Create new handler
      const clickHandler = () => {
        const originalText = suggestion.getAttribute('data-original') || suggestion.textContent
        const { command } = this.handlers.extractCommand(originalText)

        if (command) {
          // Execute command directly
          this.handlers.executeCommand(command)
        } else {
          // Normal suggestion behavior: set text and send
          if (this.elements.textarea) {
            this.elements.textarea.value = suggestion.textContent
            this.handlers.sendMessage()
          }
        }
      }

      // Store handler reference and add listener
      suggestion._tolkiClickHandler = clickHandler
      suggestion.addEventListener('click', clickHandler)
    })

    this.suggestionsListenersAdded = true
  }

  /**
   * Remove suggestion listeners
   */
  private removeSuggestionListeners(): void {
    if (!this.elements.suggestions?.length) return

    this.elements.suggestions.forEach((suggestion) => {
      const existingHandler = suggestion._tolkiClickHandler
      if (existingHandler) {
        suggestion.removeEventListener('click', existingHandler)
        delete suggestion._tolkiClickHandler
      }
    })
  }

  /**
   * Event handler for textarea resize
   */
  private handleTextareaResize = (): void => {
    const logElement = this.elements.log
    if (logElement) {
      logElement.removeEventListener('scroll', this.handlers.logScroll)
      // Auto scroll to bottom when textarea resizes
      this.updateComplete.then(() => {
        this.handlers.scrollToBottom(100)
        setTimeout(() => {
          logElement.addEventListener('scroll', this.handlers.logScroll)
        }, 500)
      })
    }
  }

  /**
   * Event handler for Enter key press
   */
  private handleEnterKey = (event: KeyboardEvent): void => {
    if (event.key === 'Enter') {
      event.preventDefault()
      this.handlers.sendMessage()
    }
  }

  /**
   * Event handler for send button click
   */
  private handleSendClick = (): void => {
    this.handlers.sendMessage()
  }

  /**
   * Event handler for scroll down button click
   */
  private handleScrollDownClick = (): void => {
    this.handlers.scrollToBottom(100)
  }
}