// Lit Imports
import { property, State, StateController, storage } from '@lit-app/state'
import { html, LitElement, unsafeCSS } from 'lit'
import { customElement, query, queryAll } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { keyed } from 'lit/directives/keyed.js'

// Libs
import { msg, str } from '@lit/localize'
import { setLocale } from '../../locales'
import autosize from 'autosize'
import {
  isSupported as isVirtualKeyboardSupported,
  subscribe as subscribeVirtualKeyboardVisibility,
} from 'on-screen-keyboard-detector'

// Colors
import { defaultColors } from '../../utils/defaults'

// Styles
import styles from './styles/tolki-chat.css'

// Tolki Services
import { UUID, validateUUID } from '../../utils/uuid'
import { Bot } from '../../services/bot'
import { Api } from '../../services/api'
import { ItemBuilder } from '../../services/item-builder'
import {
  ChatCommandService,
  createActionCommands,
} from '../../services/chat-commands'
import { ScrollStateManager } from '../../services/scroll-state-manager'
import { HistoryManager } from '../../services/history-manager'
import { Logger } from '../../services/logger'
import { MobileScrollLockService } from '../../services/mobile-scroll-lock'
import { eventBus } from '../../services/event-bus'
import { SettingsRepository } from '../../services/settings-repository'
import { PropsManager } from '../../services/props-manager'

// Tolki Types
import { Item, ItemType } from '../../types/item'
import { BotInitResult, BotStatus } from '../../types/bot'
import { ApiMessageResponseStatus } from '../../types/api'
import { TolkiChatProps, I18nString } from '../../types/props'

// Templates
import { headerTemplate } from './templates/header'
import { brandingTemplate } from './templates/branding'
import { textareaTemplate } from './templates/textarea'
import { toggleTemplate } from './templates/toggle'
import { chatItemTemplate } from './templates/item'
import { suggestionsTemplate } from './templates/suggestions'

// Utils
import { CartHelpers } from '../../utils/chat-helpers'
import {
  transformBotPropsToTolkiProps,
  isBotPro,
  splitPropsByPriority,
} from '../../utils/props-transformer'
import { generateHoverColor, getContrastColor } from '../../utils/color'

const TOLKI_CHAT: string = `tolki-chat`
const TOLKI_PREFIX: string = `tolki`

// Extend HTMLButtonElement to include custom properties
declare global {
  interface HTMLButtonElement {
    _tolkiClickHandler?: () => void
  }
}

class ChatState extends State {
  @storage({ key: 'settings', prefix: TOLKI_PREFIX })
  @property({ value: '{}' })
  settings: string

  @property({ value: '' })
  chat: string

  @property({ value: false })
  inline: boolean

  @property({ value: false })
  unclosable: boolean

  @property({ value: '' })
  open: string

  @property({ value: {} })
  styles: { [key: string]: string }

  @property({ value: null })
  bot: BotInitResult

  @property({ value: false })
  pending: boolean

  @property({ value: true })
  atBottom: boolean

  @property({ value: false })
  showScrollDown: boolean

  @property({ value: '' })
  virtualKeyboardVisibility: string

  @property({ value: [] })
  history: Item[]

  @property({ value: 0 })
  renderKey: number
}

const state = new ChatState()

// Global command registry will be initialized when the component is created
export let ActionCommands: ReturnType<typeof createActionCommands>

@customElement(TOLKI_CHAT)
export class TolkiChat extends LitElement {
  static styles = unsafeCSS(styles)

  // Constants
  private static readonly MOBILE_BREAKPOINT_PX = 480
  private static readonly SCROLL_SHOW_BUTTON_THRESHOLD_PX = 200
  private static readonly SCROLL_AT_BOTTOM_THRESHOLD_PX = 50
  private static readonly SCROLL_ANIMATION_SHORT_MS = 100
  private static readonly SCROLL_ANIMATION_MEDIUM_MS = 200
  private static readonly SCROLL_ANIMATION_LONG_MS = 500
  private static readonly FOCUS_DELAY_MS = 300
  private static readonly RESIZE_RETRY_DELAY_MS = 300
  private static readonly TEXTAREA_DEFAULT_HEIGHT_PX = 43
  private static readonly LOG_BOTTOM_OFFSET_PX = 80
  private static readonly MAX_RESIZE_RETRIES = 3

  stateController = new StateController(this, state)
  suggestionsListenersAdded = false
  requestedLang?: string

  // Services
  private commandService!: ChatCommandService
  private scrollStateManager!: ScrollStateManager
  private historyManager!: HistoryManager
  private scrollLock = new MobileScrollLockService()
  private settings = new SettingsRepository()
  private propsManager = new PropsManager()

  static get observedAttributes() {
    return [
      'bot',
      'position',
      'message-placeholder',
      'toggle-placeholder',
      'window-size',
      'toggle-size',
      'margin',
      'default-open',
      'expandable',
      'unclosable',
      'dark',
      'avatar',
      'blur',
      'backdrop',
      'toggle-background',
      'toggle-content',
      'message-background',
      'message-content',
      'unbranded',
      'welcome-message',
      'toasts',
      'lang',
      'suggestions',
      'locales',
      // Legacy - for backward compatibility
      'inline',
    ]
  }

  @query('.tk__close') close: HTMLButtonElement
  @query('.tk__reset') reset: HTMLButtonElement
  @query('.tk__log') log: HTMLDivElement
  @query('.tk__scroll-down') scrollDown: HTMLButtonElement
  @query('.tk__send') send: HTMLButtonElement
  @query('.tk__textarea') textarea: HTMLTextAreaElement
  @query('.tk__toggle') toggle: HTMLButtonElement
  @queryAll('.tk__suggestion') suggestions: HTMLButtonElement[]
  @query('.tk__suggestions') suggestionsContainer: HTMLElement
  @query('.tk__suggestions-scroll-left') scrollLeftBtn: HTMLButtonElement
  @query('.tk__suggestions-scroll-right') scrollRightBtn: HTMLButtonElement

