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
// Lightweight virtual keyboard detection via visualViewport API
function subscribeVirtualKeyboard(callback: (visibility: 'visible' | 'hidden') => void): void {
  if (!window.visualViewport) return
  let lastHeight = window.visualViewport.height
  window.visualViewport.addEventListener('resize', () => {
    const currentHeight = window.visualViewport!.height
    const threshold = lastHeight * 0.75
    callback(currentHeight < threshold ? 'visible' : 'hidden')
    lastHeight = window.innerHeight // Reset to full height for next comparison
  })
}

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
import {
  Item,
  ItemType,
  MarkdownResponse,
  DocumentSearchQueryResponse,
  DocumentSearchResultsResponse,
} from '../../types/item'
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
import { openSourcesOverlay, closeSourcesOverlayImmediate } from './templates/sources-overlay'
import { ratingTemplate } from './templates/rating'

// Utils
import { CartHelpers } from '../../utils/chat-helpers'
import { transformBotPropsToTolkiProps } from '../../utils/props-transformer'
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

  @property({ value: false })
  ratingVisible: boolean

  @property({ value: false })
  ratingSubmitted: boolean
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
  private _settingLangProgrammatically = false

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
      'name',
      'message-placeholder',
      'toggle-placeholder',
      'window-size',
      'toggle-size',
      'margin',
      'window-max-height',
      'default-open',
      'expandable',
      'unclosable',
      'theme',
      'rounded',
      'avatar',
      'backdrop-color',
      'backdrop-opacity',
      'backdrop-blur',
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
      'show-sources',
      'show-queries',
      'show-feedback',
      'show-rating',
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
  private darkModeMediaQuery?: MediaQueryList
  private boundDarkModeHandler?: () => void
  private boundSourcesOpenHandler?: (e: Event) => void
  private boundFeedbackOpenHandler?: (e: Event) => void
  private boundFeedbackCancelHandler?: (e: Event) => void
  private initialScrollDone = false
  private isRestoredSession = false
  private ratingTimer?: ReturnType<typeof setTimeout>
  private static readonly RATING_DEFAULT_DELAY_S = 90
  private static readonly RATING_THANKS_MS = 3_000
  private static readonly RATING_MIN_TURNS = 2

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

    // Listen for system dark mode changes (for theme="auto")
    this.darkModeMediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)')
    this.boundDarkModeHandler = () => this.requestUpdate()
    this.darkModeMediaQuery?.addEventListener?.('change', this.boundDarkModeHandler)

    // Listen for sources overlay open events
    this.boundSourcesOpenHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      const windowEl = this.shadowRoot?.querySelector('.tk__window') as HTMLElement
      if (windowEl) {
        const position = this.propsManager.getProps().position
        openSourcesOverlay(windowEl, detail.queries, detail.results, detail.showQueries, position)
      }
    }
    document.addEventListener('tolki:sources:open', this.boundSourcesOpenHandler)

    // Listen for feedback open events
    this.boundFeedbackOpenHandler = (e: Event) => {
      const { botUuid, chatUuid, messageId } = (e as CustomEvent).detail
      // Remove any existing feedback items (singleton)
      state.history = state.history.filter(
        (item) => item.type !== ItemType.feedback
      )
      // Find the message and insert feedback right after it (and its trailing source items)
      const msgIndex = state.history.findIndex(
        (item) => item.type === ItemType.markdown && (item as MarkdownResponse).id === messageId
      )
      if (msgIndex !== -1) {
        let insertAt = msgIndex + 1
        while (insertAt < state.history.length) {
          const t = state.history[insertAt].type
          if (t === ItemType.documentSearchQuery || t === ItemType.documentSearchResults) {
            insertAt++
          } else {
            break
          }
        }
        state.history.splice(insertAt, 0, ItemBuilder.feedback(messageId, botUuid, chatUuid))
      } else {
        state.history.push(ItemBuilder.feedback(messageId, botUuid, chatUuid))
      }
      this.updateComplete.then(() => {
        this.scrollToLastMessage(TolkiChat.SCROLL_ANIMATION_SHORT_MS)
      })
    }
    document.addEventListener('tolki:feedback:open', this.boundFeedbackOpenHandler)

    // Listen for feedback cancel events (remove from history)
    this.boundFeedbackCancelHandler = () => {
      state.history = state.history.filter(
        (item) => item.type !== ItemType.feedback
      )
    }
    document.addEventListener('tolki:feedback:cancel', this.boundFeedbackCancelHandler)

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
        onChatReset: () => {
          this.isRestoredSession = false
          this.cancelRatingTimer()
          state.ratingVisible = false
          state.ratingSubmitted = false
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
        this.scrollToLastMessage(TolkiChat.SCROLL_ANIMATION_SHORT_MS)
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

    // Handle lang attribute - bidirectional sync with set_locale command
    if (name === 'lang' && newValue) {
      this.requestedLang = newValue as string

      // Skip if this change was triggered programmatically by changeLanguage()
      if (this._settingLangProgrammatically) {
        return
      }

      // Only call changeLanguage if bot is already initialized
      // (otherwise it will be handled by init())
      if (state.bot?.status === BotStatus.ok) {
        this.changeLanguage(newValue as string).catch((error) =>
          Logger.error('Failed to change language from attribute', error)
        )
        return
      }
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

    // Add welcome message as dynamic item (reads from window.tolki.props at render time)
    // This allows the message to update when language or props change
    const welcomeMessage = this.propsManager.getProps().welcomeMessage
    if (welcomeMessage) {
      items.push(ItemBuilder.dynamicMessage('welcomeMessage'))
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

    // Set locale: component lang attribute > <html lang> > browser language
    const htmlLang = document.documentElement.lang?.split('-')[0]
    const initialLang = this.requestedLang || htmlLang || navigator.language?.split('-')[0] || 'en'
    await TolkiChat.setLanguage(initialLang)

    Bot.init(botUUID, initialLang)
      .then(async (bot) => {
        subscribeVirtualKeyboard((visibility) => {
          state.virtualKeyboardVisibility = visibility
        })

        state.bot = bot

        // Transform backend props and pass to props manager
        // Backend decides what to send (including PRO props like icon/unbranded if applicable)
        if (bot.props) {
          const transformedProps = transformBotPropsToTolkiProps(bot.props)
          if (Object.keys(transformedProps).length > 0) {
            this.propsManager.setBackendProps(transformedProps)
          }
        }

        // Sync HTML attributes (including lang) into propsManager
        this.updatePropsFromAttributes()

        // Update locale if resolved language differs from initial
        const resolvedLang = this.propsManager.getProps().lang
        if (resolvedLang && resolvedLang !== initialLang) {
          await TolkiChat.setLanguage(resolvedLang)
        }

        const chatUUID = this.getSetting<string>('chat')
        if (!validateUUID(chatUUID)) {
          state.chat = UUID()
        } else {
          state.chat = chatUUID
        }

        const history = this.getSetting<Item[]>('history')

        if (history && history.length > 0) {
          state.history = history
          this.isRestoredSession = true
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

        if (isMobile) {
          // On mobile, never auto-open (fullscreen modal is intrusive on page load)
          state.open = ''
        } else if (savedOpen === 'false') {
          state.open = ''
        } else if (savedOpen === 'true') {
          state.open = 'true'
        } else if (state.bot.props.defaultOpen === true) {
          state.open = 'true'
        } else {
          state.open = ''
        }

        // Handle initial body scroll lock if opening on mobile
        if (state.open === 'true') {
          this.scrollLock.lock()
        }

        // Notify host about initial open state
        this.dispatchEvent(new CustomEvent('tolki:toggle', {
          bubbles: true,
          composed: true,
          detail: { open: state.open === 'true' },
        }))

        // Use a MutationObserver to catch the final render and scroll to bottom instantly.
        // This handles all deferred re-renders (lil-gui, props, etc.)
        this.initialScrollDone = false
        const scrollToEnd = () => {
          if (this.log) {
            this.log.scrollTop = this.log.scrollHeight
          }
        }
        // Scroll after this render cycle
        this.updateComplete.then(() => {
          scrollToEnd()
          // Keep scrolling to end for a short window to cover all deferred renders
          const observer = new MutationObserver(() => scrollToEnd())
          if (this.log) {
            observer.observe(this.log, { childList: true, subtree: true })
          }
          setTimeout(() => {
            observer.disconnect()
            scrollToEnd()
            this.initialScrollDone = true
          }, 1000)
        })
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

    // Backdrop color with opacity
    if (props.backdropColor) {
      const opacity = props.backdropOpacity ?? 0.5
      // Convert hex to rgba with opacity
      const hex = props.backdropColor.replace('#', '')
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      map['backdrop-color'] = `rgba(${r}, ${g}, ${b}, ${opacity})`
    }

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
  private resolveI18nString(value: I18nString | string | null | undefined): string {
    if (!value) {
      return ''
    }
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
   * Supports:
   * - Plain string array: ["Hello", "Help"]
   * - Per-item i18n objects: [{ en: "Hello", it: "Ciao" }, { en: "Help", it: "Aiuto" }]
   * - Per-language arrays: { en: ["Hello", "Help"], it: ["Ciao", "Aiuto"] }
   */
  private resolveI18nArray(value: string[] | { [lang: string]: string }[] | { [lang: string]: string[] }): string[] {
    if (!value) return []

    const props = this.propsManager.getProps()
    const lang = props.lang || 'en'

    // Per-language object: { en: ["Hello", "Help"], it: ["Ciao", "Aiuto"] }
    if (!Array.isArray(value) && typeof value === 'object') {
      const langObj = value as { [lang: string]: string[] }
      if (langObj[lang]) return langObj[lang]
      if (langObj['en']) return langObj['en']
      const keys = Object.keys(langObj)
      return keys.length > 0 ? langObj[keys[0]] : []
    }

    // If it's already a plain string array, return it
    if (value.length === 0 || typeof value[0] === 'string') {
      return value as string[]
    }

    // Per-item i18n objects: [{ en: "Hello", it: "Ciao" }]
    const objectArray = value as { [lang: string]: string }[]
    return objectArray.map((item) => {
      if (item[lang]) return item[lang]
      if (item['en']) return item['en']
      const keys = Object.keys(item)
      return keys.length > 0 ? item[keys[0]] : ''
    })
  }

  /**
   * Compute if dark mode should be active based on theme prop
   * - 'dark': always dark
   * - 'light': always light
   * - 'auto': follows system preference (prefers-color-scheme)
   */
  get isDarkMode(): boolean {
    const props = this.propsManager.getProps()
    const theme = props.theme || 'auto'

    if (theme === 'dark') return true
    if (theme === 'light') return false

    // 'auto' - check system preference
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
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

  get windowMaxHeightVariables() {
    const props = this.propsManager.getProps()
    const value = props.windowMaxHeight
    if (!value) return ''
    return `--window-max-height: ${value};`
  }

  get roundedVariables() {
    const props = this.propsManager.getProps()
    const rounded = props.rounded || 'md'

    const radiusMap: { [key: string]: string } = {
      none: '0px',
      xs: '5px',
      sm: '10px',
      md: '15px',
      lg: '20px',
      xl: '25px',
    }

    return `--rounded: ${radiusMap[rounded]};`
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
    // IMPORTANT: We avoid using transform on host as it creates a containing block
    // that breaks position:fixed for the backdrop
    let styles = `position:fixed;z-index:9999999;bottom:${marginY}px;`

    // Add horizontal positioning based on position prop
    switch (position) {
      case 'left':
        styles += `left:${marginX}px;right:auto;`
        break
      case 'center':
        // Use left:0;right:0 with flex centering instead of transform
        styles += 'left:0;right:0;display:flex;justify-content:center;align-items:flex-end;pointer-events:none;'
        break
      case 'right':
        styles += `right:${marginX}px;left:auto;`
        break
    }

    return styles
  }

  toggleWindow() {
    const wasOpen = state.open === 'true'
    state.open = state.open === 'true' ? '' : 'true'
    this.saveSetting('open', state.open === 'true' ? 'true' : 'false')

    const isOpen = state.open === 'true'
    this.dispatchEvent(new CustomEvent('tolki:toggle', {
      bubbles: true,
      composed: true,
      detail: { open: isOpen },
    }))

    // Handle body scroll lock on mobile
    if (isOpen) {
      this.scrollLock.lock()
    } else {
      this.scrollLock.unlock()
      this.cancelRatingTimer()
      // Close sources sidebar when closing the window
      const windowEl = this.shadowRoot?.querySelector('.tk__window') as HTMLElement
      if (windowEl) closeSourcesOverlayImmediate(windowEl)
    }

    // Scroll to bottom when opening chat
    if (!wasOpen && isOpen) {
      this.updateComplete.then(() => {
        // Use rAF to ensure the window is visible and layout is computed
        requestAnimationFrame(() => {
          if (this.log) {
            this.log.scrollTop = this.log.scrollHeight
          }
        })
      })
    }

    if (!wasOpen && isOpen) {
      this.updateComplete.then(() => {
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
    // During init phase, always scroll to absolute bottom instantly
    if (!this.initialScrollDone) {
      if (this.log) {
        this.log.scrollTop = this.log.scrollHeight
      }
      return
    }

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
    // During init phase, always scroll to absolute bottom instantly (behavior B)
    if (!this.initialScrollDone) {
      if (this.log) {
        this.log.scrollTop = this.log.scrollHeight
      }
      return
    }

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
    this.startRatingTimer()
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
    this.startRatingTimer()
  }

  afterSend() {
    state.pending = true
    this.cancelRatingTimer()
    this.resetMessage()
    this.updateComplete.then(() => {
      this.scrollToLastMessage(TolkiChat.SCROLL_ANIMATION_SHORT_MS)
    })
  }

  // ---------------------------------------------------------------------------
  // Rating
  // ---------------------------------------------------------------------------

  private countTurns(): number {
    let turns = 0
    let lastWasUser = false
    for (const item of state.history) {
      if (item.type === ItemType.userInput) {
        lastWasUser = true
      } else if (item.type === ItemType.markdown && !item.level && lastWasUser) {
        turns++
        lastWasUser = false
      }
    }
    return turns
  }

  private startRatingTimer() {
    this.cancelRatingTimer()

    const showRating = this.propsManager.getProps().showRating
    // Don't start if: disabled by prop, restored session, already dismissed/submitted, not enough turns
    if (!showRating) return
    if (this.isRestoredSession) return
    if (this.getSetting<string>('ratingDismissedChat') === state.chat) return
    if (state.ratingVisible || state.ratingSubmitted) return
    if (this.countTurns() < TolkiChat.RATING_MIN_TURNS) return

    const delaySec = typeof showRating === 'number'
      ? showRating
      : TolkiChat.RATING_DEFAULT_DELAY_S
    const delayMs = delaySec * 1000

    this.ratingTimer = setTimeout(() => {
      // Double-check chat is open
      if (state.open !== 'true' && !state.inline && !state.unclosable) return
      state.ratingVisible = true
      this.autoScrollToBottom()
    }, delayMs)
  }

  private cancelRatingTimer() {
    if (this.ratingTimer) {
      clearTimeout(this.ratingTimer)
      this.ratingTimer = undefined
    }
  }

  private handleRate(rating: number) {
    state.ratingSubmitted = true
    this.saveSetting('ratingDismissedChat', state.chat)
    this.cancelRatingTimer()

    // Fire-and-forget API call
    Api.conversationRating(state.bot.uuid, state.chat, rating).catch(() => {
      // Graceful: rating display is already shown, backend will catch up later
    })

    // Hide the thanks message after a delay
    setTimeout(() => {
      state.ratingVisible = false
    }, TolkiChat.RATING_THANKS_MS)
  }

  private handleRatingDismiss() {
    state.ratingVisible = false
    this.saveSetting('ratingDismissedChat', state.chat)
    this.cancelRatingTimer()
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
        item.type === ItemType.userInput ||
        item.type === ItemType.documentSearchQuery ||
        item.type === ItemType.documentSearchResults
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
        this.propsManager.getProps().showSources
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

    // Update the DOM attribute to keep it in sync (bidirectional)
    // Use flag to prevent infinite loop with attributeChangedCallback
    this._settingLangProgrammatically = true
    this.setAttribute('lang', locale)
    this._settingLangProgrammatically = false

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
      this.cancelRatingTimer()
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

    // Clean up dark mode listener
    if (this.darkModeMediaQuery && this.boundDarkModeHandler) {
      this.darkModeMediaQuery.removeEventListener('change', this.boundDarkModeHandler)
    }

    // Clean up ResizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = undefined
    }

    // Clean up rating timer
    this.cancelRatingTimer()

    // Clean up sources overlay listener
    if (this.boundSourcesOpenHandler) {
      document.removeEventListener('tolki:sources:open', this.boundSourcesOpenHandler)
    }

    // Clean up feedback listeners
    if (this.boundFeedbackOpenHandler) {
      document.removeEventListener('tolki:feedback:open', this.boundFeedbackOpenHandler)
    }
    if (this.boundFeedbackCancelHandler) {
      document.removeEventListener('tolki:feedback:cancel', this.boundFeedbackCancelHandler)
    }

    // Clean up body scroll lock if component is removed while open
    this.scrollLock.unlock()
  }

  /**
   * Sync resolved i18n props to window.tolki.props for dynamic template access
   * Called before each render to ensure templates have fresh data
   */
  private syncPropsToWindow(): void {
    if (!window.tolki) {
      window.tolki = {}
    }

    const props = this.propsManager.getProps()
    window.tolki.props = {
      welcomeMessage: this.resolveI18nString(props.welcomeMessage) || undefined,
      name: this.resolveI18nString(props.name) || undefined,
    }
  }

  override render() {
    // Sync resolved props to window.tolki.props before rendering
    this.syncPropsToWindow()

    const hostStyles = !state.inline
      ? `${this.colorVariables} ${this.windowSizeVariables} ${this.toggleSizeVariables} ${this.marginVariables} ${this.windowMaxHeightVariables} ${this.roundedVariables} ${this.hostPositionStyles}`
      : `${this.colorVariables} ${this.windowSizeVariables} ${this.toggleSizeVariables} ${this.marginVariables} ${this.windowMaxHeightVariables} ${this.roundedVariables}`

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
              'tk__window--dark': this.isDarkMode,
              'tk__window--left':
                this.propsManager.getProps().position === 'left',
              'tk__window--center':
                this.propsManager.getProps().position === 'center',
              'tk__window--right':
                this.propsManager.getProps().position === 'right',
            })}
            role="region"
            aria-label=${this.resolveI18nString(this.propsManager.getProps().name) || this.resolveI18nString(state.bot?.props?.name) || 'Chat'}
          >
            ${headerTemplate(
              this.resolveI18nString(this.propsManager.getProps().name) || this.resolveI18nString(state.bot.props.name),
              this.propsManager.getProps().avatar || state.bot.props.avatar
            )}
            <div
              class=${classMap({
                tk__log: true,
              })}
              role="log"
              aria-live="polite"
              aria-atomic="false"
              aria-label="Chat messages"
            >
              ${state.history.map((item, index) =>
                item && item.type
                  ? keyed(
                      `${state.renderKey}-${index}`,
                      chatItemTemplate(item, state.history, index, state.bot?.uuid || '', state.chat || '', this.propsManager.getProps().showQueries, this.propsManager.getProps().showFeedback)
                    )
                  : html``
              )}
              ${ratingTemplate(
                state.ratingVisible,
                state.ratingSubmitted,
                (rating: number) => this.handleRate(rating),
                () => this.handleRatingDismiss()
              )}
            </div>
            ${suggestionsTemplate(this.resolveI18nArray(this.propsManager.getProps().suggestions), this.extractCommand.bind(this))}
            ${textareaTemplate(
              state.pending,
              state.showScrollDown,
              !!this.propsManager.getProps().suggestions?.length,
              this.resolveI18nString(this.propsManager.getProps().messagePlaceholder)
            )}
            ${state.bot?.props?.unbranded ? '' : brandingTemplate()}
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
          ${!state.inline && !state.unclosable && this.propsManager.getProps().backdropColor
            ? html`<div
                class=${classMap({
                  tk__backdrop: true,
                  'tk__backdrop--blur-sm': (this.propsManager.getProps().backdropBlur || 'md') === 'sm',
                  'tk__backdrop--blur-md': (this.propsManager.getProps().backdropBlur || 'md') === 'md',
                  'tk__backdrop--blur-lg': (this.propsManager.getProps().backdropBlur || 'md') === 'lg',
                  'tk__backdrop--blur-xl': (this.propsManager.getProps().backdropBlur || 'md') === 'xl',
                  'tk__backdrop--visible': state.open === 'true',
                })}
                @click=${() => this.toggleWindow()}
              ></div>`
            : ''}
        `
      : html``
  }
}
