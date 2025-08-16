import { html, TemplateResult } from 'lit'
import { classMap } from 'lit/directives/class-map.js'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { MarkdownResponse, MarkdownResponseLevel, UserInput } from '../../../types/item'
import { resolveMarkdown } from 'lit-markdown'

// Helper: Decode HTML entities
const decodeHtmlEntities = (text: string): string => {
  const textarea = document.createElement('textarea')
  textarea.innerHTML = text
  return textarea.value
}

// Template: Markdown response with level support
export const markdownResponseTemplate = (item: MarkdownResponse): TemplateResult => {
  // Se il contenuto è vuoto (setLocale senza messaggio), non renderizzare nulla
  if (!item.content || item.content.trim() === '') {
    return html``
  }

  // Per messaggi info con HTML entities (privacy notice), decodifica e usa unsafeHTML
  const hasHtmlEntities =
    item.content.includes('&lt;') || item.content.includes('&gt;')
  const content =
    item.level === MarkdownResponseLevel.info && hasHtmlEntities
      ? html`<p>${unsafeHTML(decodeHtmlEntities(item.content))}</p>`
      : resolveMarkdown(item.content, {
          includeImages: true,
          includeCodeBlockClassNames: true,
        })

  return html` <div
    class=${classMap({
      tk__markdown: true,
      'tk__message--error': item.level === MarkdownResponseLevel.error,
      'tk__message--info': item.level === MarkdownResponseLevel.info,
    })}
  >
    ${content}
  </div>`
}

// Template: User input message
export const userInputTemplate = (item: UserInput): TemplateResult => {
  return html` <div class="tk__user-input">${item.content}</div>`
}

// Template: Thinking indicator with animated dots
export const thinkingResponseTemplate = (): TemplateResult => {
  return html` <div class="tk__thinking tk__dots tk__dots--animated">
    <span></span><span></span><span></span>
  </div>`
}