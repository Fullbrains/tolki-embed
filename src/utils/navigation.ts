/**
 * Universal navigation that works with both SPA and traditional websites
 */
export const navigateTo = (url: string): void => {
  console.log('navigateTo called with:', url)
  if (!url) {
    console.warn('navigateTo: No URL provided')
    return
  }


  try {
    const targetUrl = new URL(url, window.location.origin)
    
    // Detect if we're in WordPress environment (check first as it takes priority)
    const isWordPress = !!(
      (window as any).wp ||                           // WordPress
      document.querySelector('[class*="wp-"]') ||     // WordPress classes
      document.querySelector('body.wordpress') ||     // WordPress body class
      document.querySelector('#wp-toolbar') ||        // WordPress admin bar
      document.querySelector('meta[name="generator"][content*="WordPress"]') // WordPress meta
    )
    
    // Only check for SPA if NOT WordPress (WordPress may have React/Vue but isn't a true SPA)
    const isSPA = !isWordPress && !!(
      (window as any).$nuxt ||                        // Nuxt
      (window as any).__NEXT_DATA__ ||                // Next.js
      (window as any).angular ||                      // Angular
      document.querySelector('#__nuxt') ||            // Nuxt
      document.querySelector('#__next') ||            // Next.js
      document.querySelector('[ng-version]') ||       // Angular
      // More specific React/Vue checks to avoid WordPress false positives
      (document.querySelector('[data-reactroot]') && !(window as any).wp) ||
      ((window as any).React && document.querySelector('#root, #app') && !(window as any).wp) ||
      ((window as any).Vue && document.querySelector('#app') && !(window as any).wp)
    )
    
    
    if (isWordPress) {
      // WordPress: Use window.open with _parent to ensure navigation works
      // This handles cases where the widget might be in an iframe or restricted context
      try {
        if (window.parent && window.parent !== window) {
          // If in iframe, try to navigate parent window
          window.parent.location.href = url
        } else {
          // Use window.open with _self as fallback for WordPress
          window.open(url, '_self')
        }
      } catch (error) {
        // Final fallback
        window.location.href = url
      }
    } else if (isSPA) {
      // SPA: Use pushState + popstate to trigger router navigation
      window.history.pushState({}, '', targetUrl.pathname + targetUrl.search + targetUrl.hash)
      window.dispatchEvent(new PopStateEvent('popstate', { state: {} }))
    } else {
      // Traditional website: Navigate normally
      window.location.href = url
    }
  } catch (error) {
    console.error('Navigation error:', error)
    // Fallback to normal navigation
    window.location.href = url
  }
}