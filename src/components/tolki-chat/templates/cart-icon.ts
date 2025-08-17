import { html, TemplateResult } from 'lit'

// Shared cart icon template to avoid duplication
export const cartIconTemplate = (): TemplateResult => {
  return html`
    <div class="tk__cart-notification-icon">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
        <path
          d="m30.3 26.6-1.33-11.25a1.32 1.32 0 0 0-1.32-1.16h-3.34V14a4.31 4.31 0 1 0-8.62 0v.19h-3.35a1.32 1.32 0 0 0-1.3 1.16L9.68 26.6A1.31 1.31 0 0 0 11 28.06h17.98a1.31 1.31 0 0 0 1.32-1.46ZM16.81 14a3.19 3.19 0 1 1 6.38 0v.19H16.8V14Zm12.33 12.87a.2.2 0 0 1-.15.07H11.01a.2.2 0 0 1-.19-.13.18.18 0 0 1 0-.08l1.33-11.25a.19.19 0 0 1 .2-.17h3.34v2.44a.56.56 0 0 0 1.12 0v-2.44h6.38v2.44a.56.56 0 1 0 1.12 0v-2.44h3.35a.19.19 0 0 1 .19.17l1.34 11.25a.18.18 0 0 1-.05.14Z"
        />
      </svg>
    </div>
  `
}