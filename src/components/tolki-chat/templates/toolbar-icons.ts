import { html, TemplateResult } from 'lit'

export const copyIcon = (): TemplateResult => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256" fill="none">
    <polyline points="168 168 216 168 216 40 88 40 88 88" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
    <rect x="40" y="88" width="128" height="128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
  </svg>
`

export const copiedIcon = (): TemplateResult => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256" fill="none">
    <polyline points="40 144 96 200 224 72" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
  </svg>
`

export const likeIcon = (): TemplateResult => html`
  <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
    <path d="M14.54 10.105h5.533c2.546 0-.764 10.895-2.588 10.895H4.964A.956.956 0 0 1 4 20.053v-9.385c0-.347.193-.666.502-.832C6.564 8.73 8.983 7.824 10.18 5.707l1.28-2.266A.87.87 0 0 1 12.222 3c3.18 0 2.237 4.63 1.805 6.47a.52.52 0 0 0 .513.635"/>
  </svg>
`

export const dislikeIcon = (): TemplateResult => html`
  <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
    <path d="M10.46 13.895H4.927C2.381 13.895 5.691 3 7.515 3h12.521c.532 0 .964.424.964.947v9.385a.95.95 0 0 1-.502.832c-2.062 1.106-4.481 2.012-5.678 4.129l-1.28 2.266a.87.87 0 0 1-.762.441c-3.18 0-2.237-4.63-1.805-6.47a.52.52 0 0 0-.513-.635"/>
  </svg>
`

export const sourcesIcon = (): TemplateResult => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256" fill="none">
    <line x1="40" y1="64" x2="216" y2="64" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
    <line x1="40" y1="128" x2="112" y2="128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
    <line x1="40" y1="192" x2="128" y2="192" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
    <circle cx="184" cy="144" r="32" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
    <line x1="206.63" y1="166.63" x2="232" y2="192" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
  </svg>
`
