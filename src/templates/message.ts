import { html, TemplateResult } from 'lit'
import { classMap } from 'lit/directives/class-map.js'
import { TolkiChatMessageRole } from '../tolki-chat/tolki-chat-message'
import { resolveMarkdown } from 'lit-markdown'
import { DirectiveResult } from 'lit-html/directive'

export const message = (content: string, role: TolkiChatMessageRole) => {
  let messageContent: string | TemplateResult | DirectiveResult = content
  if (role === TolkiChatMessageRole.thinking) {
    messageContent = html`<span></span><span></span><span></span>`
  }
  if (role === TolkiChatMessageRole.error) {
    messageContent = html`${content}`
  }
  if (role === TolkiChatMessageRole.assistant) {
    messageContent = resolveMarkdown(content, { includeImages: true, includeCodeBlockClassNames: true })
  }

  return html`<div
    class=${classMap({
      tkc__message: true,
      'tkc__message--user': role === TolkiChatMessageRole.user,
      'tkc__message--assistant': role === TolkiChatMessageRole.assistant,
      'tkc__message--thinking': role === TolkiChatMessageRole.thinking,
      tkc__dots: role === TolkiChatMessageRole.thinking,
      'tkc__dots--animated': role === TolkiChatMessageRole.thinking,
      'tkc__message--error': role === TolkiChatMessageRole.error,
      'tkc__message--info': role === TolkiChatMessageRole.info,
    })}
  >
    ${messageContent}
  </div>`
}
