import { html, TemplateResult } from 'lit'
import { classMap } from 'lit/directives/class-map.js'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { MarkdownResponse, MarkdownResponseLevel, UserInput } from '../../../types/item'
import { resolveMarkdown } from 'lit-markdown'
import { msg } from '@lit/localize'
import { renderTemplate } from '../../../utils/templates'

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
      : resolveMarkdown(processedContent, {
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