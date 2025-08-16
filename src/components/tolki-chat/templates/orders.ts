import { html, TemplateResult } from 'lit'
import { msg } from '@lit/localize'
import { getLocale } from '../../../locales'
import { actionButtonTemplate, actionContainerTemplate } from './actions'
import { orderWithPlaceholderTemplate } from './order-placeholder'
import { navigateTo } from '../../../utils/navigation'
import '../../../types/global' // Import global types

// Helper: Format order date
const formatOrderDate = (dateString: string): string => {
  if (!dateString) return ''

  try {
    const date = new Date(dateString)
    const locale = getLocale()
    return date.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateString
  }
}

// Helper: Get status class for styling
const getStatusClass = (status?: string): string => {
  return status ? `tk__orders-status--${status}` : ''
}

// Helper: Get localized status label
const getLocalizedStatus = (status?: string): string => {
  if (!status) return ''

  switch (status) {
    case 'pending':
      return msg('Pending')
    case 'processing':
      return msg('Processing')
    case 'completed':
      return msg('Completed')
    case 'refunded':
      return msg('Refunded')
    case 'cancelled':
      return msg('Cancelled')
    default:
      return status
  }
}

// Template: Single order item
export const orderItemTemplate = (order: {
  order_id?: number | string
  order_number?: string
  order_url?: string
  total?: string
  date_created?: string
  status?: string
  status_label?: string
  items?: Array<{
    product_url?: string
    image_url?: string
    title?: string
    price?: string
    quantity?: number
  }>
}): TemplateResult => {
  const statusClass = getStatusClass(order.status)
  const formattedDate = formatOrderDate(order.date_created || '')

  // Get first item image and count
  const firstItem = order.items?.[0]
  const itemCount = order.items?.length || 0

  const handleClick = (e: Event) => {
    e.preventDefault()
    if (order.order_url) {
      navigateTo(order.order_url)
    }
  }

  const isClickable = order.order_url && order.order_url.trim()

  return html`
    <div
      class="tk__cart-item ${isClickable ? 'tk__cart-item--clickable' : ''}"
      @click=${isClickable ? handleClick : undefined}
    >
      ${orderWithPlaceholderTemplate(
        firstItem?.image_url,
        '',
        'tk__cart-item-image'
      )}
      <div class="tk__cart-item-details">
        <div class="tk__cart-item-title">
          <div class="tk__orders-status-chip ${statusClass}">
            ${getLocalizedStatus(order.status) || order.status_label || ''}
          </div>
          ${msg('Order')} #${order.order_id || order.order_number || 'N/A'}
        </div>
        <div class="tk__cart-item-info">${formattedDate}</div>
        ${order.total
          ? html`<div class="tk__orders-total">
              &euro;${order.total.replace('€', '')}
              ${itemCount > 0
                ? html`<span class="tk__orders-item-count">
                    (${itemCount}
                    ${itemCount === 1 ? msg('item') : msg('items')})</span
                  >`
                : ''}
            </div>`
          : ''}
      </div>
    </div>
  `
}

// Template: Orders list
export const ordersListTemplate = (
  orders: Array<{
    order_id?: number | string
    order_number?: string
    total?: string
    date_created?: string
    status?: string
    status_label?: string
    items?: Array<{
      product_url?: string
      image_url?: string
      title?: string
      price?: string
      quantity?: number
    }>
  }>
): TemplateResult => {
  if (orders.length === 0) {
    return html`<p class="tk__no-orders">${msg('No orders found')}</p>`
  }

  const maxDisplayOrders = 3
  const displayOrders = orders.slice(0, maxDisplayOrders)

  return html`
    <div class="tk__cart-summary">
      ${displayOrders.map((order) => html` ${orderItemTemplate(order)} `)}
    </div>
  `
}

// Template: Orders summary (main container)
export const ordersSummaryTemplate = (
  orders: Array<{
    order_id?: number | string
    order_number?: string
    total?: string
    date_created?: string
    status?: string
    status_label?: string
    items?: Array<{
      product_url?: string
      image_url?: string
      title?: string
      price?: string
      quantity?: number
    }>
  }>
): TemplateResult => {
  return ordersListTemplate(orders)
}

// Template: Orders response using existing orders summary
export const ordersResponseTemplate = (): TemplateResult => {
  const ordersLink = window.tolki?.links?.orders
  // Get fresh orders data from window.tolki.orders
  const ordersData = window.tolki?.orders

  // Flatten all orders from all statuses into a single array
  const allOrders = ordersData ? Object.values(ordersData).flat() : []

  const handleGoToOrders = (e: Event) => {
    e.preventDefault()
    if (ordersLink) {
      navigateTo(ordersLink)
    }
  }

  const buttons = ordersLink
    ? [actionButtonTemplate(msg('View Orders'), handleGoToOrders, true)]
    : undefined

  return actionContainerTemplate(ordersSummaryTemplate(allOrders), buttons)
}
