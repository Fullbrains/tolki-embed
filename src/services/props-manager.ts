import {
  TolkiChatProps,
  DEFAULT_PROPS,
  ChatPosition,
  WindowSize,
  ToggleSize,
  I18nString,
  I18nArray,
  isProOnlyProp,
} from '../types/props'
import {
  parseBoolean,
  parseString,
  parseI18nString,
  parseI18nArray,
  parseStringArray,
  parseHexColor,
  parseEnum,
  parseMargin,
  attrNameToPropName,
} from '../utils/props-parser'
import { HexColor, getContrastColor } from '../utils/color'
import { Logger } from './logger'

/**
 * Props source priority levels
 */
export enum PropsPriority {
  PRO_BACKEND = 4, // Highest priority
  USER_ATTRIBUTES = 3,
  STANDARD_BACKEND = 2,
  DEFAULTS = 1, // Lowest priority
}

/**
 * Props from different sources
 */
interface PropsSource {
  priority: PropsPriority
  props: Partial<TolkiChatProps>
  isPro?: boolean // Whether this is from PRO backend
}

/**
 * Manages props from multiple sources with priority system
 */
export class PropsManager {
  private sources: PropsSource[] = []
  private computedProps: TolkiChatProps | null = null

  /**
   * Set props from PRO backend (highest priority)
   */
  setProBackendProps(props: Partial<TolkiChatProps>): void {
    this.removeSource(PropsPriority.PRO_BACKEND)
    this.sources.push({
      priority: PropsPriority.PRO_BACKEND,
      props,
      isPro: true,
    })
    this.invalidateCache()
  }

  /**
   * Set props from user attributes (HTML attributes or JS API)
   */
  setUserAttributes(attributes: { [key: string]: string | boolean | null }): void {
    const props = this.parseUserAttributes(attributes)
    this.removeSource(PropsPriority.USER_ATTRIBUTES)
    this.sources.push({
      priority: PropsPriority.USER_ATTRIBUTES,
      props,
      isPro: false,
    })
    this.invalidateCache()
  }

  /**
   * Set props from standard backend
   */
  setStandardBackendProps(props: Partial<TolkiChatProps>): void {
    this.removeSource(PropsPriority.STANDARD_BACKEND)
    this.sources.push({
      priority: PropsPriority.STANDARD_BACKEND,
      props,
      isPro: false,
    })
    this.invalidateCache()
  }

  /**
   * Parse user attributes from HTML attributes
   */
  private parseUserAttributes(attributes: {
    [key: string]: string | boolean | null
  }): Partial<TolkiChatProps> {
    const props: Partial<TolkiChatProps> = {}

    for (const [attrName, value] of Object.entries(attributes)) {
      const propName = attrNameToPropName(attrName)

      // Skip PRO-only props from user attributes
      if (isProOnlyProp(propName)) {
        Logger.warn(`Cannot set PRO-only prop "${propName}" from user attributes`)
        continue
      }

      // Parse based on property type
      switch (propName) {
        // Enums
        case 'position':
          props.position = parseEnum(value as string, [
            'inline',
            'left',
            'center',
            'right',
          ])
          break
        case 'windowSize':
          props.windowSize = parseEnum(value as string, ['sm', 'md', 'lg', 'xl'])
          break
        case 'toggleSize':
          props.toggleSize = parseEnum(value as string, ['sm', 'md', 'lg'])
          break
        case 'margin':
          props.margin = parseMargin(value as string) ?? undefined
          break

        // Booleans
        case 'defaultOpen':
        case 'expandable':
        case 'unclosable':
          props[propName] = parseBoolean(value)
          break

        // Backdrop blur (enum: none, sm, md, lg, xl)
        case 'backdropBlur':
          props.backdropBlur = parseEnum(value as string, ['none', 'sm', 'md', 'lg', 'xl'])
          break

        // Dark mode (enum: auto, light, dark)
        case 'dark':
          props.dark = parseEnum(value as string, ['auto', 'light', 'dark'])
          break

        // Rounded (enum: none, xs, sm, md, lg, xl)
        case 'rounded':
          props.rounded = parseEnum(value as string, ['none', 'xs', 'sm', 'md', 'lg', 'xl'])
          break

        // Simple strings
        case 'lang':
          props[propName] = parseString(value as string) || undefined
          break

        // Backdrop
        case 'backdropColor':
          props.backdropColor = parseHexColor(value as string) as HexColor | null
          break
        case 'backdropOpacity':
          const opacity = parseFloat(value as string)
          if (!isNaN(opacity) && opacity >= 0 && opacity <= 1) {
            props.backdropOpacity = opacity
          }
          break
        case 'toggleBackground':
          props.toggleBackground = parseHexColor(value as string) as HexColor | undefined
          break
        case 'toggleContent':
          props.toggleContent = parseHexColor(value as string) as HexColor | null
          break
        case 'messageBackground':
          props.messageBackground = parseHexColor(value as string) as HexColor | undefined
          break
        case 'messageContent':
          props.messageContent = parseHexColor(value as string) as HexColor | null
          break

        // Avatar
        case 'avatar':
          props.avatar = parseString(value as string)
          break

        // I18n strings
        case 'messagePlaceholder':
          props.messagePlaceholder = parseI18nString(value as string)
          break
        case 'togglePlaceholder':
          props.togglePlaceholder = parseI18nString(value as string)
          break
        case 'welcomeMessage':
          props.welcomeMessage = parseI18nString(value as string)
          break

        // I18n arrays
        case 'suggestions':
          props.suggestions = parseI18nArray(value as string)
          break
        case 'toasts':
          props.toasts = parseI18nArray(value as string)
          break

        // String arrays
        case 'locales':
          props.locales = parseStringArray(value as string)
          break

        default:
          Logger.warn(`Unknown prop: ${propName}`)
      }
    }

    // For auto-generated props: if background is set but content is not,
    // explicitly set content to null to override backend values and trigger auto-generation
    const hasToggleBackground = 'toggleBackground' in props
    const hasToggleContent = 'toggleContent' in props
    if (hasToggleBackground && !hasToggleContent) {
      props.toggleContent = null
    }

    const hasMessageBackground = 'messageBackground' in props
    const hasMessageContent = 'messageContent' in props
    if (hasMessageBackground && !hasMessageContent) {
      props.messageContent = null
    }

    return props
  }