  private resizeObserver?: ResizeObserver
  private boundToggleWindow?: () => void
  private boundResetChat?: () => void
  private unsubscribeTolkiUpdate?: () => void
  private unsubscribeCartLoaded?: () => void

  constructor() {
    super()

    // Bind event handlers
    this.boundToggleWindow = () => this.toggleWindow()
    this.boundResetChat = () => this.resetChat()

    // Initialize services
    this.initializeServices()

    // Check for the lang attribute immediately
    const langAttr = this.getAttribute('lang')
    if (langAttr) {
      this.requestedLang = langAttr
    }

    // Subscribe to events via EventBus
    this.unsubscribeTolkiUpdate = eventBus.on('tolki:update', () => {
      this.handleTolkiUpdate()
    })

    this.unsubscribeCartLoaded = eventBus.on('tolki:cart:loaded', () => {
      this.handleCartLoaded()
    })

    // Ensure Google Fonts load in Shadow DOM
    this.ensureFontLoading()
  }

  /**
   * Ensure Google Fonts load in Shadow DOM (Chrome mobile fix)
   */
  private ensureFontLoading(): void {
    const head = document.head

    // Check if font stylesheet already exists
    const existingFontLinks = Array.from(
      head.querySelectorAll('link[rel="stylesheet"]')
    )
    const hasFunnelSansLink = existingFontLinks.some((link) => {
      const href = link.getAttribute('href') || ''
      return (
        href.includes('fonts.googleapis.com') && href.includes('Funnel+Sans')
      )
    })

    // Add font stylesheet to document head (required for Shadow DOM compatibility)
    if (!hasFunnelSansLink) {
      const fontLink = document.createElement('link')
      fontLink.rel = 'stylesheet'
      fontLink.href =
        'https://fonts.googleapis.com/css2?family=Funnel+Sans:ital,wght@0,300..800;1,300..800&display=swap'
      head.appendChild(fontLink)
    }
  }

  /**
   * Initialize all services used by the component
   */
  private initializeServices(): void {
    // Initialize history manager
    this.historyManager = new HistoryManager(
      () => state.history,
      (history) => {
        state.history = history
      },
      (history) => this.saveSetting('history', history)
    )

    // Initialize scroll state manager with thresholds
    this.scrollStateManager = new ScrollStateManager({
      showButtonThreshold: TolkiChat.SCROLL_SHOW_BUTTON_THRESHOLD_PX,
      atBottomThreshold: TolkiChat.SCROLL_AT_BOTTOM_THRESHOLD_PX,
    })

    // Subscribe to scroll state changes
    this.scrollStateManager.onStateChange((scrollState) => {
      state.showScrollDown = scrollState.showScrollDown
      state.atBottom = scrollState.atBottom
    })

    // Initialize command service with the new interface
    this.commandService = new ChatCommandService(
      {
        addHeadingMessages: () => this.addHeadingMessages(),
        saveSetting: (key, value) => this.saveSetting(key, value),
        scrollToLastMessage: (timeout) => this.scrollToLastMessage(timeout),
        updateComplete: this.updateComplete,
        setChatId: (chatId) => {
          state.chat = chatId
        },
      },
      this.historyManager
    )

    // Create and expose global ActionCommands
    ActionCommands = createActionCommands(this.commandService)
    window.ActionCommands = ActionCommands
  }

  get botUUID() {
    return state.bot?.uuid
  }

  /**
   * Handle tolki update event - re-render and manage scroll for dynamic content
   */
  private handleTolkiUpdate(): void {
    const wasAtBottom = state.atBottom
    const scrollHeight = this.log?.scrollHeight || 0

    this.requestUpdate()

    // After update, check if we need to maintain scroll position
    this.updateComplete.then(() => {
      const newScrollHeight = this.log?.scrollHeight || 0

      // If content height changed and user was at bottom, scroll to new bottom
      if (wasAtBottom && newScrollHeight !== scrollHeight) {
        this.scrollToLastMessage(TolkiChat.SCROLL_ANIMATION_SHORT_MS) // Animated scroll for better UX
      }
      // If content height changed significantly, update scroll state
      else if (Math.abs(newScrollHeight - scrollHeight) > 50) {
        // Check if we should show scroll down button
        this.logScroll()
      }
    })
  }

  /**
   * Handle cart loaded event - update cart notification regardless of chat state
   */
  private handleCartLoaded(): void {
    // First, remove any existing cart notifications from history
    const initialHistoryLength = state.history.length
    state.history = state.history.filter(
      (item) => item.type !== ItemType.cartNotification
    )
    const removedNotifications = initialHistoryLength !== state.history.length

    // Check if the last message is a cart - if so, don't add cart notification
    const lastMessage = state.history[state.history.length - 1]
    const isLastMessageCart = lastMessage && lastMessage.type === ItemType.cart

    // Create a new cart notification (will be null if the cart is empty or error)
    const cartNotification = CartHelpers.createCartNotification()

    // Only add cart notification if it actually has content to show
    if (cartNotification && !isLastMessageCart && CartHelpers.hasCartItems()) {
      // Add cart notification to history only if last message is not a cart
      state.history.push(cartNotification)
      this.saveHistory()
      this.updateComplete.then(() => {
        this.scrollToLastMessage(TolkiChat.SCROLL_ANIMATION_SHORT_MS)
      })
    } else {
      // Just save history if we removed notifications but don't add new one
      if (removedNotifications) {
        this.saveHistory()
      }
    }

    // Force update to reflect any cart data changes
    this.handleTolkiUpdate()
  }

