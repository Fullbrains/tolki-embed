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

// Tolki
import { UUID, validateUUID } from '../../utils/uuid'
import { Bot } from '../../services/bot'
import { Api } from '../../services/api'
import { Item, ItemType, ActionResponse } from '../../types/item'
import { BotInitResult, BotStatus } from '../../types/bot'
import { ApiMessageResponse, ApiMessageResponseStatus } from '../../types/api'
import { ItemBuilder } from '../../services/item-builder'

// Templates
import { headerTemplate } from './templates/header'
import { brandingTemplate } from './templates/branding'
import { textareaTemplate } from './templates/textarea'
import { toggleTemplate } from './templates/toggle'
import { chatItemTemplate } from './templates/item'
import { suggestionsTemplate } from './templates/suggestions'

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

// Global command registry for action buttons
export const ActionCommands = {
  showCart: () => {
    state.history.push(ItemBuilder.cart())
    slef.clearHistory()
    slef.saveHistory()
    slef.updateComplete.then(() => {
      slef.scrollToLastMessage(100)
    })
  },

  showCartAndRemoveNotification: () => {
    // Remove cart notification from history (both old action type and new cartNotification type)
    state.history = state.history.filter((item) => {
      return !(
        (item.type === ItemType.action && item.data?.isCartNotification) ||
        item.type === ItemType.cartNotification
      )
    })
    state.history.push(ItemBuilder.cart())
    slef.clearHistory()
    slef.saveHistory()
    slef.updateComplete.then(() => {
      slef.scrollToLastMessage(100)
    })
  },

  resetChat: async () => {
    state.chat = UUID()
    slef.saveSetting('chat', state.chat)
    await slef.addHeadingMessages()
    slef.saveSetting('history', state.history)
  },

  cancelAction: (data?: any, actionToRemove?: ActionResponse) => {
    if (actionToRemove) {
      state.history = state.history.filter((item) => item !== actionToRemove)
    }
  },
}

@customElement(TOLKI_CHAT)
export class TolkiChat extends LitElement {
  static styles = styles
  stateController = new StateController(this, state)
  suggestionsListenersAdded = false
  requestedLang?: string

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

  constructor() {
    super()
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    slef = this
    // Check for lang attribute immediately
    const langAttr = this.getAttribute('lang')
    if (langAttr) {
      this.requestedLang = langAttr
    }

    // Listen for tolki:update event to force re-rendering
    window.addEventListener('tolki:update', () => {
      this.requestUpdate()
    })

    // Expose ActionCommands globally for action buttons
    window.ActionCommands = ActionCommands

    // Add update function to window.tolki
    if (!window.tolki) {
      window.tolki = {}
    }
    window.tolki.update = () => {
      window.dispatchEvent(new Event('tolki:update'))
    }
  }

  get botUUID() {
    return state.bot?.uuid
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
    const privacyMessage = ItemBuilder.info('By using this chat, you agree to our <a target="_blank" href="https://tolki.ai/privacy">privacy policy</a>.')
    if (privacyMessage) {
      privacyMessage.templateKey = 'privacy_policy'
    }
    
    state.history = privacyMessage ? [privacyMessage] : []
    if (state.bot?.props?.welcomeMessage) {
      state.history.push(ItemBuilder.assistant(state.bot.props.welcomeMessage))
    }

    // Add cart notification (will be rendered dynamically based on current cart state)
    const cartData = window.tolki?.cart
    const itemCount = cartData?.items?.length || 0
    const isLoading = cartData?.status === 'loading'
    if (itemCount > 0 || isLoading) {
      state.history.push(ItemBuilder.cartNotification())
    }

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

        if (savedOpen === 'false') {
          state.open = ''
        } else if (savedOpen === 'true') {
          state.open = 'true'
        } else if (state.bot.props.defaultOpen === true) {
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

  scrollToLastMessage(timeout: number = 500, animated: boolean = true) {
    setTimeout(() => {
      const chatItems = this.log.querySelectorAll('.tk__chat-item')
      if (chatItems.length > 0) {
        const lastMessage = chatItems[chatItems.length - 1] as HTMLElement
        const messageTop = lastMessage.offsetTop - 20 - 60 // 20px log padding + 60px extra space
        this.log.scrollTo({
          top: Math.max(0, messageTop),
          behavior: animated ? 'smooth' : 'auto',
        })
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
      (item) => item.type !== ItemType.thinking && item.type !== ItemType.cartNotification
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
    const commandMatch = suggestionText.match(/\[([^\]]+)\]/)

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
        state.history.push(ItemBuilder.cart())
        break
      case 'show_orders':
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
      if (slef.suggestionsListenersAdded === false) {
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
        slef.suggestionsListenersAdded = true
      }
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
              ${state.history.filter(item => item && item.type).map((item, index) => keyed(`${state.renderKey}-${index}`, chatItemTemplate(item)))}
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
