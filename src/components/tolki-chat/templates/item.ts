import { html, TemplateResult } from 'lit'
import { Item, ItemType } from '../../../types/item'

// Import all specialized template functions
import { actionResponseTemplate } from './actions'
import { cardResponseTemplate, productResponseTemplate } from './cards'
import { markdownResponseTemplate, userInputTemplate, thinkingResponseTemplate } from './messages'
import { cartResponseTemplate } from './cart'
import { ordersResponseTemplate } from './orders'
import { cartNotificationTemplate } from './cart-notification'

// Import type-specific interfaces for type safety
import { 
  ActionResponse, 
  CardResponse, 
  CartNotificationResponse,
  MarkdownResponse, 
  ProductResponse, 
  UserInput 
} from '../../../types/item'

/**
 * Main template function that renders a chat item based on its type
 * This function acts as a router, delegating to specialized template functions
 */
export const chatItemTemplate = (item: Item): TemplateResult => {
  // Map of template functions for each item type
  const templateMap: Record<ItemType, () => TemplateResult> = {
    [ItemType.action]: () => actionResponseTemplate(item as ActionResponse),
    [ItemType.card]: () => cardResponseTemplate(item as CardResponse),
    [ItemType.markdown]: () => markdownResponseTemplate(item as MarkdownResponse),
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

  // Wrap the content in a standardized chat item container
  return html`
    <div class="tk__chat-item tk__chat-item--${item.type || 'legacy'}">
      ${content}
    </div>
  `
}

// Re-export specialized templates for direct usage if needed
export { actionResponseTemplate } from './actions'
export { cardResponseTemplate, productResponseTemplate } from './cards'
export { markdownResponseTemplate, userInputTemplate, thinkingResponseTemplate } from './messages'
export { cartResponseTemplate } from './cart'
export { ordersResponseTemplate } from './orders'