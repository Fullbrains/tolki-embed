import { html } from 'lit'
import { classMap } from 'lit/directives/class-map.js'

export const suggestionsTemplate = (
  suggestions: string[],
  extractCommand?: (text: string) => {
    command: string | null
    displayText: string
  }
) => {
  const isEmpty = !suggestions?.length

  const handleScrollLeft = (e: Event) => {
    e.preventDefault()
    const container = (e.target as HTMLElement)
      .closest('.tk__suggestions-container')
      ?.querySelector('.tk__suggestions') as HTMLElement
    if (container) {
      container.scrollBy({ left: -150, behavior: 'smooth' })
    }
  }

  const handleScrollRight = (e: Event) => {
    e.preventDefault()
    const container = (e.target as HTMLElement)
      .closest('.tk__suggestions-container')
      ?.querySelector('.tk__suggestions') as HTMLElement
    if (container) {
      container.scrollBy({ left: 150, behavior: 'smooth' })
    }
  }

  return html`
    <div class=${classMap({
      'tk__suggestions-container': true,
      'tk__suggestions-container--empty': isEmpty,
    })}>
      <button
        class="tk__suggestions-scroll-btn tk__suggestions-scroll-left"
        @click=${handleScrollLeft}
      >
        <svg width="15" height="15" viewBox="0 0 15 15">
          <path fill-rule="evenodd" d="M10 3v9L4 7.5z" />
        </svg>
      </button>
      <div class="tk__suggestions">
        ${(suggestions || []).map((suggestion) => {
          const parsed = extractCommand
            ? extractCommand(suggestion)
            : { command: null, displayText: suggestion }
          return html` <button
            class="tk__suggestion"
            data-original="${suggestion}"
          >
            ${parsed.displayText}
          </button>`
        })}
      </div>
      <button
        class="tk__suggestions-scroll-btn tk__suggestions-scroll-right"
        @click=${handleScrollRight}
      >
        <svg width="15" height="15" viewBox="0 0 15 15">
          <path fill-rule="evenodd" d="M5 3v9l6-4.5z" />
        </svg>
      </button>
    </div>
  `
}
