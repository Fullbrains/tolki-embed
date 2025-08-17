import { msg, str } from '@lit/localize'

// Template functions for translatable strings with parameters
export const TRANSLATION_TEMPLATES = {
  // Cart notification template
  cart_items_count: (params: { count: number }) => 
    msg(str`You have ${params.count} items in cart.`),
  
  // Language changed template
  language_changed: () => 
    msg('Language changed.'),
  
  // Reset confirmation template
  reset_confirmation: () => 
    msg('Do you want to start a new chat? You will lose the current messages.'),
  
  // Privacy policy template  
  privacy_policy: () => 
    msg('By using this chat, you agree to our <a target="_blank" href="https://tolki.ai/privacy">privacy policy</a>.'),
  
  // Error message template
  error_message: () => 
    msg('Sorry, there was an error processing your message.'),
  
  // Action button labels
  view_cart: () => 
    msg('View Cart'),
  
  reset: () => 
    msg('Reset'),
  
  cancel: () => 
    msg('Cancel'),
  
  // Simple cart message without count
  cart_items: () => 
    msg('You have items in cart.'),
}

// Helper function to render template with parameters
export function renderTemplate(templateKey: string, templateParams?: { [key: string]: any }): string {
  const template = TRANSLATION_TEMPLATES[templateKey]
  if (!template) {
    console.warn(`Template not found: ${templateKey}`)
    return templateKey // Fallback to key
  }
  
  try {
    return template(templateParams || {})
  } catch (error) {
    console.error(`Error rendering template ${templateKey}:`, error)
    return templateKey // Fallback to key
  }
}