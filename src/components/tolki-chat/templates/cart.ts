import { html, TemplateResult } from 'lit'
import { msg, str } from '@lit/localize'
import { navigateTo } from '../../../utils/navigation'
import { actionButtonTemplate, actionContainerTemplate } from './actions'
import { productWithPlaceholderTemplate } from './product-placeholder'
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
    return html`<div class="tk__cart-empty">${msg('Your cart is empty')}</div>`
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
                    &nbsp;(${msg(str`${remainingCount} more items`)}...)
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

  const handleGoToCart = (e: Event) => {
    e.preventDefault()
    if (cartLink) {
      navigateTo(cartLink)
    }
  }

  const buttons = cartLink
    ? [actionButtonTemplate(msg('Go to Cart'), handleGoToCart, true)]
    : undefined

  return actionContainerTemplate(
    cartSummaryTemplate(items, cartData?.total),
    buttons
  )
}
