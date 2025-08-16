import { html } from 'lit'
import { classMap } from 'lit/directives/class-map.js'

export const toggleTemplate = (open: boolean, unclosable: boolean) => {
  return html` <button
    aria-label="Tolki AI"
    class=${classMap({
      tk__toggle: true,
      tk__dots: true,
      'tk__toggle--open': open,
      'tk__toggle--unclosable': unclosable,
    })}
  >
    <span></span><span></span><span></span>
  </button>`
}
