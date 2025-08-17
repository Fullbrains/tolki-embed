import { html } from 'lit'
import { send } from './send'
import { classMap } from 'lit/directives/class-map.js'
import { scrollDown } from './scroll-down'
import { msg } from '@lit/localize'

export const textareaTemplate = (pending: boolean, showScrollDown: boolean, hasSuggestions: boolean = false) => {
  return html` <div class=${classMap({
    'tk__input': true,
    'tk__input--with-suggestions': hasSuggestions,
  })}>
    <div
      class=${classMap({
        'tk__scroll-down-container': true,
        'tk__scroll-down-container--visible': showScrollDown,
        'tk__scroll-down-container--with-suggestions': hasSuggestions,
      })}
    >
      <button class="tk__scroll-down">${scrollDown}</button>
    </div>
    <textarea
      class=${classMap({ tk__textarea: true })}
      placeholder="${msg('Type a message...')}"
    ></textarea>
    <button class="tk__send" ?disabled=${pending}>${send}</button>
  </div>`
}