  getSetting<T = unknown>(key: string): T | undefined {
    if (!this.botUUID) return undefined
    const settings = JSON.parse(state.settings)
    if (!settings[this.botUUID]) return undefined
    return settings[this.botUUID][key] as T
  }

  saveSetting<T = unknown>(key: string, value: T): void {
    if (!this.botUUID) return
    const settings = JSON.parse(state.settings)
    if (!settings[this.botUUID]) settings[this.botUUID] = {}
    settings[this.botUUID][key] = value
    state.settings = JSON.stringify(settings)
  }

  attributeChangedCallback(
    name: string,
    oldValue?: unknown,
    newValue?: unknown
  ) {
    // Handle bot attribute separately (triggers initialization)
    if (name === 'bot' && newValue) {
      this.init().then()
      return
    }

    // Handle lang attribute separately (sets locale)
    if (name === 'lang' && newValue) {
      this.requestedLang = newValue as string
    }

    // Convert legacy 'inline' attribute to 'position'
    if (name === 'inline') {
      // Legacy support: inline attribute means position="inline"
      state.inline = true
      this.updatePropsFromAttributes({ position: 'inline' })
      return
    }

    // Update props manager with all current attributes
    this.updatePropsFromAttributes()
  }

  /**
   * Update props manager with current HTML attributes
   */
  private updatePropsFromAttributes(override?: {
    [key: string]: string | boolean | null
  }): void {
    const attributes: { [key: string]: string | boolean | null } = {}

    // Collect all observed attributes
    const observedAttrs = (this.constructor as typeof TolkiChat)
      .observedAttributes
    observedAttrs.forEach((attr) => {
      if (attr === 'bot' || attr === 'inline') return // Skip these

      const value = this.getAttribute(attr)
      if (value !== null) {
        attributes[attr] = value
      }
    })

    // Apply overrides if any
    if (override) {
      Object.assign(attributes, override)
    }

    // Update props manager
    this.propsManager.setUserAttributes(attributes)

    // Update legacy state properties for backward compatibility
    const props = this.propsManager.getProps()
    state.inline = props.position === 'inline'
    state.unclosable = props.unclosable

    // Force complete re-render by updating renderKey (reactive state property)
    state.renderKey = Date.now()

    // Also request update
    this.requestUpdate()
  }

  static async setLanguage(locale: string) {
    try {
      await setLocale(locale)
    } catch (error) {
      Logger.warn('Failed to set locale:', locale, error)
      // Fallback to English if locale loading fails
      await setLocale('en')
    }
  }

  public async addHeadingMessages() {
    const items: Item[] = []

    // Add privacy message
    const privacyMessage = ItemBuilder.info(
      'By using this chat, you agree to our <a target="_blank" href="https://tolki.ai/privacy">privacy policy</a>.'
    )
    if (privacyMessage) {
      privacyMessage.templateKey = 'privacy_policy'
      items.push(privacyMessage)
    }

    // Add welcome message
    if (state.bot?.props?.welcomeMessage) {
      items.push(ItemBuilder.assistant(state.bot.props.welcomeMessage))
    }

    // Add cart notification using helper
    const cartNotification = CartHelpers.createCartNotification()
    if (cartNotification) {
      items.push(cartNotification)
    }

    // Replace entire history using history manager
    this.historyManager.replaceHistory(items)

    await this.processHistoryLocales()
  }

  public async init() {
    const botUUID: string = this.getAttribute('bot')
    if (!botUUID) return

    // Set locale based on lang attribute or browser language
    const initialLang = this.requestedLang || navigator.language.split('-')[0] // Use lang attribute or browser language
    await TolkiChat.setLanguage(initialLang)

    Bot.init(botUUID)
      .then(async (bot) => {
        if (isVirtualKeyboardSupported()) {
          subscribeVirtualKeyboardVisibility((visibility) => {
            state.virtualKeyboardVisibility = visibility
          })
        }

        state.bot = bot

        // Transform backend props and pass to props manager
        if (bot.props) {
          const isPro = isBotPro(bot.props)
          const transformedProps = transformBotPropsToTolkiProps(
            bot.props,
            isPro
          )

          // Split props into PRO-only and standard
          // PRO-only: unbranded, icon (as URL)
          // Standard: everything else (including colors!)
          const { proProps, standardProps } =
            splitPropsByPriority(transformedProps)

          // Always set standard props (colors, avatar, etc.)
          if (Object.keys(standardProps).length > 0) {
            this.propsManager.setStandardBackendProps(standardProps)
          }

          // Only set PRO props if bot is on PRO plan
          if (isPro && Object.keys(proProps).length > 0) {
            this.propsManager.setProBackendProps(proProps)
          }
        }

        const chatUUID = this.getSetting<string>('chat')
        if (!validateUUID(chatUUID)) {
          state.chat = UUID()
        } else {
          state.chat = chatUUID
        }

        const history = this.getSetting<Item[]>('history')

        if (history) {
          state.history = history
          // Process setLocale items from history
          await this.processHistoryLocales()
        } else {
          state.history = []
        }
        if (!state.history?.length) {
          await this.addHeadingMessages()
        }

        const savedOpen = this.getSetting<string>('open')
        const isMobile = window.innerWidth <= TolkiChat.MOBILE_BREAKPOINT_PX

        if (savedOpen === 'false') {
          state.open = ''
        } else if (savedOpen === 'true') {
          state.open = 'true'
        } else if (state.bot.props.defaultOpen === true && !isMobile) {
          state.open = 'true'
        } else {
          state.open = ''
        }

        // Handle initial body scroll lock if opening on mobile
        if (state.open === 'true') {
          this.scrollLock.lock()
        }

        setTimeout(() => {
          const top =
            this.log.scrollHeight -
            (this.log.clientHeight - TolkiChat.LOG_BOTTOM_OFFSET_PX)
          this.log.scrollTo({
            top,
            behavior: 'auto',
          })
        }, 0)
      })
      .catch((bot) => {
        state.bot = bot
        Logger.error('Bot not initialized:', bot)
      })
  }

