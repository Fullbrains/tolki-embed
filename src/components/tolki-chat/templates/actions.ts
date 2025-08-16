import { html, TemplateResult } from 'lit'
import { classMap } from 'lit/directives/class-map.js'
import { ActionResponse } from '../../../types/item'

// Helper: Create action button
export const actionButtonTemplate = (
  label: string,
  onClick: (e: Event) => void,
  primary: boolean = false
): TemplateResult => {
  return html`<button
    class="${classMap({
      'tk__action-button': true,
      'tk__action-button--primary': primary,
    })}"
    @click=${onClick}
  >
    ${label}
  </button>`
}

// Helper: Create action container with optional buttons
export const actionContainerTemplate = (
  content: TemplateResult,
  buttons?: TemplateResult[]
): TemplateResult => {
  return html`<div class="tk__action">
    ${content}
    ${buttons?.length
      ? html`<div class="tk__action-buttons">${buttons}</div>`
      : ''}
  </div>`
}

// Template: Action response with buttons
export const actionResponseTemplate = (item: ActionResponse): TemplateResult => {
  const buttons = item.actions?.map((action) =>
    actionButtonTemplate(action.label, action.click, action.primary || false)
  )
  return actionContainerTemplate(
    html`<div class="tk__action-prompt">${item.text}</div>`,
    buttons
  )
}