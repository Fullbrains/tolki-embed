import { html } from 'lit'
import { send } from './svg/send'
import { classMap } from 'lit/directives/class-map.js'
import { scrollDown } from './svg/scroll-down'

export const textarea = (pending: boolean, showScrollDown: boolean) => {
  return html`<div class="tkc__input">
    <div
      class=${classMap({
        'tkc__scroll-down-container': true,
        'tkc__scroll-down-container--visible': showScrollDown,
      })}
    >
      <button class="tkc__scroll-down">${scrollDown}</button>
    </div>
    <textarea
      class=${classMap({ tkc__textarea: true })}
      placeholder="Type a message..."
    ></textarea>
    <button class="tkc__send" ?disabled=${pending}>${send}</button>
  </div>`
}
