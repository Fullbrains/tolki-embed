import { html, TemplateResult } from 'lit'
import { msg, str } from '@lit/localize'
import { navigateTo } from '../../../utils/navigation'
import { actionButtonTemplate, actionContainerTemplate } from './actions'
import { renderTemplate } from '../../../utils/templates'
import { productWithPlaceholderTemplate } from './product-placeholder'
import { cartIconTemplate } from './cart-icon'
import '../../../types/global' // Import global types

export interface CartItem {
  product_url: string
  image_url: string
  title: string
  price: string
  quantity: number
  subtotal: string
}

export const cartItemRowTemplate = (item: CartItem) => {
  const handleClick = (e: Event) => {
    e.preventDefault()
    if (item.product_url) {
      navigateTo(item.product_url)
    }
  }

  const isClickable = item.product_url && item.product_url.trim()

  return html`
    <div
      class="tk__cart-item ${isClickable ? 'tk__cart-item--clickable' : ''}"
      @click=${isClickable ? handleClick : undefined}
    >
      ${productWithPlaceholderTemplate(
        item.image_url,
        '',
        'tk__cart-item-image'
      )}
      <div class="tk__cart-item-details">
        <div class="tk__cart-item-title">${item.title}</div>
        <div class="tk__cart-item-info">
          <span class="tk__cart-item-info-price">${item.subtotal}</span>
          - ${item.quantity} ${item.quantity === 1 ? msg('item') : msg('items')}
        </div>
      </div>
    </div>
  `
}

export const cartSummaryTemplate = (items: CartItem[], total?: string) => {
  const hasItems = items && items.length > 0

  if (!hasItems) {
    return html`<div class="tk__action-prompt tk__action-prompt--with-icon">
      ${cartIconTemplate()}
      <div class="tk__action-prompt-text tk__cart-loading">${msg('Your cart is empty.')}</div>
    </div>`
  }

  const maxDisplayItems = 3
  const displayItems = items.slice(0, maxDisplayItems)
  const remainingCount = items.length - maxDisplayItems
  const hasMoreItems = remainingCount > 0

  const handleShowMore = (e: Event) => {
    e.preventDefault()
    const cartLink = window.tolki?.links?.cart
    if (cartLink) {
      navigateTo(cartLink)
    }
  }

  return html`
    <div class="tk__cart-summary">
      ${displayItems.map((item) => html` ${cartItemRowTemplate(item)} `)}
      ${total
        ? html`
            <div class="tk__cart-total">
              <span class="tk__cart-total-text">${msg('Total')}: ${total}</span>
              ${hasMoreItems
                ? html`<span class="tk__cart-more" @click=${handleShowMore}>
                    &nbsp;(${msg(str`${remainingCount} more ${remainingCount === 1 ? 'item' : 'items'}`)}...)
                  </span>`
                : ''}
            </div>
          `
        : ''}
    </div>
  `
}

// Template: Cart response using existing cart summary
export const cartResponseTemplate = (): TemplateResult => {
  const cartLink = window.tolki?.links?.cart
  // Always get fresh cart data from window.tolki.cart instead of using stale data from item
  const cartData = window.tolki?.cart
  const items = cartData?.items || []
  const status = cartData?.status

  // Handle different cart states - only show "empty" message when cart is actually loaded
  if (status === 'loading' || status === 'idle') {
    return actionContainerTemplate(
      html`<div class="tk__action-prompt tk__action-prompt--with-icon">
        ${cartIconTemplate()}
        <div class="tk__action-prompt-text tk__cart-loading">${msg('Loading cart...')}</div>
      </div>`
    )
  }

  if (status === 'error') {
    return actionContainerTemplate(
      html`<div class="tk__action-prompt tk__action-prompt--with-icon">
        ${cartIconTemplate()}
        <div class="tk__action-prompt-text tk__cart-loading">${msg('Error loading cart.')}</div>
      </div>`
    )
  }

  const handleGoToCart = (e: Event) => {
    e.preventDefault()
    // If cart is empty, navigate to shop instead
    if (items.length === 0) {
      const shopLink = window.tolki?.links?.shop
      if (shopLink) {
        navigateTo(shopLink)
      }
    } else if (cartLink) {
      navigateTo(cartLink)
    }
  }

  const handleCheckout = (e: Event) => {
    e.preventDefault()
    const checkoutLink = window.tolki?.links?.checkout
    if (checkoutLink) {
      navigateTo(checkoutLink)
    }
  }

  // Create buttons array based on available links and cart state
  const buttons = []
  const checkoutLink = window.tolki?.links?.checkout
  const hasCheckout = checkoutLink && items.length > 0 && status === 'loaded'
  
  // Add "Go to Cart" or "Go to Shop" button if links exist
  // Make it primary only if there's no checkout button
  const isEmpty = items.length === 0
  const shopLink = window.tolki?.links?.shop
  
  if ((isEmpty && shopLink) || (!isEmpty && cartLink)) {
    const buttonText = isEmpty ? renderTemplate('go_to_shop') : msg('Go to Cart')
    buttons.push(actionButtonTemplate(buttonText, handleGoToCart, !hasCheckout))
  }
  
  // Add "Checkout" button if checkout link exists, items are present, and cart is loaded
  if (hasCheckout) {
    buttons.push(actionButtonTemplate(msg('Checkout'), handleCheckout, true))
  }

  return actionContainerTemplate(
    cartSummaryTemplate(items, cartData?.total),
    buttons.length > 0 ? buttons : undefined
  )
}
