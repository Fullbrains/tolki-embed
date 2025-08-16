import { html, TemplateResult } from 'lit'

// Template: Image placeholder for missing images
export const imagePlaceholderTemplate = (className: string = ''): TemplateResult => {
  return html`
    <div class="tk__image-placeholder ${className}">
      <!-- SVG icon will be added here later -->
      <div class="tk__placeholder-icon"></div>
    </div>
  `
}

// Template: Image with fallback to placeholder
export const imageWithPlaceholderTemplate = (
  imageUrl: string | undefined, 
  alt: string = '',
  className: string = ''
): TemplateResult => {
  const hasImage = imageUrl && imageUrl.trim()
  
  return hasImage
    ? html`<img src="${imageUrl}" alt="${alt}" class="${className}" />`
    : imagePlaceholderTemplate(className)
}