  public resetChat() {
    const resetAction = ItemBuilder.action(
      'Do you want to start a new chat? You will lose the current messages.',
      [
        {
          label: 'Reset',
          primary: true,
          command: 'resetChat',
          templateKey: 'reset',
        },
        {
          label: 'Cancel',
          command: 'cancelAction',
          templateKey: 'cancel',
        },
      ]
    )

    // Add template data
    resetAction.templateKey = 'reset_confirmation'

    state.history = [...state.history, resetAction]
    this.scrollToBottom(TolkiChat.SCROLL_ANIMATION_SHORT_MS)
  }

  get colorVariables() {
    // Get final computed props from props manager
    const props = this.propsManager.getProps()
    const map: { [key: string]: string } = {}

    // Toggle button colors
    map['toggle-background'] =
      props.toggleBackground || defaultColors['toggle-background']
    map['toggle-hover'] = generateHoverColor(map['toggle-background'])
    // toggleContent: if null, calculate contrast based on FINAL toggleBackground
    map['toggle-content'] =
      props.toggleContent || getContrastColor(map['toggle-background'])

    // Message bubble colors (user messages)
    map['message-background'] =
      props.messageBackground || defaultColors['message-background']
    // messageContent: if null, calculate contrast based on FINAL messageBackground
    map['message-content'] =
      props.messageContent || getContrastColor(map['message-background'])

    const cssVars =
      Object.keys(map)
        .map((key: string) => {
          return '--' + key + ':' + map[key]
        })
        .join(';') + ';'

    return cssVars
  }

  /**
   * Resolve an I18nString to a plain string based on current language
   */
  private resolveI18nString(value: I18nString | string): string {
    if (typeof value === 'string') {
      return value
    }

    const props = this.propsManager.getProps()
    const lang = props.lang || 'en'

    // Try to get the value for the current language
    if (value[lang]) {
      return value[lang]
    }

    // Fallback to 'en'
    if (value['en']) {
      return value['en']
    }

    // Fallback to first available language
    const keys = Object.keys(value)
    if (keys.length > 0) {
      return value[keys[0]]
    }

    return ''
  }

  /**
   * Resolve an I18nArray to a plain string array based on current language
   */
  private resolveI18nArray(value: string[] | { [lang: string]: string }[]): string[] {
    if (!value) return []

    // If it's already a plain string array, return it
    if (value.length === 0 || typeof value[0] === 'string') {
      return value as string[]
    }

    const props = this.propsManager.getProps()
    const lang = props.lang || 'en'

    // It's an array of objects with language keys
    const objectArray = value as { [lang: string]: string }[]
    return objectArray.map((item) => {
      // Try current language
      if (item[lang]) {
        return item[lang]
      }
      // Fallback to 'en'
      if (item['en']) {
        return item['en']
      }
      // Fallback to first available language
      const keys = Object.keys(item)
      if (keys.length > 0) {
        return item[keys[0]]
      }
      return ''
    })
  }

  get windowSizeVariables() {
    const props = this.propsManager.getProps()
    const size = props.windowSize || 'sm'

    const sizeMap: { [key: string]: string } = {
      sm: '400px',
      md: '540px',
      lg: '768px',
      xl: '860px',
    }

    return `--chat-width: ${sizeMap[size]};`
  }

  get toggleSizeVariables() {
    const props = this.propsManager.getProps()
    const size = props.toggleSize || 'md'

    const sizeMap: { [key: string]: string } = {
      sm: '48px', // Small
      md: '60px', // Medium (default - current size)
      lg: '72px', // Large
    }

    const textSizeMap: { [key: string]: string } = {
      sm: '15px',
      md: '16px',
      lg: '18px',
    }

    return `--toggle-btn-size: ${sizeMap[size]}; --toggle-text-size: ${textSizeMap[size]};`
  }

  get marginVariables() {
    const props = this.propsManager.getProps()
    const margin = props.margin || 20

    let marginX: number
    let marginY: number

    if (Array.isArray(margin)) {
      // [x, y] format
      marginX = margin[0]
      marginY = margin[1]
    } else {
      // Single number - use for both axes
      marginX = margin
      marginY = margin
    }

    return `--margin-x: ${marginX}px; --margin-y: ${marginY}px;`
  }

  get hostPositionStyles() {
    const props = this.propsManager.getProps()
    const position = props.position

    if (position === 'inline') return ''

    // Calculate actual margin values
    const margin = props.margin || 20
    let marginX: number
    let marginY: number

    if (Array.isArray(margin)) {
      marginX = margin[0]
      marginY = margin[1]
    } else {
      marginX = margin
      marginY = margin
    }

    // Base styles for floating mode
    let styles = `position:fixed;z-index:9999999;bottom:${marginY}px;`

    // Add horizontal positioning based on position prop
    switch (position) {
      case 'left':
        styles += `left:${marginX}px;`
        break
      case 'center':
        styles += 'left:50%;transform:translateX(-50%);'
        break
      case 'right':
        styles += `right:${marginX}px;`
        break
    }

    return styles
  }

