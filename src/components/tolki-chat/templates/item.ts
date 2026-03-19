import { html, TemplateResult } from 'lit'
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
import { toolbarTemplate } from './toolbar'

// Import type-specific interfaces for type safety
import {
  ActionResponse,
  CardResponse,
  MarkdownResponse,
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
  chatUuid: string = ''
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
    [ItemType.orders]: () => ordersResponseTemplate(),
    [ItemType.thinking]: () => thinkingResponseTemplate(),
    [ItemType.userInput]: () => userInputTemplate(item as UserInput),
    [ItemType.cartNotification]: () => cartNotificationTemplate(),
  }

  // Get the appropriate template function and render it
  const templateFunction = templateMap[item.type]
  const content = templateFunction ? templateFunction() : html``

  // Show toolbar under assistant markdown messages
  const showToolbar =
    item.type === ItemType.markdown &&
    index >= 0 &&
    !(item as MarkdownResponse).level // Don't show on info/error messages

  const toolbar = showToolbar
    ? toolbarTemplate((item as MarkdownResponse).content, history, index, botUuid, chatUuid)
    : html``

  // Wrap the content in a standardized chat item container
  return html`
    <div class="tk__chat-item tk__chat-item--${item.type || 'legacy'}">
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