  /**
   * Get final computed props with all priorities applied
   */
  getProps(): TolkiChatProps {
    if (this.computedProps) {
      return this.computedProps
    }

    // Start with defaults
    let result: TolkiChatProps = { ...DEFAULT_PROPS }

    // Sort sources by priority (ascending)
    const sortedSources = [...this.sources].sort((a, b) => a.priority - b.priority)

    // Apply each source in order (lower priority first, so higher overrides)
    for (const source of sortedSources) {
      result = this.mergeProps(result, source.props, source.isPro || false)
    }

    // Apply auto-generation for colors
    result = this.applyColorAutoGeneration(result)

    this.computedProps = result
    return result
  }

  /**
   * Merge props with validation
   */
  private mergeProps(
    base: TolkiChatProps,
    incoming: Partial<TolkiChatProps>,
    isPro: boolean
  ): TolkiChatProps {
    const result = { ...base }

    for (const [key, value] of Object.entries(incoming)) {
      // Skip undefined, but allow null for auto-generated color props
      if (value === undefined) continue

      // Allow null for toggleContent and messageContent (they auto-generate)
      const isAutoGeneratedProp = key === 'toggleContent' || key === 'messageContent'
      if (value === null && !isAutoGeneratedProp) continue

      // Skip PRO-only props if not from PRO source
      if (!isPro && isProOnlyProp(key)) {
        continue
      }

      // Apply the value (including null for auto-generated props)
      ;(result as any)[key] = value
    }

    return result
  }

  /**
   * Apply auto-generation for colors
   */
  private applyColorAutoGeneration(props: TolkiChatProps): TolkiChatProps {
    const result = { ...props }

    // Auto-generate toggleContent if not set (based on toggleBackground lightness)
    if (!result.toggleContent) {
      result.toggleContent = getContrastColor(result.toggleBackground) as HexColor
    }

    // Auto-generate messageContent if not set (based on messageBackground lightness)
    if (!result.messageContent) {
      result.messageContent = getContrastColor(result.messageBackground) as HexColor
    }

    return result
  }

  /**
   * Remove source by priority
   */
  private removeSource(priority: PropsPriority): void {
    this.sources = this.sources.filter((s) => s.priority !== priority)
  }

  /**
   * Invalidate computed cache
   */
  private invalidateCache(): void {
    this.computedProps = null
  }

  /**
   * Reset all sources
   */
  reset(): void {
    this.sources = []
    this.invalidateCache()
  }
}