  toggleWindow() {
    const wasOpen = state.open === 'true'
    state.open = state.open === 'true' ? '' : 'true'
    this.saveSetting('open', state.open === 'true' ? 'true' : 'false')

    // Handle body scroll lock on mobile
    if (state.open === 'true') {
      this.scrollLock.lock()
    } else {
      this.scrollLock.unlock()
    }

    // Debug: log dimensions and position when opening
    if (!wasOpen && state.open === 'true') {
      this.updateComplete.then(() => {
        const props = this.propsManager.getProps()
        const windowEl = this.shadowRoot?.querySelector('.tk__window')
        const toggleEl = this.shadowRoot?.querySelector('.tk__toggle')

        console.group('🔍 Toggle Window Debug')
        console.log('Position prop:', props.position)
        console.log('Margin prop:', props.margin)
        console.log('Window size prop:', props.windowSize)
        console.log('Toggle size prop:', props.toggleSize)

        if (windowEl) {
          const windowRect = windowEl.getBoundingClientRect()
          console.log('Window dimensions:', {
            width: windowRect.width,
            height: windowRect.height,
            left: windowRect.left,
            top: windowRect.top,
          })
          console.log('Window classes:', windowEl.className)
          const computedStyle = getComputedStyle(windowEl)
          console.log('Window computed CSS:', {
            width: computedStyle.width,
            maxWidth: computedStyle.maxWidth,
            marginLeft: computedStyle.marginLeft,
            marginRight: computedStyle.marginRight,
            display: computedStyle.display,
          })
        }

        if (toggleEl) {
          const toggleRect = toggleEl.getBoundingClientRect()
          console.log('Toggle position:', {
            left: toggleRect.left,
            right: window.innerWidth - toggleRect.right,
            bottom: window.innerHeight - toggleRect.bottom,
          })
          console.log('Toggle classes:', toggleEl.className)
          const computedStyle = getComputedStyle(toggleEl)
          console.log('Toggle computed CSS:', {
            left: computedStyle.left,
            right: computedStyle.right,
            bottom: computedStyle.bottom,
            transform: computedStyle.transform,
            position: computedStyle.position,
          })
        }

        console.log('Viewport:', {
          width: window.innerWidth,
          height: window.innerHeight,
        })
        console.groupEnd()

        setTimeout(() => {
          if (this.textarea) {
            this.textarea.focus()
          }
        }, TolkiChat.FOCUS_DELAY_MS)
      })
    }
  }

  resetMessage() {
    this.textarea.value = ''
    this.textarea.style.height = `${TolkiChat.TEXTAREA_DEFAULT_HEIGHT_PX}px`
    this.textarea.focus()
  }

  scrollToBottom(timeout: number = TolkiChat.SCROLL_ANIMATION_LONG_MS) {
    setTimeout(() => {
      const top =
        this.log.scrollHeight -
        (this.log.clientHeight - TolkiChat.LOG_BOTTOM_OFFSET_PX)
      this.log.scrollTo({
        top,
        behavior: 'smooth',
      })
    }, timeout)
  }

  scrollToLastMessage(
    timeout: number = TolkiChat.SCROLL_ANIMATION_LONG_MS,
    animated: boolean = true,
    retryCount: number = 0,
    targetMessageIndex?: number
  ) {
    setTimeout(() => {
      if (!this.log) return

      const chatItems = this.log.querySelectorAll('.tk__chat-item')
      if (chatItems.length > 0) {
        // Use target index if provided, otherwise scroll to last message
        const targetIndex =
          targetMessageIndex !== undefined
            ? targetMessageIndex
            : chatItems.length - 1
        const targetMessage = chatItems[
          Math.min(targetIndex, chatItems.length - 1)
        ] as HTMLElement

        if (!targetMessage) return

        const initialHeight = this.log.scrollHeight
        // Get the actual position of the target message relative to the log container
        const messageTop = targetMessage.offsetTop

        // Scroll to position the message at the top of the visible area
        // The log has padding-top: 20px, minus 10px to show the message slightly lower
        const scrollPosition = messageTop - 20 + 10

        this.log.scrollTo({
          top: Math.max(0, scrollPosition),
          behavior: animated ? 'smooth' : 'auto',
        })

        // For dynamic content (cart/orders), check if height changed after scroll
        // and retry if needed
        if (retryCount < TolkiChat.MAX_RESIZE_RETRIES) {
          setTimeout(() => {
            const newHeight = this.log.scrollHeight
            const hasCartOrOrders = this.log.querySelector(
              '.tk__message--show_cart, .tk__message--show_orders'
            )

            // If height changed significantly and we have dynamic content, retry
            if (hasCartOrOrders && Math.abs(newHeight - initialHeight) > 20) {
              this.scrollToLastMessage(
                TolkiChat.SCROLL_ANIMATION_MEDIUM_MS,
                animated,
                retryCount + 1,
                targetMessageIndex
              )
            }
          }, TolkiChat.RESIZE_RETRY_DELAY_MS)
        }
      }
    }, timeout)
  }

  autoScrollToBottom() {
    if (state.atBottom) {
      this.updateComplete.then(() => {
        this.scrollToLastMessage()
      })
    }
  }

  afterReceive() {
    state.pending = false
    this.updateComplete.then(() => {
      this.scrollToLastMessage(TolkiChat.SCROLL_ANIMATION_SHORT_MS)
    })
  }

