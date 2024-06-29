import { html } from 'lit'
import { classMap } from 'lit/directives/class-map.js'

export const toggle = (open: boolean) => {
  return html`<button
    aria-description="Chat"
    class=${classMap({
      tkc__toggle: true,
      tkc__dots: true,
      'tkc__toggle--open': open,
    })}
  >
    <span></span><span></span><span></span>
  </button>`
}
