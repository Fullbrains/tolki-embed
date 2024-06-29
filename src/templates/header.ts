import { html } from 'lit'
import { close } from './svg/close'
import { avatar as avatarSvg } from './svg/avatar'

export const header = (title: string, avatar: string = null) => {
  return html`<div class="tkc__header">
    ${avatar
      ? html`<img src=${avatar} alt=${title} class="tkc__avatar" />`
      : avatarSvg}
    <div class="tkc__title">${title}</div>
    <button class="tkc__close">${close}</button>
  </div>`
}
