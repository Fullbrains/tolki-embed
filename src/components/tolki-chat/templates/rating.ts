import { html, TemplateResult } from 'lit'
import { msg } from '@lit/localize'

function starTemplate(
  index: number,
  onRate: (rating: number) => void,
): TemplateResult {
  return html`
    <button
      class="tk__rating-star"
      aria-label="${index}"
      @click=${() => onRate(index)}
      @mouseenter=${(e: Event) => {
        const container = (e.currentTarget as HTMLElement).closest(
          '.tk__rating-stars'
        )
        if (!container) return
        container
          .querySelectorAll('.tk__rating-star')
          .forEach((star, i) =>
            star.classList.toggle('tk__rating-star--hover', i < index)
          )
      }}
      @mouseleave=${(e: Event) => {
        const container = (e.currentTarget as HTMLElement).closest(
          '.tk__rating-stars'
        )
        if (!container) return
        container
          .querySelectorAll('.tk__rating-star')
          .forEach((star) =>
            star.classList.remove('tk__rating-star--hover')
          )
      }}
    >
      <svg width="20" height="20" viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"><path d="M128,189.09l54.72,33.65a8.4,8.4,0,0,0,12.52-9.17l-14.88-62.79,48.7-42A8.46,8.46,0,0,0,224.27,94L160.36,88.8,135.74,29.2a8.36,8.36,0,0,0-15.48,0L95.64,88.8,31.73,94a8.46,8.46,0,0,0-4.79,14.83l48.7,42L60.76,213.57a8.4,8.4,0,0,0,12.52,9.17Z"/></svg>
    </button>
  `
}

export const ratingTemplate = (
  visible: boolean,
  submitted: boolean,
  onRate: (rating: number) => void,
  onDismiss: () => void
): TemplateResult => {
  if (!visible) return html``

  if (submitted) {
    return html`
      <div class="tk__chat-item tk__chat-item--action">
        <div class="tk__action tk__rating tk__rating--thanks">
          <div class="tk__action-prompt">${msg('Thanks for your feedback!')}</div>
        </div>
      </div>
    `
  }

  return html`
    <div class="tk__chat-item tk__chat-item--action">
      <div class="tk__action tk__rating">
        <div class="tk__action-prompt">${msg('How was this conversation?')}</div>
        <div class="tk__rating-stars">
          ${[1, 2, 3, 4, 5].map((i) => starTemplate(i, onRate))}
        </div>
        <div class="tk__action-buttons">
          <button class="tk__action-button" @click=${onDismiss}>
            ${msg('Dismiss')}
          </button>
        </div>
      </div>
    </div>
  `
}