  afterReceiveWithTarget(targetMessageIndex: number) {
    state.pending = false
    this.updateComplete.then(() => {
      this.scrollToLastMessage(
        TolkiChat.SCROLL_ANIMATION_SHORT_MS,
        true,
        0,
        targetMessageIndex
      )
    })
  }

  afterSend() {
    state.pending = true
    this.resetMessage()
    this.updateComplete.then(() => {
      this.scrollToLastMessage(TolkiChat.SCROLL_ANIMATION_SHORT_MS)
    })
  }

  logScroll = () => {
    if (!this.log) return

    this.scrollStateManager.updateState(
      this.log.scrollTop,
      this.log.scrollHeight,
      this.log.clientHeight
    )
  }

  clearHistory(): Item[] {
    const filteredHistory: Item[] = state.history.filter(
      (item) =>
        item.type !== ItemType.thinking &&
        item.type !== ItemType.cartNotification
    )
    state.history = filteredHistory
    return filteredHistory
  }

  saveHistory() {
    const serializedMessages = state.history.filter((item: Item) => {
      return (
        item.type === ItemType.action ||
        item.type === ItemType.card ||
        item.type === ItemType.markdown ||
        item.type === ItemType.product ||
        item.type === ItemType.cart ||
        item.type === ItemType.orders ||
        item.type === ItemType.userInput
      )
    })
    this.saveSetting('history', serializedMessages)
  }

  /**
   * Centralized error logging using Logger service
   */
  private logError(message: string, error: unknown): void {
    Logger.error(message, error)
  }

  async processHistoryLocales() {
    // Find the last setLocale message in history
    let lastLocale: string | null = null

    for (let i = state.history.length - 1; i >= 0; i--) {
      const item: Item = state.history[i]
      if (item.type === ItemType.markdown && item.locale) {
        lastLocale = item.locale!
        break
      }
    }

    // If we found a locale, change language and re-render
    if (lastLocale) {
      const { getLocale } = await import('../../locales')
      const previousLocale = getLocale()

      if (lastLocale !== previousLocale) {
        await TolkiChat.setLanguage(lastLocale)
        this.saveHistory()
      }
    }
  }

  async sendMessage() {
    const message: string = this.textarea?.value?.trim()

    if (!message || message === '' || state.bot?.status !== BotStatus.ok) {
      this.resetMessage()
      this.scrollToBottom(TolkiChat.SCROLL_ANIMATION_SHORT_MS)
      return
    }

    if (state.virtualKeyboardVisibility === 'visible') {
      setTimeout(() => {
        this.textarea.blur()
      }, TolkiChat.SCROLL_ANIMATION_SHORT_MS)
    }

    const userInputItem = ItemBuilder.userInput(message)
    state.history.push(userInputItem)
    this.clearHistory()
    this.saveHistory()
    state.history.push(ItemBuilder.thinking())
    this.afterSend()

    try {
      const response = await Api.message(
        state.chat,
        state.bot.uuid,
        message,
        state.bot.props.isAdk
      )

      if (
        response.status === ApiMessageResponseStatus.error ||
        response.status === ApiMessageResponseStatus.notOk
      ) {
        throw new Error(`API Error: ${response.status}`)
      }

      const { data } = response

      if (Array.isArray(data)) {
        const items: Item[] = data

        // First remove thinking indicator
        this.clearHistory()

        // Now track the index of the first new message for scrolling
        // This will be the correct index after thinking is removed
        const firstNewMessageIndex = state.history.length

        for (const item of items) {
          state.history.push(item)
        }

        // Process any setLocale messages that were added
        await this.processHistoryLocales()

        this.saveHistory()
        this.afterReceiveWithTarget(firstNewMessageIndex)
      }
    } catch (error) {
      // Remove thinking indicator and add error message
      this.clearHistory()
      state.history.push(ItemBuilder.error())
      this.saveHistory()

      // Log error for debugging/tracking
      this.logError('Failed to send message', error)

      this.afterReceive()
    }
  }

  // Helper: Extract command from suggestion text
  extractCommand(suggestionText: string): {
    command: string | null
    displayText: string
  } {
    const commandMatch = suggestionText.match(/\[([^\]]+)]/)

    if (!commandMatch) {
      return { command: null, displayText: suggestionText }
    }

    const command = commandMatch[1]
    const textBeforeCommand = suggestionText
      .substring(0, commandMatch.index)
      .trim()

    // If there's text before the command, use that as display text
    if (textBeforeCommand) {
      return { command, displayText: textBeforeCommand }
    }

