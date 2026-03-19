import { html, render, TemplateResult } from 'lit'
import { msg } from '@lit/localize'
import {
  DocumentSearchQueryResponse,
  DocumentSearchResultsResponse,
  DocumentSearchDocument,
} from '../../../types/item'

function scoreColor(score: number): string {
  if (score >= 0.7) return 'tk__source-score--high'
  if (score >= 0.4) return 'tk__source-score--mid'
  return 'tk__source-score--low'
}

function toggleText(e: Event) {
  const btn = e.currentTarget as HTMLElement
  const container = btn.closest('.tk__source-doc')
  const textEl = container?.querySelector('.tk__source-doc-text') as HTMLElement
  if (!textEl) return

  const isExpanded = textEl.classList.toggle('tk__source-doc-text--expanded')
  btn.textContent = isExpanded ? msg('Read less') : msg('Read more')
}

function sourceDocTemplate(doc: DocumentSearchDocument): TemplateResult {
  return html`
    <div class="tk__source-doc">
      <div class="tk__source-doc-filename">${doc.filename}</div>
      <span class="tk__source-score ${scoreColor(doc.score)}">
        ${msg('Relevance')} <strong>${(doc.score * 100).toFixed(0)}%</strong>
      </span>
      <div class="tk__source-doc-text">${doc.text}</div>
      <button class="tk__source-doc-toggle" @click=${toggleText}>
        ${msg('Read more')}
      </button>
    </div>
  `
}

function searchResultsTemplate(
  result: DocumentSearchResultsResponse,
  queries: DocumentSearchQueryResponse[]
): TemplateResult {
  const query = queries.find((q) => q.search_id === result.search_id)
  return html`
    <div class="tk__source-group">
      ${query
        ? html`<div class="tk__source-query">
            <span class="tk__source-query-label">${msg('Search query')}:</span>
            <span class="tk__source-query-text">${query.query}</span>
          </div>`
        : ''}
      <div class="tk__source-docs">
        ${result.documents.map((doc) => sourceDocTemplate(doc))}
      </div>
    </div>
  `
}

/**
 * Opens the sources overlay imperatively — no Lit re-render, no scroll impact.
 * Call this from an event handler passing the shadow root's .tk__window element.
 */
export function openSourcesOverlay(
  windowEl: HTMLElement,
  queries: DocumentSearchQueryResponse[],
  results: DocumentSearchResultsResponse[]
) {
  // Remove any existing overlay
  closeSourcesOverlayImmediate(windowEl)

  const container = document.createElement('div')
  container.className = 'tk__sources-overlay tk__sources--enter'

  const close = () => {
    container.classList.replace('tk__sources--enter', 'tk__sources--exit')
    container.addEventListener('animationend', () => {
      container.remove()
    }, { once: true })
  }

  const content = html`
    <div class="tk__sources-content">
      ${results.map((result) => searchResultsTemplate(result, queries))}
    </div>
    <div class="tk__sources-footer">
      <button class="tk__sources-close" @click=${close}>
        ${msg('Close')}
      </button>
    </div>
  `

  render(content, container)
  windowEl.appendChild(container)
}

function closeSourcesOverlayImmediate(windowEl: HTMLElement) {
  windowEl.querySelectorAll('.tk__sources-overlay')
    .forEach((el) => el.remove())
}
