// Lit Imports
import { property, State, StateController, storage } from '@lit-app/state'
import { html, LitElement } from 'lit'
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

// iride Colors
import cobalt from '@fullbrains/iride/cobalt.js'
import steel from '@fullbrains/iride/steel.js'

// Styles
import styles from './styles/tolki-chat.scss'

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

// Tolki Types
import { Item, ItemType } from '../../types/item'
import { BotInitResult, BotStatus } from '../../types/bot'
import { ApiMessageResponse, ApiMessageResponseStatus } from '../../types/api'

// Templates
import { headerTemplate } from './templates/header'
import { brandingTemplate } from './templates/branding'
import { textareaTemplate } from './templates/textarea'
import { toggleTemplate } from './templates/toggle'
import { chatItemTemplate } from './templates/item'
import { suggestionsTemplate } from './templates/suggestions'

// Utils
import { CartHelpers } from '../../utils/chat-helpers'

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
let slef = null

// Global command registry will be initialized when the component is created
export let ActionCommands: ReturnType<typeof createActionCommands>

@customElement(TOLKI_CHAT)
export class TolkiChat extends LitElement {
  static styles = styles
  stateController = new StateController(this, state)
  suggestionsListenersAdded = false
  requestedLang?: string

  // Services
  private commandService!: ChatCommandService
  private scrollStateManager!: ScrollStateManager
  private historyManager!: HistoryManager

