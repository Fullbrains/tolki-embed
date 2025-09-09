import { Item } from '../types/item'
import { ItemBuilder } from '../services/item-builder'

/**
 * Utility class for cart-related operations
 * Focused specifically on cart functionality
 */
export class CartHelpers {
  /**
   * Create cart notification based on current cart state
   */
  static createCartNotification(): Item | null {
    const cartData = window.tolki?.cart
    const itemCount = cartData?.items?.length || 0
    const status = cartData?.status
    
    // Only show notification if cart is loaded and has items
    // Don't show for loading, idle, error, or empty states
    if (status === 'loaded' && itemCount > 0) {
      return ItemBuilder.cartNotification()
    }
    
    // Don't show notification in any other case
    return null
  }

  /**
   * Get current cart item count
   */
  static getCartItemCount(): number {
    return window.tolki?.cart?.items?.length || 0
  }

  /**
   * Check if cart is in loading state
   */
  static isCartLoading(): boolean {
    return window.tolki?.cart?.status === 'loading'
  }

  /**
   * Check if cart is in error state
   */
  static isCartError(): boolean {
    return window.tolki?.cart?.status === 'error'
  }

  /**
   * Check if cart is in idle state
   */
  static isCartIdle(): boolean {
    return window.tolki?.cart?.status === 'idle'
  }

  /**
   * Check if cart is loaded
   */
  static isCartLoaded(): boolean {
    return window.tolki?.cart?.status === 'loaded'
  }

  /**
   * Get current cart status
   */
  static getCartStatus(): 'idle' | 'loading' | 'loaded' | 'error' | undefined {
    return window.tolki?.cart?.status
  }

  /**
   * Check if cart has items
   */
  static hasCartItems(): boolean {
    return this.getCartItemCount() > 0
  }
}

/**
 * Utility class for styling operations
 * Handles bot configuration styling
 */
export class StyleHelpers {
  private static readonly DEFAULT_COLORS = {
    'toggle-default-background': '#3b82f6',
    'toggle-hover-background': '#2563eb', 
    'toggle-dots-background': '#f8fafc',
    'bubble-background': '#2563eb',
    'bubble-color': '#ffffff'
  }

  /**
   * Get CSS color variables from bot configuration
   */
  static getColorVariables(botProps?: { styles?: { chat?: { button?: { defaultBackgroundColor?: string; hoverBackgroundColor?: string; foregroundColor?: string }; bubble?: { backgroundColor?: string; foregroundColor?: string } } } }): string {
    if (!botProps?.styles?.chat) return ''

    const styles = botProps.styles.chat
    const colorMap: { [key: string]: string } = {}
    
    // Map bot configuration to CSS variables
    colorMap['toggle-default-background'] = 
      styles?.button?.defaultBackgroundColor || this.DEFAULT_COLORS['toggle-default-background']
    colorMap['toggle-hover-background'] = 
      styles?.button?.hoverBackgroundColor || this.DEFAULT_COLORS['toggle-hover-background']
    colorMap['toggle-dots-background'] = 
      styles?.button?.foregroundColor || this.DEFAULT_COLORS['toggle-dots-background']
    colorMap['bubble-background'] = 
      styles?.bubble?.backgroundColor || this.DEFAULT_COLORS['bubble-background']
    colorMap['bubble-color'] = 
      styles?.bubble?.foregroundColor || this.DEFAULT_COLORS['bubble-color']

    return Object.entries(colorMap)
      .map(([key, value]) => `--${key}:${value}`)
      .join(';')
  }

  /**
   * Get default color for a specific CSS variable
   */
  static getDefaultColor(variableName: string): string {
    return this.DEFAULT_COLORS[variableName] || '#000000'
  }
}

/**
 * Utility class for UUID operations
 * Focused on UUID validation and generation
 */
export class UUIDHelpers {
  /**
   * Validate UUID format (basic validation)
   */
  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }

  /**
   * Validate and normalize UUID with fallback
   */
  static validateOrFallback(uuid: string, fallbackGenerator: () => string): string {
    if (!uuid || !this.isValidUUID(uuid)) {
      return fallbackGenerator()
    }
    return uuid
  }

  /**
   * Basic UUID validation (length-based fallback)
   */
  static validateBasic(uuid: string, fallbackGenerator: () => string): string {
    if (!uuid || uuid.length < 10) {
      return fallbackGenerator()
    }
    return uuid
  }
}