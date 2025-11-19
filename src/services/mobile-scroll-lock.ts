/**
 * Service to manage mobile body scroll locking
 * Prevents background scrolling when chat is open on mobile devices
 */
export class MobileScrollLockService {
  private static readonly MOBILE_BREAKPOINT_PX = 480
  private isLocked = false

  /**
   * Check if currently on mobile
   */
  private isMobile(): boolean {
    return window.innerWidth <= MobileScrollLockService.MOBILE_BREAKPOINT_PX
  }

  /**
   * Lock body scroll on mobile
   */
  lock(): void {
    if (!this.isMobile() || this.isLocked) return

    const body = document.body
    const html = document.documentElement
    const scrollY = window.scrollY
    const scrollBarWidth =
      window.innerWidth - document.documentElement.clientWidth

    // Store original styles
    body.setAttribute('data-tolki-scroll-y', scrollY.toString())
    body.setAttribute('data-tolki-original-overflow', body.style.overflow || '')
    body.setAttribute('data-tolki-original-position', body.style.position || '')
    body.setAttribute('data-tolki-original-top', body.style.top || '')
    body.setAttribute('data-tolki-original-width', body.style.width || '')
    html.setAttribute('data-tolki-original-overflow', html.style.overflow || '')

    // Apply scroll lock
    body.style.setProperty('overflow', 'hidden', 'important')
    body.style.setProperty('position', 'fixed', 'important')
    body.style.setProperty('top', `-${scrollY}px`, 'important')
    body.style.setProperty('width', '100%', 'important')
    body.style.setProperty('height', '100%', 'important')

    // Handle scrollbar compensation
    if (scrollBarWidth > 0) {
      body.style.setProperty(
        'padding-right',
        `${scrollBarWidth}px`,
        'important'
      )
    }

    html.style.setProperty('overflow', 'hidden', 'important')
    html.style.setProperty('height', '100%', 'important')

    // iOS specific fixes - using combined detection for robustness
    const isTouchDevice =
      'ontouchstart' in window || navigator.maxTouchPoints > 0
    const isLikelyIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window)

    if (isTouchDevice && isLikelyIOS) {
      body.style.setProperty('-webkit-overflow-scrolling', 'auto', 'important')
      html.style.setProperty('-webkit-overflow-scrolling', 'auto', 'important')
    }

    // Prevent zoom on iOS
    const viewport = document.querySelector('meta[name="viewport"]')
    if (viewport) {
      viewport.setAttribute(
        'data-tolki-original-content',
        viewport.getAttribute('content') || ''
      )
      viewport.setAttribute(
        'content',
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
      )
    }

    this.isLocked = true
  }

  /**
   * Unlock body scroll on mobile
   */
  unlock(): void {
    if (!this.isLocked) return

    const body = document.body
    const html = document.documentElement

    // Restore all original styles
    const scrollY = body.getAttribute('data-tolki-scroll-y')
    const originalOverflow = body.getAttribute('data-tolki-original-overflow')
    const originalPosition = body.getAttribute('data-tolki-original-position')
    const originalTop = body.getAttribute('data-tolki-original-top')
    const originalWidth = body.getAttribute('data-tolki-original-width')
    const htmlOriginalOverflow = html.getAttribute(
      'data-tolki-original-overflow'
    )

    // Remove all applied styles
    body.style.removeProperty('overflow')
    body.style.removeProperty('position')
    body.style.removeProperty('top')
    body.style.removeProperty('width')
    body.style.removeProperty('height')
    body.style.removeProperty('padding-right')
    body.style.removeProperty('-webkit-overflow-scrolling')

    html.style.removeProperty('overflow')
    html.style.removeProperty('height')
    html.style.removeProperty('-webkit-overflow-scrolling')

    // Restore original values
    if (originalOverflow) body.style.overflow = originalOverflow
    if (originalPosition) body.style.position = originalPosition
    if (originalTop) body.style.top = originalTop
    if (originalWidth) body.style.width = originalWidth
    if (htmlOriginalOverflow) html.style.overflow = htmlOriginalOverflow

    // Restore viewport
    const viewport = document.querySelector('meta[name="viewport"]')
    if (viewport) {
      const originalContent = viewport.getAttribute(
        'data-tolki-original-content'
      )
      if (originalContent) {
        viewport.setAttribute('content', originalContent)
        viewport.removeAttribute('data-tolki-original-content')
      }
    }

    // Clean up attributes
    body.removeAttribute('data-tolki-scroll-y')
    body.removeAttribute('data-tolki-original-overflow')
    body.removeAttribute('data-tolki-original-position')
    body.removeAttribute('data-tolki-original-top')
    body.removeAttribute('data-tolki-original-width')
    html.removeAttribute('data-tolki-original-overflow')

    // Restore scroll position
    if (scrollY) {
      requestAnimationFrame(() => {
        window.scrollTo(0, parseInt(scrollY, 10))
      })
    }

    this.isLocked = false
  }

  /**
   * Get current lock state
   */
  getIsLocked(): boolean {
    return this.isLocked
  }
}