  static get observedAttributes() {
    return ['bot', 'inline', 'unclosable', 'lang']
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

  constructor() {
    super()
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    slef = this

    // Initialize services
    this.initializeServices()

    // Check for the lang attribute immediately
    const langAttr = this.getAttribute('lang')
    if (langAttr) {
      this.requestedLang = langAttr
    }

    // Listen for tolki:update event to force re-rendering
    window.addEventListener('tolki:update', () => {
      this.handleTolkiUpdate()
    })

    // Listen for cart loaded event to update cart notification
    window.addEventListener('tolki:cart:loaded', () => {
      this.handleCartLoaded()
    })

    // Add the update function to window.tolki
    if (!window.tolki) {
      window.tolki = {}
    }
    window.tolki.update = () => {
      window.dispatchEvent(new Event('tolki:update'))
    }

    // Ensure font loading on Chrome mobile
    this.ensureFontLoading()
  }

  /**
   * Ensure font loading works properly on Chrome mobile
   */
  private ensureFontLoading(): void {
    // Force font loading using document.fonts API if available
    if ('fonts' in document) {
      const fontFace = new FontFace(
        'Funnel Sans',
        'url(https://fonts.gstatic.com/s/funnelsans/v8/VuJS2lhKlC_NvrdTfTmz_ew3PGXiL_o.woff2) format("woff2")',
        { weight: '300 800', display: 'swap' }
      )
      
      fontFace.load().then(() => {
        document.fonts.add(fontFace)
        // Force re-render after font loads
        this.requestUpdate()
      }).catch(() => {
        // Font loading failed, component will use fallback
        console.warn('Tolki: Font loading failed, using fallback')
      })
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

    // Initialize scroll state manager
    this.scrollStateManager = new ScrollStateManager()

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
        this.scrollToLastMessage(100) // Animated scroll for better UX
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
    state.history = state.history.filter(item => 
      item.type !== ItemType.cartNotification
    )
    const removedNotifications = initialHistoryLength !== state.history.length

    // Check if the last message is a cart - if so, don't add cart notification
    const lastMessage = state.history[state.history.length - 1]
    const isLastMessageCart = lastMessage && lastMessage.type === ItemType.cart

    // Create new cart notification (will be null if cart is empty or error)
    const cartNotification = CartHelpers.createCartNotification()
    
    if (cartNotification && !isLastMessageCart) {
      // Add cart notification to history only if last message is not a cart
      state.history.push(cartNotification)
      this.saveHistory()
      this.updateComplete.then(() => {
        this.scrollToLastMessage(100)
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

  getSetting(key: string): string | boolean | unknown | undefined {
    if (!this.botUUID) return undefined
    const settings = JSON.parse(state.settings)
    if (!settings[this.botUUID]) return undefined
    return settings[this.botUUID][key]
  }

  saveSetting(key: string, value: unknown): void {
    if (!this.botUUID) return undefined
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
    if (name === 'inline') {
      state.inline = true
    }
    if (name === 'unclosable') {
      state.unclosable = true
    }
    if (name === 'lang' && newValue) {
      // Store the requested language to use during initialization
      this.requestedLang = newValue as string
    }
    if (name === 'bot' && newValue) {
      this.init().then()
    }
  }

  static async setLanguage(locale: string) {
    try {
      await setLocale(locale)
    } catch (error) {
      console.warn('Failed to set locale:', locale, error)
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

        const chatUUID = this.getSetting('chat') as string
        if (!validateUUID(chatUUID)) {
          state.chat = UUID()
        } else {
          state.chat = chatUUID
        }

        const history = this.getSetting('history') as Item[]

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

        const savedOpen = this.getSetting('open') as string
        const isMobile = window.innerWidth <= 480 // Using same breakpoint as CSS

        if (savedOpen === 'false') {
          state.open = ''
        } else if (savedOpen === 'true') {
          state.open = 'true'
        } else if (state.bot.props.defaultOpen === true && !isMobile) {
          state.open = 'true'
        } else {
          state.open = ''
        }

        setTimeout(() => {
          const top = this.log.scrollHeight - (this.log.clientHeight - 80)
          this.log.scrollTo({
            top,
            behavior: 'auto',
          })
        }, 0)
      })
      .catch((bot) => {
        state.bot = bot
        console.error('Tolki: Bot not initialized:', bot)
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
    slef.scrollToBottom(100)
  }

  get colorVariables() {
    const styles = state.bot.props.styles?.chat
    const map: { [key: string]: string } = {}
    map['toggle-default-background'] =
      styles?.button?.defaultBackgroundColor || cobalt['cobalt-41']
    map['toggle-hover-background'] =
      styles?.button?.hoverBackgroundColor || cobalt['cobalt-35']
    map['toggle-dots-background'] =
      styles?.button?.foregroundColor || steel['steel-14']
    map['bubble-background'] =
      styles?.bubble?.backgroundColor || cobalt['cobalt-35']
    map['bubble-color'] = styles?.bubble?.foregroundColor || steel['steel-01']

    return Object.keys(map)
      .map((key: string) => {
        return '--' + key + ':' + map[key]
      })
      .join(';')
  }

  toggleWindow() {
    const wasOpen = state.open === 'true'
    state.open = state.open === 'true' ? '' : 'true'
    slef.saveSetting('open', state.open === 'true' ? 'true' : 'false')

    // Focus input only when user manually opens window
    if (!wasOpen && state.open === 'true') {
      slef.updateComplete.then(() => {
        setTimeout(() => {
          if (slef.textarea) {
            slef.textarea.focus()
          }
        }, 300)
      })
    }
  }

  resetMessage() {
    this.textarea.value = ''
    this.textarea.style.height = '43px'
    this.textarea.focus()
  }

  scrollToBottom(timeout: number = 500) {
    setTimeout(() => {
      const top = this.log.scrollHeight - (this.log.clientHeight - 80)
      this.log.scrollTo({
        top,
        behavior: 'smooth',
      })
    }, timeout)
  }

  scrollToLastMessage(timeout: number = 500, animated: boolean = true, retryCount: number = 0) {
    setTimeout(() => {
      const chatItems = this.log.querySelectorAll('.tk__chat-item')
      if (chatItems.length > 0) {
        const lastMessage = chatItems[chatItems.length - 1] as HTMLElement
        const initialHeight = this.log.scrollHeight
        const messageTop = lastMessage.offsetTop - 20 - 60 // 20px log padding + 60px extra space
        
        this.log.scrollTo({
          top: Math.max(0, messageTop),
          behavior: animated ? 'smooth' : 'auto',
        })
        
        // For dynamic content (cart/orders), check if height changed after scroll
        // and retry if needed (up to 3 times)
        if (retryCount < 3) {
          setTimeout(() => {
            const newHeight = this.log.scrollHeight
            const hasCartOrOrders = this.log.querySelector('.tk__message--show_cart, .tk__message--show_orders')
            
            // If height changed significantly and we have dynamic content, retry
            if (hasCartOrOrders && Math.abs(newHeight - initialHeight) > 20) {
              this.scrollToLastMessage(200, animated, retryCount + 1)
            }
          }, 300)
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
      this.scrollToLastMessage(100)
    })
  }

  afterSend() {
    state.pending = true
    this.resetMessage()
    this.updateComplete.then(() => {
      this.scrollToLastMessage(100)
    })
  }

  logScroll = () => {
    const scrollHeight = this.log.scrollHeight
    const scrollTop = this.log.scrollTop
    const clientHeight = this.log.clientHeight
    const offsetFromBottom = scrollHeight - (scrollTop + clientHeight)
    state.showScrollDown = offsetFromBottom > 200
    state.atBottom = offsetFromBottom <= 50
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
        slef.saveHistory()
      }
    }
  }

  async sendMessage() {
    const message: string = this.textarea?.value?.trim()

    if (!message || message === '' || state.bot?.status !== BotStatus.ok) {
      this.resetMessage()
      this.scrollToBottom(100)
      return
    }

    if (state.virtualKeyboardVisibility === 'visible') {
      setTimeout(() => {
        this.textarea.blur()
      }, 100)
    }

    const userInputItem = ItemBuilder.userInput(message)
    state.history.push(userInputItem)
    this.clearHistory()
    this.saveHistory()
    state.history.push(ItemBuilder.thinking())
    this.afterSend()

    try {
      Api.message(state.chat, state.bot.uuid, message, state.bot.props.isAdk)
        .then(async ({ data }: ApiMessageResponse) => {
          if (Array.isArray(data)) {
            const items: Item[] = data

            for (const item of items) {
              state.history.push(item)
            }

            // Process any setLocale messages that were added
            await this.processHistoryLocales()

            this.clearHistory()
            this.saveHistory()
            this.afterReceive()
          }
        })
        .catch(({ status, data, response, error }: ApiMessageResponse) => {
          if (
            status === ApiMessageResponseStatus.error ||
            status === ApiMessageResponseStatus.notOk
          ) {
            state.history.push(ItemBuilder.error())
            state.history = state.history.filter(
              (item) => item.type !== ItemType.thinking
            )
            this.saveHistory()
            console.error('Tolki: error:', status, data, response, error)
            this.afterReceive()
          }
        })
    } catch (err) {
      console.error('Tolki: error:', err)
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
        state.history = state.history.filter(item => item.type !== ItemType.cart)
        state.history.push(ItemBuilder.cart())
        break
      case 'show_orders':
        // Remove any existing orders messages (singleton behavior)
        state.history = state.history.filter(item => item.type !== ItemType.orders)
        state.history.push(ItemBuilder.orders())
        break
      case 'set_locale':
        if (commandParam) {
          this.changeLanguage(commandParam).catch(console.error)
          return // Don't update history for language changes
        } else {
          console.warn('set_locale command requires a locale parameter')
          return
        }
      default:
        console.warn('Unknown command:', command)
        return
    }

    this.clearHistory()
    this.saveHistory()
    this.updateComplete.then(() => {
      this.scrollToLastMessage(100)
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
      state.history = state.history.filter(item => 
        !(item.type === ItemType.markdown && item.templateKey === 'language_changed')
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

    // Update render key to force complete re-render of all templates
    state.renderKey = Date.now()

    // Force re-render
    this.requestUpdate()

    // Scroll to the new message
    this.updateComplete.then(() => {
      this.scrollToLastMessage(100)
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
      }, 500)
    }
    const scrollDown = () => {
      this.scrollToBottom(100)
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
    if (this.toggle) {
      this.toggle.removeEventListener('click', this.toggleWindow)
      this.toggle.addEventListener('click', this.toggleWindow)
    }
    if (this.close) {
      this.close.removeEventListener('click', this.toggleWindow)
      this.close.addEventListener('click', this.toggleWindow)
    }
    if (this.reset) {
      this.reset.removeEventListener('click', this.resetChat)
      this.reset.addEventListener('click', this.resetChat)
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
      if (this.suggestionsListenersAdded === false) {
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
        this.suggestionsListenersAdded = true
        
        // Setup scroll button visibility logic
        this.setupSuggestionsScrollButtons()
      }
    }
    
    // Setup ResizeObserver for dynamic content (cart/orders)
    this.setupDynamicContentObserver()
  }

  private setupSuggestionsScrollButtons() {
    if (!this.suggestionsContainer || !this.scrollLeftBtn || !this.scrollRightBtn) {
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
      if (scrollLeft < maxScroll - 1) { // -1 for rounding issues
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
    setTimeout(updateScrollButtons, 100)
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
        if (target.closest('.tk__message--show_cart, .tk__message--show_orders')) {
          shouldUpdateScroll = true
          break
        }
      }
      
      // If dynamic content changed size and user was at bottom, maintain scroll
      if (shouldUpdateScroll && state.atBottom) {
        this.scrollToLastMessage(100, false) // No animation for resize updates
      }
    })

    // Observe all cart and orders elements
    const dynamicElements = this.log?.querySelectorAll('.tk__message--show_cart, .tk__message--show_orders')
    dynamicElements?.forEach(element => {
      this.resizeObserver?.observe(element)
    })
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    
    // Clean up ResizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = undefined
    }
  }

  override render() {
    return state.bot?.status === BotStatus.ok
      ? html`
          <style>
            :host {
              ${this.colorVariables}
            }

            ${styles}
            ${!state.inline && `:host{position:fixed;z-index:9999999}`}
          </style>
          <div
            class=${classMap({
              tk__window: true,
              'tk__window--open':
                (state.open === 'true' || state.unclosable) && !state.inline,
              'tk__window--inline': state.inline,
              'tk__window--floating': !state.inline,
              'tk__window--unclosable': state.unclosable,
            })}
          >
            ${headerTemplate(state.bot.props.name, state.bot.props.avatar)}
            <div
              class=${classMap({
                tk__log: true,
              })}
            >
              ${state.history
                .filter((item) => item && item.type)
                .map((item, index) =>
                  keyed(`${state.renderKey}-${index}`, chatItemTemplate(item))
                )}
            </div>
            ${suggestionsTemplate(
              state.bot.props.suggestions,
              this.extractCommand.bind(this)
            )}
            ${textareaTemplate(
              state.pending,
              state.showScrollDown,
              !!state.bot.props.suggestions?.length
            )}
            ${state.bot?.props?.unbranded ? '' : brandingTemplate}
          </div>
          ${state.inline
            ? ''
            : toggleTemplate(state.open === 'true', state.unclosable)}
        `
      : html``
  }
}
