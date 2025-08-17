/**
 * Interface for suggestion command result
 */
export interface SuggestionCommand {
  command: string | null
  displayText: string
}

/**
 * Interface for suggestion handlers
 */
export interface SuggestionHandlers {
  executeCommand: (command: string) => void
  sendMessage: (text: string) => Promise<void>
}

/**
 * Service class to handle suggestion-related functionality
 * Extracted for better separation of concerns and reusability
 */
export class SuggestionManager {
  private listenersAdded = false
  private attachedElements = new WeakSet<HTMLButtonElement>()

  constructor(private handlers: SuggestionHandlers) {}

  /**
   * Extract command from suggestion text
   */
  extractCommand(suggestionText: string): SuggestionCommand {
    const commandMatch = suggestionText.match(/\[([^\]]+)\]/)

    if (!commandMatch) {
      return { command: null, displayText: suggestionText }
    }

    const command = commandMatch[1]
    const textBeforeCommand = suggestionText
      .substring(0, commandMatch.index)
      .trim()

    // If there's text before the command, use that as display text
    if (textBeforeCommand) {
      return { command, displayText: textBeforeCommand }
    }

    // If only command, return the command itself as display text
    return { command, displayText: command }
  }

  /**
   * Setup event listeners for suggestion buttons
   */
  setupSuggestionListeners(suggestions: HTMLButtonElement[]): void {
    if (this.listenersAdded || !suggestions?.length) return

    suggestions.forEach(suggestion => {
      // Skip if already attached
      if (this.attachedElements.has(suggestion)) return

      this.attachSuggestionListener(suggestion)
      this.attachedElements.add(suggestion)
    })

    this.listenersAdded = true
  }

  /**
   * Reset listeners state (used during language changes)
   */
  resetListeners(): void {
    this.listenersAdded = false
    // Note: WeakSet will automatically clean up when elements are removed from DOM
  }

  /**
   * Remove listeners from suggestions
   */
  removeSuggestionListeners(suggestions: HTMLButtonElement[]): void {
    suggestions.forEach(suggestion => {
      const existingHandler = suggestion._tolkiClickHandler
      if (existingHandler) {
        suggestion.removeEventListener('click', existingHandler)
        delete suggestion._tolkiClickHandler
      }
      this.attachedElements.delete(suggestion)
    })
    this.listenersAdded = false
  }

  /**
   * Check if listeners are added
   */
  areListenersAdded(): boolean {
    return this.listenersAdded
  }

  /**
   * Attach click listener to a single suggestion button
   */
  private attachSuggestionListener(suggestion: HTMLButtonElement): void {
    // Remove any existing listener first
    const existingHandler = suggestion._tolkiClickHandler
    if (existingHandler) {
      suggestion.removeEventListener('click', existingHandler)
    }

    // Create new handler
    const clickHandler = () => this.handleSuggestionClick(suggestion)

    // Store handler reference and add listener
    suggestion._tolkiClickHandler = clickHandler
    suggestion.addEventListener('click', clickHandler)
  }

  /**
   * Handle suggestion button click
   */
  private handleSuggestionClick(suggestion: HTMLButtonElement): void {
    const originalText = suggestion.getAttribute('data-original') || suggestion.textContent
    if (!originalText) return

    const { command } = this.extractCommand(originalText)

    if (command) {
      // Execute command directly
      this.handlers.executeCommand(command)
    } else {
      // Normal suggestion behavior: send the text as message
      this.handlers.sendMessage(suggestion.textContent || originalText)
    }
  }
}