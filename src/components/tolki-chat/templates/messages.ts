import { html, nothing, TemplateResult } from 'lit'
import { classMap } from 'lit/directives/class-map.js'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { MarkdownResponse, MarkdownResponseLevel, UserInput } from '../../../types/item'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { renderTemplate } from '../../../utils/templates'
import { trisGame } from '../../../utils/tris-game'
import { cyclingMessage } from '../../../utils/cycling-message'

// Helper: Decode HTML entities
const decodeHtmlEntities = (text: string): string => {
  const textarea = document.createElement('textarea')
  textarea.innerHTML = text
  return textarea.value
}

// Template: Markdown response with level support
export const markdownResponseTemplate = (item: MarkdownResponse): TemplateResult => {
  // Priority: propKey > templateKey > content
  // propKey: reads dynamic i18n content from window.tolki.props (already resolved for current language)
  // templateKey: uses lit-localize templates for fixed translatable strings
  // content: static content saved in history

  let processedContent: string

  if (item.propKey) {
    // Read from window.tolki.props (dynamically resolved i18n props)
    const propValue = window.tolki?.props?.[item.propKey]
    if (!propValue) {
      return html`` // Don't render if prop is empty
    }
    processedContent = propValue
  } else if (item.templateKey) {
    // Use template system for fixed translatable strings
    processedContent = renderTemplate(item.templateKey, item.templateParams)
  } else {
    // Use static content
    if (!item.content || item.content.trim() === '') {
      return html``
    }
    processedContent = item.content
  }

  // Per messaggi info con HTML entities (privacy notice), decodifica e usa unsafeHTML
  const hasHtmlEntities =
    processedContent.includes('&lt;') || processedContent.includes('&gt;')
  const content =
    item.level === MarkdownResponseLevel.info && hasHtmlEntities
      ? html`<p>${unsafeHTML(decodeHtmlEntities(processedContent))}</p>`
      : unsafeHTML(
          DOMPurify.sanitize(marked.parse(processedContent) as string, {
            ADD_TAGS: ['img'],
            ADD_ATTR: ['target', 'class'],
          })
        )

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
// When thinkingMessages are configured, they cycle next to the dots to reduce
// the perceived wait. A single text node is reused; the enter/exit motion and
// the advance timing are both driven by the cyclingMessage directive (WAAPI).
export const thinkingResponseTemplate = (
  messages: string[] = [],
  showGame: boolean = false
): TemplateResult => {
  const dots = html`<div class="tk__thinking-dots tk__dots tk__dots--animated">
    <span></span><span></span><span></span>
  </div>`

  const indicator = messages.length
    ? html`<div class="tk__thinking tk__thinking--with-messages">
        ${dots}
        <div
          class="tk__thinking-messages"
          aria-live="polite"
          ${cyclingMessage(messages)}
        ></div>
      </div>`
    : html`<div class="tk__thinking">${dots}</div>`

  // The game sits in its own card below the indicator. Both are wrapped in a
  // column block so they stack vertically — the log is a row-wrap flex, so bare
  // siblings would sit side by side. The block is an ordinary history item, so
  // the conversation above stays scrollable, and it is removed with the
  // thinking item on the first text_delta.
  return html`<div class="tk__thinking-block">
    ${indicator}${showGame ? html`<div class="tk__tris" ${trisGame()}></div>` : nothing}
  </div>`
}
