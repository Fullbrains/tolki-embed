import { html, TemplateResult } from 'lit'
import { msg } from '@lit/localize'
import {
  copyIcon,
  copiedIcon,
  likeIcon,
  dislikeIcon,
  sourcesIcon,
} from './toolbar-icons'
import {
  Item,
  ItemType,
  DocumentSearchQueryResponse,
  DocumentSearchResultsResponse,
} from '../../../types/item'

/**
 * Collects document_search_query and document_search_results items
 * that immediately follow the given index in the history.
 */
function getSourcesForMessage(
  history: Item[],
  messageIndex: number
): {
  queries: DocumentSearchQueryResponse[]
  results: DocumentSearchResultsResponse[]
} {
  const queries: DocumentSearchQueryResponse[] = []
  const results: DocumentSearchResultsResponse[] = []

  for (let i = messageIndex + 1; i < history.length; i++) {
    const item = history[i]
    if (item.type === ItemType.documentSearchQuery) {
      queries.push(item as DocumentSearchQueryResponse)
    } else if (item.type === ItemType.documentSearchResults) {
      results.push(item as DocumentSearchResultsResponse)
    } else {
      break
    }
  }

  return { queries, results }
}

/**
 * Toolbar template rendered below each assistant markdown message.
 */
export const toolbarTemplate = (
  content: string,
  history: Item[],
  messageIndex: number
): TemplateResult => {
  const sources = getSourcesForMessage(history, messageIndex)
  const hasSources = sources.results.length > 0

  return html`
    <div class="tk__toolbar">
      <button
        class="tk__toolbar-btn"
        title=${msg('Copy')}
        @click=${(e: Event) => handleCopy(e, content)}
      >
        ${copyIcon()}
      </button>
      <button
        class="tk__toolbar-btn"
        title=${msg('Like')}
        @click=${(e: Event) => handleLike(e)}
      >
        ${likeIcon()}
      </button>
      <button
        class="tk__toolbar-btn"
        title=${msg('Dislike')}
        @click=${(e: Event) => handleDislike(e)}
      >
        ${dislikeIcon()}
      </button>
      ${hasSources
        ? html`
            <button
              class="tk__toolbar-btn"
              title=${msg('Sources')}
              @click=${() => openSourcesOverlay(sources)}
            >
              ${sourcesIcon()}
            </button>
          `
        : ''}
    </div>
  `
}

function handleCopy(e: Event, content: string) {
  const btn = e.currentTarget as HTMLElement
  navigator.clipboard.writeText(content).then(() => {
    btn.classList.add('tk__toolbar-btn--copied')
    const original = btn.innerHTML
    btn.innerHTML = ''
    const temp = document.createElement('div')
    const templateResult = copiedIcon()
    // Render the copied icon inline
    import('lit').then(({ render }) => {
      render(templateResult, temp)
      btn.innerHTML = temp.innerHTML
      setTimeout(() => {
        btn.classList.remove('tk__toolbar-btn--copied')
        btn.innerHTML = original
      }, 1500)
    })
  })
}

function handleLike(e: Event) {
  const btn = e.currentTarget as HTMLElement
  const sibling = btn.nextElementSibling as HTMLElement
  btn.classList.toggle('tk__toolbar-btn--active')
  sibling?.classList.remove('tk__toolbar-btn--active')
}

function handleDislike(e: Event) {
  const btn = e.currentTarget as HTMLElement
  const sibling = btn.previousElementSibling as HTMLElement
  btn.classList.toggle('tk__toolbar-btn--active')
  sibling?.classList.remove('tk__toolbar-btn--active')
}

function openSourcesOverlay(sources: {
  queries: DocumentSearchQueryResponse[]
  results: DocumentSearchResultsResponse[]
}) {
  // Dispatch custom event to open the sources overlay
  // The main component will handle rendering
  document.dispatchEvent(
    new CustomEvent('tolki:sources:open', { detail: sources })
  )
}
