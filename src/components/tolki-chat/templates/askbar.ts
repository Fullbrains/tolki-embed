import { html } from 'lit'
import { classMap } from 'lit/directives/class-map.js'
import { msg } from '@lit/localize'
import { send } from './send'
import { typingPlaceholder } from '../../../utils/typing-placeholder'

/**
 * Collapsed state for toggle-mode="ask": a floating input bar instead of
 * the round bubble. Rendered as a sibling of .tk__window, so it must only use
 * host-level tokens (--toggle-*) — the --color-* semantic tokens are rebound on
 * .tk__window--dark and would never reach here.
 */
export const askbarTemplate = (
  ariaLabel: string = 'Tolki AI',
  position: 'left' | 'center' | 'right' = 'right',
  placeholder: string = 'Ask anything',
  isDark: boolean = false,
  /** Suggested queries cycled as a typewriter placeholder (empty → static). */
  phrases: string[] = []
) => {
  return html` <div
    class=${classMap({
      tk__askbar: true,
      'tk__askbar--dark': isDark,
      'tk__askbar--left': position === 'left',
      'tk__askbar--center': position === 'center',
      'tk__askbar--right': position === 'right',
    })}
  >
    <button class="tk__askbar-open" aria-label="${ariaLabel}">
      <span class="tk__dots">
        <span></span><span></span><span></span>
      </span>
    </button>
    <input
      class="tk__askbar-input"
      type="text"
      autocomplete="off"
      aria-label="${placeholder}"
      ${typingPlaceholder(phrases, placeholder)}
    />
    <button class="tk__askbar-send" aria-label="${msg('Send message')}">
      ${send}
    </button>
  </div>`
}
