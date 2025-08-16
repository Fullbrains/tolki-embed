/**
 * Universal navigation that works with both SPA and traditional websites
 */
export const navigateTo = (url: string): void => {
  if (!url) return

  try {
    const targetUrl = new URL(url, window.location.origin)
    
    // Detect if we're in a SPA environment
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
    
    if (isSPA) {
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