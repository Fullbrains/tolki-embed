import { html, TemplateResult } from 'lit'
import { classMap } from 'lit/directives/class-map.js'
import {
  TolkiChatActionResponse,
  TolkiChatCardResponse,
  TolkiChatItem,
  TolkiChatItemType,
  TolkiChatMarkdownResponse,
  TolkiChatMarkdownResponseLevel,
  TolkiChatProductResponse,
  TolkiChatUserInput,
} from '../tolki-chat/tolki-chat-item'
import { resolveMarkdown } from 'lit-markdown'

export const chatItemTemplate = (item: TolkiChatItem) => {
  let ret: TemplateResult<1> = html``

  if (item.type === TolkiChatItemType.action) {
    ret = actionResponseTemplate(item)
  }

  if (item.type === TolkiChatItemType.card) {
    ret = cardResponseTemplate(item)
  }

  if (item.type === TolkiChatItemType.markdown) {
    ret = markdownResponseTemplate(item)
  }

  if (item.type === TolkiChatItemType.product) {
    ret = productResponseTemplate(item)
  }

  if (item.type === TolkiChatItemType.thinking) {
    ret = thinkingResponseTemplate()
  }

  if (item.type === TolkiChatItemType.userInput) {
    ret = userInputTemplate(item)
  }

  return html` <div
    class="tkc__chat-item tkc__chat-item--${item.type || 'legacy'}"
  >
    ${ret}
  </div>`

  /*   let messageContent: string | TemplateResult | DirectiveResult = content
   if (role === TolkiChatMessageRole.thinking) {
     messageContent = html``
   }
   if (role === TolkiChatMessageRole.error) {
     messageContent = html`${content}`
   }
   if (role === TolkiChatMessageRole.assistant) {
     messageContent = resolveMarkdown(content, {
       includeImages: true,
       includeCodeBlockClassNames: true,
     })
   }*/

  /*return html` <div
    class=${classMap({
      tkc__markdown: true,
      'tkc__markdown--user': role === TolkiChatMessageRole.user,
      'tkc__markdown--assistant': role === TolkiChatMessageRole.assistant,
      'tkc__markdown--thinking': role === TolkiChatMessageRole.thinking,
      tkc__dots: role === TolkiChatMessageRole.thinking,
      'tkc__dots--animated': role === TolkiChatMessageRole.thinking,
      'tkc__markdown--error': role === TolkiChatMessageRole.error,
      'tkc__markdown--info': role === TolkiChatMessageRole.info,
    })}
  >
    ${messageContent}
  </div>`*/
}

export const actionResponseTemplate = (item: TolkiChatActionResponse) => {
  return html` <div class="tkc__action">${item.text}</div>`
}

export const cardResponseTemplate = (item: TolkiChatCardResponse) => {
  return html` <div class="tkc__card">
    <img src="${item.image}" alt="" />
    <div class="tkc__content">
      <div class="tkc__name">${item.name}</div>
      <div class="tkc__description">${item.description}</div>
    </div>
  </div>`
}

export const markdownResponseTemplate = (item: TolkiChatMarkdownResponse) => {
  const content = resolveMarkdown(item.content, {
    includeImages: true,
    includeCodeBlockClassNames: true,
  })
  return html` <div
    class=${classMap({
      tkc__markdown: true,
      'tkc__markdown--error':
        item.level === TolkiChatMarkdownResponseLevel.error,
      'tkc__markdown--info': item.level === TolkiChatMarkdownResponseLevel.info,
    })}
  >
    ${content}
  </div>`
}

export const productResponseTemplate = (item: TolkiChatProductResponse) => {
  return html` <div class="tkc__product">
    <img src="${item.image}" alt="" />
    <div class="tkc__content">
      <div class="tkc__name">${item.name}</div>
      <div class="tkc__description">${item.description}</div>
      <div class="tkc__price">${item.price}</div>
    </div>
  </div>`
}

export const thinkingResponseTemplate = () => {
  return html` <div class="tkc__thinking tkc__dots tkc__dots--animated">
    <span></span><span></span><span></span>
  </div>`
}

export const userInputTemplate = (item: TolkiChatUserInput) => {
  return html` <div class="tkc__user-input">${item.content}</div>`
}