    // If only command, return translated command name
    return { command, displayText: this.getCommandDisplayName(command) }
  }

  // Helper: Get localized display name for command
  getCommandDisplayName(command: string): string {
    // Handle commands with parameters
    const commandParts = command.split(' ')
    const commandName = commandParts[0]
    const commandParam = commandParts[1]

    switch (commandName) {
      case 'show_cart': {
        const cartData = window.tolki?.cart
        const itemCount = cartData?.items?.length || 0
        return msg(str`Cart (${itemCount})`)
      }
      case 'show_orders': {
        const ordersData = window.tolki?.orders
        const orderCount = ordersData
          ? Object.values(ordersData).flat().length
          : 0
        return msg(str`My Orders (${orderCount})`)
      }
      case 'set_locale': {
        if (commandParam) {
          const languageName = ItemBuilder.getLanguageName(commandParam)
          return `Set language to ${languageName}`
        }
        return 'Set language'
      }
      default:
        return command
    }
  }

  // Helper: Execute command from suggestion
  executeCommand(command: string): void {
    // Handle commands with parameters
    const commandParts = command.split(' ')
    const commandName = commandParts[0]
    const commandParam = commandParts[1]

    switch (commandName) {
      case 'show_cart':
        // Remove any existing cart messages (singleton behavior)
        state.history = state.history.filter(
          (item) => item.type !== ItemType.cart
        )
        state.history.push(ItemBuilder.cart())
        break
      case 'show_orders':
        // Remove any existing orders messages (singleton behavior)
        state.history = state.history.filter(
          (item) => item.type !== ItemType.orders
        )
        state.history.push(ItemBuilder.orders())
        break
      case 'set_locale':
        if (commandParam) {
          this.changeLanguage(commandParam).catch((error) =>
            this.logError('Failed to change language', error)
          )
          return // Don't update history for language changes
        } else {
          Logger.warn('set_locale command requires a locale parameter')
          return
        }
      default:
        Logger.warn('Unknown command:', command)
        return
    }

    this.clearHistory()
    this.saveHistory()
    this.updateComplete.then(() => {
      this.scrollToLastMessage(TolkiChat.SCROLL_ANIMATION_SHORT_MS)
    })
  }

  async changeLanguage(locale: string): Promise<void> {
    // Set the new language first
    await TolkiChat.setLanguage(locale)

    // Create language change message using template system
    const changeMessage = ItemBuilder.info('Language changed.')
    if (changeMessage) {
      changeMessage.templateKey = 'language_changed'
    }

    // Add locale property to track language changes
    if (changeMessage) {
      changeMessage.locale = locale
      // Remove any existing language changed messages (singleton behavior)
      state.history = state.history.filter(
        (item) =>
          !(
            item.type === ItemType.markdown &&
            item.templateKey === 'language_changed'
          )
      )
      state.history.push(changeMessage)
    }

    // Save the updated history
    this.clearHistory()
    this.saveHistory()

    // Remove existing suggestion listeners before re-translation
    if (this.suggestions?.length) {
      this.suggestions.forEach((suggestion) => {
        const existingHandler = suggestion._tolkiClickHandler
        if (existingHandler) {
          suggestion.removeEventListener('click', existingHandler)
          delete suggestion._tolkiClickHandler
        }
      })
    }
    this.suggestionsListenersAdded = false

    // Update the lang attribute to ensure propsManager has the new language
    // This is critical for resolving i18n strings/arrays with the correct language
    // Use updatePropsFromAttributes to preserve all other user attributes
    // This will also trigger re-render with renderKey update
    this.updatePropsFromAttributes({ lang: locale })

    // Scroll to the new message
    this.updateComplete.then(() => {
      this.scrollToLastMessage(TolkiChat.SCROLL_ANIMATION_SHORT_MS)
    })
  }

  updated(changedProperties: Map<string | number | symbol, unknown>) {
    super.updated(changedProperties)
    const sendMessage = () => {
      this.sendMessage().then()
    }
    const enterSendMessage = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        this.sendMessage().then()
      }
    }
    const scrollToBottom = () => {
      this.log.removeEventListener('scroll', logScroll)
      this.autoScrollToBottom()
      setTimeout(() => {
        this.log.addEventListener('scroll', logScroll)
      }, TolkiChat.SCROLL_ANIMATION_LONG_MS)
    }
    const scrollDown = () => {
      this.scrollToBottom(TolkiChat.SCROLL_ANIMATION_SHORT_MS)
    }
    const logScroll = () => {
      this.logScroll()
    }
    if (this.textarea) {
      autosize(this.textarea)
      this.textarea.removeEventListener('autosize:resized', scrollToBottom)
      this.textarea.addEventListener('autosize:resized', scrollToBottom)
      this.textarea.addEventListener('keydown', enterSendMessage)
    }
    if (this.toggle && this.boundToggleWindow) {
      this.toggle.removeEventListener('click', this.boundToggleWindow)
      this.toggle.addEventListener('click', this.boundToggleWindow)
    }
    if (this.close && this.boundToggleWindow) {
      this.close.removeEventListener('click', this.boundToggleWindow)
      this.close.addEventListener('click', this.boundToggleWindow)
    }
    if (this.reset && this.boundResetChat) {
      this.reset.removeEventListener('click', this.boundResetChat)
      this.reset.addEventListener('click', this.boundResetChat)
    }
    if (this.send) {
      this.send.removeEventListener('click', sendMessage)
      this.send.addEventListener('click', sendMessage)
    }
    if (this.log) {
      this.log.removeEventListener('scroll', logScroll)
      this.log.addEventListener('scroll', logScroll)
    }
    if (this.scrollDown) {
      this.scrollDown.removeEventListener('click', scrollDown)
      this.scrollDown.addEventListener('click', scrollDown)
    }
    if (this.suggestions?.length) {
      // Always reset and re-add listeners when suggestions are present
      // This handles cases where suggestions change dynamically
      this.suggestions.forEach((suggestion) => {
        // Remove any existing listeners first
        const existingHandler = suggestion._tolkiClickHandler
        if (existingHandler) {
          suggestion.removeEventListener('click', existingHandler)
        }

        // Create new handler
        const clickHandler = () => {
          const originalText =
            suggestion.getAttribute('data-original') || suggestion.textContent
          const { command } = this.extractCommand(originalText)

          console.log('🔍 Suggestion clicked:', {
            originalText,
            command,
            displayText: suggestion.textContent
          })

          if (command) {
            // Execute command directly
            this.executeCommand(command)
          } else {
            // Normal suggestion behavior: set text and send
            this.textarea.value = suggestion.textContent
            this.sendMessage().then()
          }
        }

        // Store handler reference and add listener
        suggestion._tolkiClickHandler = clickHandler
        suggestion.addEventListener('click', clickHandler)
      })

      // Setup scroll button visibility logic (only once)
      if (!this.suggestionsListenersAdded) {
        this.setupSuggestionsScrollButtons()
        this.suggestionsListenersAdded = true
      }
    }

    // Setup ResizeObserver for dynamic content (cart/orders)
    this.setupDynamicContentObserver()
  }

  private setupSuggestionsScrollButtons() {
    if (
      !this.suggestionsContainer ||
      !this.scrollLeftBtn ||
      !this.scrollRightBtn
    ) {
      return
    }

    const updateScrollButtons = () => {
      const container = this.suggestionsContainer
      const scrollLeft = container.scrollLeft
      const scrollWidth = container.scrollWidth
      const clientWidth = container.clientWidth
      const maxScroll = scrollWidth - clientWidth

      // Show/hide left button
      if (scrollLeft > 0) {
        this.scrollLeftBtn.classList.add('visible')
      } else {
        this.scrollLeftBtn.classList.remove('visible')
      }

      // Show/hide right button
      if (scrollLeft < maxScroll - 1) {
        // -1 for rounding issues
        this.scrollRightBtn.classList.add('visible')
      } else {
        this.scrollRightBtn.classList.remove('visible')
      }
    }

    // Initial check
    updateScrollButtons()

    // Add scroll listener
    this.suggestionsContainer.addEventListener('scroll', updateScrollButtons)

    // Check again after a small delay to ensure DOM is fully rendered
    setTimeout(updateScrollButtons, TolkiChat.SCROLL_ANIMATION_SHORT_MS)
  }

  private setupDynamicContentObserver() {
    // Clean up existing observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
    }

    // Create new ResizeObserver for cart and orders content
    this.resizeObserver = new ResizeObserver((entries) => {
      let shouldUpdateScroll = false

      for (const entry of entries) {
        const target = entry.target as HTMLElement

        // Check if this is a cart or orders element that changed size
        if (
          target.closest('.tk__message--show_cart, .tk__message--show_orders')
        ) {
          shouldUpdateScroll = true
          break
        }
      }

      // If dynamic content changed size and user was at bottom, maintain scroll
      if (shouldUpdateScroll && state.atBottom) {
        this.scrollToLastMessage(TolkiChat.SCROLL_ANIMATION_SHORT_MS, false) // No animation for resize updates
      }
    })

    // Observe all cart and orders elements
    const dynamicElements = this.log?.querySelectorAll(
      '.tk__message--show_cart, .tk__message--show_orders'
    )
    dynamicElements?.forEach((element) => {
      this.resizeObserver?.observe(element)
    })
  }

  disconnectedCallback() {
    super.disconnectedCallback()

    // Clean up event bus subscriptions
    if (this.unsubscribeTolkiUpdate) this.unsubscribeTolkiUpdate()
    if (this.unsubscribeCartLoaded) this.unsubscribeCartLoaded()

    // Clean up ResizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = undefined
    }

    // Clean up body scroll lock if component is removed while open
    this.scrollLock.unlock()
  }

  override render() {
    const hostStyles = !state.inline
      ? `${this.colorVariables} ${this.windowSizeVariables} ${this.toggleSizeVariables} ${this.marginVariables} ${this.hostPositionStyles}`
      : `${this.colorVariables} ${this.windowSizeVariables} ${this.toggleSizeVariables} ${this.marginVariables}`

    return state.bot?.status === BotStatus.ok
      ? html`
          <style>
            ${styles}
            :host { ${hostStyles} }
          </style>
          <div
            class=${classMap({
              tk__window: true,
              'tk__window--open':
                (state.open === 'true' || state.unclosable) && !state.inline,
              'tk__window--inline': state.inline,
              'tk__window--floating': !state.inline,
              'tk__window--unclosable': state.unclosable,
              'tk__window--left':
                this.propsManager.getProps().position === 'left',
              'tk__window--center':
                this.propsManager.getProps().position === 'center',
              'tk__window--right':
                this.propsManager.getProps().position === 'right',
            })}
            role="region"
            aria-label=${state.bot?.props?.name || 'Chat'}
          >
            ${headerTemplate(state.bot.props.name, state.bot.props.avatar)}
            <div
              class=${classMap({
                tk__log: true,
              })}
              role="log"
              aria-live="polite"
              aria-atomic="false"
              aria-label="Chat messages"
            >
              ${state.history
                .filter((item) => item && item.type)
                .map((item, index) =>
                  keyed(`${state.renderKey}-${index}`, chatItemTemplate(item))
                )}
            </div>
            ${(() => {
              const suggestions = this.resolveI18nArray(this.propsManager.getProps().suggestions)
              console.log('🔍 Suggestions debug:', {
                raw: this.propsManager.getProps().suggestions,
                resolved: suggestions,
                length: suggestions?.length
              })
              return suggestionsTemplate(suggestions, this.extractCommand.bind(this))
            })()}
            ${textareaTemplate(
              state.pending,
              state.showScrollDown,
              !!this.propsManager.getProps().suggestions?.length,
              this.resolveI18nString(this.propsManager.getProps().messagePlaceholder)
            )}
            ${state.bot?.props?.unbranded ? '' : brandingTemplate}
          </div>
          ${state.inline
            ? ''
            : toggleTemplate(
                state.open === 'true',
                state.unclosable,
                this.resolveI18nString(this.propsManager.getProps().togglePlaceholder) || 'Chat',
                (this.propsManager.getProps().position === 'inline'
                  ? 'right'
                  : this.propsManager.getProps().position) as
                  | 'left'
                  | 'center'
                  | 'right',
                this.resolveI18nString(this.propsManager.getProps().togglePlaceholder)
              )}
        `
      : html``
  }
}
