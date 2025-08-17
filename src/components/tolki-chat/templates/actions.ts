import { html, TemplateResult } from 'lit'
import { classMap } from 'lit/directives/class-map.js'
import { ActionResponse } from '../../../types/item'
import { msg, str } from '@lit/localize'
import { renderTemplate } from '../../../utils/templates'

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
  let processedText: string
  
  // Use template system if templateKey is provided
  if (item.templateKey) {
    processedText = renderTemplate(item.templateKey, item.templateParams)
  } else {
    // Fallback to original text
    processedText = item.text
  }
  
  const buttons = item.actions?.map((action) => {
    const handleClick = (e: Event) => {
      e.preventDefault()
      // Execute command from registry
      if (action.command && window.ActionCommands && window.ActionCommands[action.command]) {
        window.ActionCommands[action.command](action.data, item)
      }
    }
    
    // Use template system for button labels if available
    const buttonLabel = action.templateKey 
      ? renderTemplate(action.templateKey, action.templateParams)
      : action.label
    
    return actionButtonTemplate(buttonLabel, handleClick, action.primary || false)
  })
  return actionContainerTemplate(
    html`<div class="tk__action-prompt">${processedText}</div>`,
    buttons
  )
}