import { html } from 'lit'

export const suggestionsTemplate = (suggestions: string[]) => {
  return suggestions?.length
    ? html` <div class="tkc__suggestions">
        ${suggestions.map(
          (suggestion) =>
            html` <button class="tkc__suggestion">${suggestion}</button>`
        )}
      </div>`
    : html``
}
