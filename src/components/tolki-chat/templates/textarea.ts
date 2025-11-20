import { html } from 'lit'
import { send } from './send'
import { classMap } from 'lit/directives/class-map.js'
import { scrollDown } from './scroll-down'
import { msg } from '@lit/localize'

export const textareaTemplate = (
  pending: boolean,
  showScrollDown: boolean,
  hasSuggestions: boolean = false,
  placeholder: string = 'Type a message...'
) => {
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
      placeholder="${placeholder}"
      aria-label="${placeholder}"
    ></textarea>
    <button
      class="tk__send"
      ?disabled=${pending}
      aria-label="${msg('Send message')}"
    >${send}</button>
  </div>`
}
