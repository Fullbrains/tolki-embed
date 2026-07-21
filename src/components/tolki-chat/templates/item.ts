import { html, TemplateResult } from 'lit'
import { classMap } from 'lit/directives/class-map.js'
import { Item, ItemType } from '../../../types/item'

// Import all specialized template functions
import { actionResponseTemplate } from './actions'
import { cardResponseTemplate, productResponseTemplate } from './cards'
import {
  markdownResponseTemplate,
  userInputTemplate,
  thinkingResponseTemplate,
} from './messages'
import { cartResponseTemplate } from './cart'
import { ordersResponseTemplate } from './orders'
import { cartNotificationTemplate } from './cart-notification'
import { feedbackTemplate } from './feedback'
import { toolbarTemplate } from './toolbar'

// Import type-specific interfaces for type safety
import {
  ActionResponse,
  CardResponse,
  FeedbackResponse,
  MarkdownResponse,
  MarkdownResponseLevel,
  ProductResponse,
  UserInput,
} from '../../../types/item'

/**
 * Main template function that renders a chat item based on its type
 * This function acts as a router, delegating to specialized template functions
 */
export const chatItemTemplate = (
  item: Item,
  history: Item[] = [],
  index: number = -1,
  botUuid: string = '',
  chatUuid: string = '',
  showQueries: boolean = false,
  thinkingMessages: string[] = [],
): TemplateResult => {
  // document_search_query and document_search_results are consumed by the toolbar
  // and should not render as standalone chat items
  if (
    item.type === ItemType.documentSearchQuery ||
    item.type === ItemType.documentSearchResults
  ) {
    return html``
  }

  // Map of template functions for each item type
  const templateMap: Partial<Record<ItemType, () => TemplateResult>> = {
    [ItemType.action]: () => actionResponseTemplate(item as ActionResponse),
    [ItemType.card]: () => cardResponseTemplate(item as CardResponse),
    [ItemType.markdown]: () =>
      markdownResponseTemplate(item as MarkdownResponse),
    [ItemType.product]: () => productResponseTemplate(item as ProductResponse),
    [ItemType.cart]: () => cartResponseTemplate(),
    [ItemType.feedback]: () => feedbackTemplate(item as FeedbackResponse),
    [ItemType.orders]: () => ordersResponseTemplate(),
    [ItemType.thinking]: () => thinkingResponseTemplate(thinkingMessages),
    [ItemType.userInput]: () => userInputTemplate(item as UserInput),
    [ItemType.cartNotification]: () => cartNotificationTemplate(),
  }

  // Get the appropriate template function and render it
  const templateFunction = templateMap[item.type]
  const content = templateFunction ? templateFunction() : html``

  // A genuine assistant reply is a plain markdown answer streamed from the
  // backend: level 'default' (or none) and no propKey/templateKey — those mark
  // welcome/toast/system/translated notices, which are authored by us.
  // This single flag drives both behaviours that must stay in sync:
  //   - the feedback toolbar shows ONLY on agent replies
  //   - bubbleless mode strips the bubble ONLY from agent replies
  // Everything else (welcome, system, info, error) keeps its bubble and has no
  // toolbar, in both bubble and bubbleless modes.
  const md = item as MarkdownResponse
  const isAgentReply =
    item.type === ItemType.markdown &&
    !md.propKey &&
    !md.templateKey &&
    (!md.level || md.level === MarkdownResponseLevel.default)

  const showToolbar = isAgentReply && index >= 0

  const toolbar = showToolbar
    ? toolbarTemplate(md.content, history, index, botUuid, chatUuid, showQueries)
    : html``

  // Wrap the content in a standardized chat item container. The agent-reply
  // marker lets CSS target bubbleless mode without re-deriving the condition.
  return html`
    <div
      class=${classMap({
        'tk__chat-item': true,
        [`tk__chat-item--${item.type || 'legacy'}`]: true,
        'tk__chat-item--agent': isAgentReply,
      })}
    >
      ${content} ${toolbar}
    </div>
  `
}

// Re-export specialized templates for direct usage if needed
export { actionResponseTemplate } from './actions'
export { cardResponseTemplate, productResponseTemplate } from './cards'
export {
  markdownResponseTemplate,
  userInputTemplate,
  thinkingResponseTemplate,
} from './messages'
export { cartResponseTemplate } from './cart'
export { ordersResponseTemplate } from './orders'
