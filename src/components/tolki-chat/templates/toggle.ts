import { html } from 'lit'
import { classMap } from 'lit/directives/class-map.js'

export const toggleTemplate = (
  open: boolean,
  unclosable: boolean,
  ariaLabel: string = 'Tolki AI',
  position: 'left' | 'center' | 'right' = 'right',
  placeholder?: string
) => {
  const hasPlaceholder = placeholder && placeholder.trim() !== ''

  return html` <button
    aria-label="${ariaLabel}"
    class=${classMap({
      tk__toggle: true,
      'tk__toggle--open': open,
      'tk__toggle--unclosable': unclosable,
      'tk__toggle--left': position === 'left',
      'tk__toggle--center': position === 'center',
      'tk__toggle--right': position === 'right',
      'tk__toggle--with-text': hasPlaceholder,
    })}
  >
    <span class="tk__dots">
      <span></span><span></span><span></span>
    </span>
    ${hasPlaceholder ? html`<span class="tk__toggle-text">${placeholder}</span>` : ''}
  </button>`
}
