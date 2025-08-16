import { html, TemplateResult } from 'lit'
import { classMap } from 'lit/directives/class-map.js'
import { CardResponse, ProductResponse } from '../../../types/item'
import { productWithPlaceholderTemplate } from './product-placeholder'
import { navigateTo } from '../../../utils/navigation'

// Helper: Create card template (used for both card and product)
export const cardTemplate = (
  image: string,
  name: string,
  description: string | TemplateResult,
  onClick?: (e: Event) => void,
  isProduct: boolean = false
): TemplateResult => {
  const classes = classMap({
    tk__card: true,
    'tk__card--product': isProduct,
    'tk__card--clickable': !!onClick,
  })

  // For products, always show image or placeholder. For cards, only show if image exists
  const showImageArea = isProduct || (image && image.trim())
  
  const content = html`
    ${showImageArea 
      ? isProduct 
        ? productWithPlaceholderTemplate(image, '')
        : html`<img src="${image}" alt="" />`
      : ''}
    <div class="tk__content">
      <div class="tk__name">${name}</div>
      <div class="tk__description">${description}</div>
    </div>
  `

  return onClick
    ? html`<div class="${classes}" @click=${onClick}>${content}</div>`
    : html`<div class="${classes}">${content}</div>`
}

// Template: Card response
export const cardResponseTemplate = (item: CardResponse): TemplateResult => {
  return cardTemplate(
    item.image,
    item.name,
    item.description || '',
    undefined,
    false
  )
}

// Template: Product response with price and click handler
export const productResponseTemplate = (item: ProductResponse): TemplateResult => {
  const handleClick = (e: Event) => {
    e.preventDefault()
    navigateTo(item.Url)
  }
  return cardTemplate(
    item.image,
    item.name,
    html`&euro;${item.price}`,
    handleClick,
    true // isProduct
  )
}