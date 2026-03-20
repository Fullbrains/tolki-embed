import { html, TemplateResult } from 'lit'
import { msg } from '@lit/localize'
import { FeedbackResponse, ItemType } from '../../../types/item'
import { Api } from '../../../services/api'

const MAX_CHARS = 300

function handleInput(e: Event) {
  const textarea = e.currentTarget as HTMLTextAreaElement
  const container = textarea.closest('.tk__feedback')
  if (!container) return

  // Enforce max length
  if (textarea.value.length > MAX_CHARS) {
    textarea.value = textarea.value.slice(0, MAX_CHARS)
  }

  // Update counter
  const counter = container.querySelector('.tk__feedback-counter') as HTMLElement
  if (counter) {
    counter.textContent = `${textarea.value.length}/${MAX_CHARS}`
  }

  // Auto-height
  textarea.style.height = 'auto'
  textarea.style.height = textarea.scrollHeight + 'px'
}

function handleSubmit(item: FeedbackResponse) {
  return (e: Event) => {
    const btn = e.currentTarget as HTMLElement
    const container = btn.closest('.tk__feedback')
    if (!container) return

    const textarea = container.querySelector('.tk__feedback-textarea') as HTMLTextAreaElement
    const message = textarea?.value?.trim()
    if (!message) return

    // Send feedback via API
    Api.messageFeedback(item.botUuid, item.chatUuid, item.messageId, undefined, message).catch(() => {})

    // Replace with thanks message
    const wrapper = container.closest('.tk__chat-item')
    if (wrapper) {
      wrapper.innerHTML = ''
      const thanks = document.createElement('div')
      thanks.className = 'tk__action tk__feedback tk__feedback--thanks'
      thanks.innerHTML = `<div class="tk__action-prompt">${msg('Thanks for your feedback!')}</div>`
      wrapper.appendChild(thanks)

      // Remove after delay
      setTimeout(() => {
        wrapper.remove()
      }, 3000)
    }
  }
}

function handleCancel() {
  return (e: Event) => {
    const btn = e.currentTarget as HTMLElement
    const wrapper = btn.closest('.tk__chat-item')
    if (wrapper) {
      // Dispatch event to remove from history
      document.dispatchEvent(
        new CustomEvent('tolki:feedback:cancel', { detail: { element: wrapper } })
      )
      wrapper.remove()
    }
  }
}

export const feedbackTemplate = (item: FeedbackResponse): TemplateResult => {
  return html`
    <div class="tk__action tk__feedback">
      <div class="tk__feedback-body">
        <textarea
          class="tk__feedback-textarea"
          placeholder=${msg('Leave a feedback')}
          maxlength=${MAX_CHARS}
          rows="2"
          @input=${handleInput}
        ></textarea>
        <div class="tk__feedback-counter">0/${MAX_CHARS}</div>
      </div>
      <div class="tk__action-buttons">
        <button
          class="tk__action-button tk__action-button--primary"
          @click=${handleSubmit(item)}
        >
          ${msg('Submit')}
        </button>
        <button
          class="tk__action-button"
          @click=${handleCancel()}
        >
          ${msg('Cancel')}
        </button>
      </div>
    </div>
  `
}
