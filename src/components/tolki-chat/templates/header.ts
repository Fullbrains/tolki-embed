import { html } from 'lit'
import { close } from './close'
import { reset } from './reset'

export const headerTemplate = (title?: string, avatar?: string) => {
  return html` <div class="tk__header">
    ${avatar ? html`<div class="tk__avatar-wrapper"><img src=${avatar} alt=${title} class="tk__avatar" /></div>` : ''}
    <div class="tk__title">${title || ''}</div>
    <button class="tk__reset">${reset}</button>
    <button class="tk__close">${close}</button>
  </div>`
}
