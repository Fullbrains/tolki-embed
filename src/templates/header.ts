import { html } from 'lit'
import { close } from './svg/close'
import { reset } from './svg/reset'

export const headerTemplate = (title?: string, avatar?: string) => {
  return html` <div class="tkc__header">
    ${avatar
      ? html`<img src=${avatar} alt=${title} class="tkc__avatar" />`
      : ''}
    <div class="tkc__title">${title || ''}</div>
    <button class="tkc__reset">${reset}</button>
    <button class="tkc__close">${close}</button>
  </div>`
}
