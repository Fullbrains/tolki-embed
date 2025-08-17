import { html, TemplateResult } from 'lit'
import { actionButtonTemplate, actionContainerTemplate } from './actions'
import { renderTemplate } from '../../../utils/templates'

// Template: Cart notification with dynamic content
export const cartNotificationTemplate = (): TemplateResult => {
  // Get cart data from window.tolki
  const cartData = window.tolki?.cart

  // Handle different cart states
  switch (cartData?.status) {
    case 'loading':
      return actionContainerTemplate(
        html`<div class="tk__action-prompt">
          ${renderTemplate('loading_cart')}
        </div>`
      )
    
    case 'error':
      return actionContainerTemplate(
        html`<div class="tk__action-prompt">
          ${renderTemplate('cart_error')}
        </div>`
      )
    
    case 'idle':
    case 'loaded':
    default:
      // Continue with normal cart display logic
      break
  }

  // Get item count
  const itemCount = cartData?.items?.length || 0

  // If no items, don't show notification
  if (itemCount === 0) {
    return html``
  }

  // Create message with current item count using template system
  const message = renderTemplate('cart_items_count', { count: itemCount })

  // Create View Cart button using template system
  const viewCartButton = actionButtonTemplate(
    renderTemplate('view_cart'),
    (e: Event) => {
      e.preventDefault()
      if (
        window.ActionCommands &&
        window.ActionCommands.showCartAndRemoveNotification
      ) {
        window.ActionCommands.showCartAndRemoveNotification()
      }
    },
    true // primary button
  )

  return actionContainerTemplate(
    html`<div class="tk__action-prompt">${message}</div>`,
    [viewCartButton]
  )
}
