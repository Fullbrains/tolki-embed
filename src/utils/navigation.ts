/**
 * Universal navigation that works with both SPA and traditional websites
 */
export const navigateTo = (url: string): void => {
  if (!url) return

  console.log('Attempting navigation to:', url)

  try {
    const targetUrl = new URL(url, window.location.origin)
    
    // Detect if we're in a SPA environment or need special handling
    const isWordPress = !!(
      (window as any).wp ||                           // WordPress
      document.querySelector('[class*="wp-"]') ||     // WordPress classes
      document.querySelector('body.wordpress') ||     // WordPress body class
      document.querySelector('#wp-toolbar') ||        // WordPress admin bar
      document.querySelector('meta[name="generator"][content*="WordPress"]') // WordPress meta
    )
    
    const isSPA = !!(
      (window as any).$nuxt ||                        // Nuxt
      (window as any).__NEXT_DATA__ ||                // Next.js
      (window as any).React ||                        // React app
      (window as any).Vue ||                          // Vue app
      (window as any).angular ||                      // Angular
      document.querySelector('[data-reactroot]') ||   // React
      document.querySelector('#__nuxt') ||            // Nuxt
      document.querySelector('#__next') ||            // Next.js
      document.querySelector('[ng-version]')          // Angular
    )
    
    console.log('Environment detection:', { isSPA, isWordPress, isInIframe: window.parent !== window })
    
    if (isSPA) {
      console.log('Using SPA navigation')
      // SPA: Use pushState + popstate to trigger router navigation
      window.history.pushState({}, '', targetUrl.pathname + targetUrl.search + targetUrl.hash)
      window.dispatchEvent(new PopStateEvent('popstate', { state: {} }))
    } else if (isWordPress) {
      console.log('Using WordPress navigation')
      // WordPress: Use window.open with _parent to ensure navigation works
      // This handles cases where the widget might be in an iframe or restricted context
      try {
        if (window.parent && window.parent !== window) {
          console.log('Navigating parent window')
          // If in iframe, try to navigate parent window
          window.parent.location.href = url
        } else {
          console.log('Using window.open fallback')
          // Use window.open with _self as fallback for WordPress
          window.open(url, '_self')
        }
      } catch (error) {
        console.log('WordPress navigation error, using fallback:', error)
        // Final fallback
        window.location.href = url
      }
    } else {
      console.log('Using traditional navigation')
      // Traditional website: Navigate normally
      window.location.href = url
    }
  } catch (error) {
    console.error('Navigation error:', error)
    // Fallback to normal navigation
    window.location.href = url
  }
}