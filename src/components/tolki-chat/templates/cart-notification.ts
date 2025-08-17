import { html, TemplateResult } from 'lit'
import { msg, str } from '@lit/localize'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { actionButtonTemplate, actionContainerTemplate } from './actions'
import { renderTemplate } from '../../../utils/templates'
import { cartIconTemplate } from './cart-icon'
import { navigateTo } from '../../../utils/navigation'

// Template: Cart notification with dynamic content
export const cartNotificationTemplate = (): TemplateResult => {
  // Get cart data from window.tolki
  const cartData = window.tolki?.cart

  // Handle different cart states
  switch (cartData?.status) {
    case 'loading':
    case 'idle':
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

    case 'loaded':
      // Continue with normal cart display logic for loaded state only
      break
      
    default:
      // If status is undefined, don't show notification
      return html``
  }

  // Get item count
  const itemCount = cartData?.items?.length || 0

  // If cart is loaded but empty, don't show notification at all
  if (itemCount === 0) {
    return html``
  }

  // Create message based on item count (only when items > 0)
  const handleCartLinkClick = (e: Event) => {
    e.preventDefault()
    if (
      window.ActionCommands &&
      window.ActionCommands.showCartAndRemoveNotification
    ) {
      window.ActionCommands.showCartAndRemoveNotification()
    }
  }

  const template = renderTemplate('cart_items_count', { count: itemCount })
  const countText = template.match(/\d+ \w+/)![0] // Extract "1 articolo" or "2 articoli"
  
  const message = unsafeHTML(template.replace(countText, `<span class="tk__link" onclick="if(window.ActionCommands && window.ActionCommands.showCartAndRemoveNotification) window.ActionCommands.showCartAndRemoveNotification()">${countText}</span>`))

  // Create buttons array based on available links and cart state
  const buttons = []
  const checkoutLink = window.tolki?.links?.checkout
  const cartStatus = cartData?.status
  const hasCheckout = checkoutLink && cartStatus === 'loaded' && itemCount > 0
  
  // Add "View Cart" button
  // Make it primary only if there's no checkout button
  buttons.push(actionButtonTemplate(
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
    !hasCheckout // primary if no checkout
  ))
  
  // Add "Checkout" button if checkout link exists and cart is loaded
  if (hasCheckout) {
    buttons.push(actionButtonTemplate(
      renderTemplate('checkout'),
      (e: Event) => {
        e.preventDefault()
        navigateTo(checkoutLink)
      },
      true // primary button
    ))
  }

  return actionContainerTemplate(
    html`<div class="tk__action-prompt tk__action-prompt--with-icon">
      ${cartIconTemplate()}
      <div class="tk__action-prompt-text">${message}</div>
    </div>`,
    buttons
  )
}
