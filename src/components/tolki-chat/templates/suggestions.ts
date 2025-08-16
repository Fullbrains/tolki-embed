import { html } from 'lit'

export const suggestionsTemplate = (suggestions: string[], extractCommand?: (text: string) => { command: string | null, displayText: string }) => {
  return suggestions?.length
    ? html` <div class="tk__suggestions">
        ${suggestions.map((suggestion) => {
          const parsed = extractCommand ? extractCommand(suggestion) : { command: null, displayText: suggestion }
          return html` <button class="tk__suggestion" data-original="${suggestion}">${parsed.displayText}</button>`
        })}
      </div>`
    : html``
}
