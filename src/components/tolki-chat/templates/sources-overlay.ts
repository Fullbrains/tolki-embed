import { html, render, TemplateResult } from 'lit'
import { msg } from '@lit/localize'
import {
  DocumentSearchQueryResponse,
  DocumentSearchResultsResponse,
  DocumentSearchDocument,
} from '../../../types/item'
import { ChatPosition } from '../../../types/props'

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

function queryDebugTemplate(
  query: DocumentSearchQueryResponse,
  result: DocumentSearchResultsResponse
): TemplateResult {
  return html`
    <div class="tk__source-query-debug">
      <div class="tk__source-query-debug-row">
        <span class="tk__source-query-debug-label">${msg('Query')}</span>
        <span class="tk__source-query-debug-value">${query.query}</span>
      </div>
      <div class="tk__source-query-debug-row">
        <span class="tk__source-query-debug-label tk__source-query-debug-label--query">${msg('Query Search ID')}</span>
        <code class="tk__source-query-debug-value tk__source-query-debug-code">${query.search_id}</code>
      </div>
      <div class="tk__source-query-debug-row">
        <span class="tk__source-query-debug-label tk__source-query-debug-label--results">${msg('Results Search ID')}</span>
        <code class="tk__source-query-debug-value tk__source-query-debug-code">${result.search_id}</code>
      </div>
    </div>
  `
}

function searchResultsTemplate(
  result: DocumentSearchResultsResponse,
  query: DocumentSearchQueryResponse | undefined,
  showQueries: boolean
): TemplateResult {
  return html`
    <div class="tk__source-group">
      ${showQueries && query
        ? queryDebugTemplate(query, result)
        : query
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
 * Determine which side the sidebar should appear on (opposite to the embed position).
 */
function getSidebarSide(position: ChatPosition): 'left' | 'right' | 'center' {
  switch (position) {
    case 'left':
      return 'right'
    case 'right':
      return 'left'
    case 'center':
      return 'center'
    case 'inline':
      return 'right'
    default:
      return 'left'
  }
}

/**
 * Opens the sources sidebar outside the .tk__window element.
 * The sidebar is positioned on the opposite side of the embed.
 */
export function openSourcesOverlay(
  windowEl: HTMLElement,
  queries: DocumentSearchQueryResponse[],
  results: DocumentSearchResultsResponse[],
  showQueries: boolean = false,
  position: ChatPosition = 'right'
) {
  // Remove any existing sidebar
  closeSourcesOverlayImmediate(windowEl)

  const side = getSidebarSide(position)
  const container = document.createElement('div')
  container.className = `tk__sources-sidebar tk__sources-sidebar--${side} tk__sources--enter`

  const close = () => {
    container.classList.replace('tk__sources--enter', 'tk__sources--exit')
    container.addEventListener('animationend', () => {
      container.remove()
    }, { once: true })
  }

  const content = html`
    <div class="tk__sources-content">
      ${results.map((result, i) => searchResultsTemplate(result, queries[i], showQueries))}
    </div>
    <div class="tk__sources-footer">
      <button class="tk__sources-close" @click=${close}>
        ${msg('Close')}
      </button>
    </div>
  `

  render(content, container)

  // Append as sibling of .tk__window (inside the shadow root, but outside the window)
  if (windowEl.parentNode) {
    windowEl.parentNode.insertBefore(container, windowEl.nextSibling)
  } else {
    windowEl.appendChild(container)
  }
}

export function closeSourcesOverlayImmediate(windowEl: HTMLElement) {
  // Look for sidebar in parent (sibling) and in windowEl itself (legacy)
  const parent = windowEl.parentNode
  if (parent) {
    parent.querySelectorAll('.tk__sources-sidebar, .tk__sources-overlay')
      .forEach((el) => el.remove())
  }
  windowEl.querySelectorAll('.tk__sources-sidebar, .tk__sources-overlay')
    .forEach((el) => el.remove())
}
