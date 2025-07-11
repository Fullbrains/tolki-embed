// Lit Imports
import { property, State, StateController, storage } from '@lit-app/state'
import { html, LitElement } from 'lit'
import { customElement, query, queryAll } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'

// Libs
import autosize from 'autosize'
import {
  isSupported as isVirtualKeyboardSupported,
  subscribe as subscribeVirtualKeyboardVisibility,
} from 'on-screen-keyboard-detector'

// Okuda Colors
import cobalt from '@fullbrains/okuda/colors/cobalt/cobalt.js'
import kool from '@fullbrains/okuda/colors/kool/kool.js'

// Styles
import styles from './tolki-chat.scss'

// Tolki
import { UUID, validateUUID } from '../utils/encryption'
import {
  TolkiBot,
  TolkiBotInitResult,
  TolkiBotStatus,
} from '../tolki-bot/tolki-bot'
import {
  actionResponse,
  assistantResponse,
  errorResponse,
  infoResponse,
  thinkingResponse,
  TolkiChatItem,
  TolkiChatItemType,
  userInput,
} from './tolki-chat-item'

import {
  TolkiApi,
  TolkiApiMessageResponse,
  TolkiApiMessageResponseStatus,
} from '../tolki-api/tolki-api'

// Templates
import { headerTemplate } from '../templates/header'
import { brandingTemplate } from '../templates/branding'
import { textareaTemplate } from '../templates/textarea'
import { toggleTemplate } from '../templates/toggle'
import { chatItemTemplate } from '../templates/item'
import { suggestionsTemplate } from '../templates/suggestions'

const TOLKI_CHAT: string = `tolki-chat`
const TOLKI_PREFIX: string = `tolki`

class TolkiChatState extends State {
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
  bot: TolkiBotInitResult

  @property({ value: false })
  pending: boolean

  @property({ value: true })
  atBottom: boolean

  @property({ value: false })
  showScrollDown: boolean

  @property({ value: '' })
  virtualKeyboardVisibility: string

  @property({ value: [] })
  history: TolkiChatItem[]
}

const state = new TolkiChatState()
let slef = null

@customElement(TOLKI_CHAT)
export class TolkiChat extends LitElement {
  static styles = styles
  stateController = new StateController(this, state)
  suggestionsListenersAdded = false

  static get observedAttributes() {
    return ['bot', 'inline', 'unclosable']
  }

  static get privacyNotice() {
    return {
      en: 'By using this chat, you agree to our <a target="_blank" href="https://tolki.ai/privacy">privacy policy</a>.',
    }
  }

  @query('.tkc__close') close: HTMLButtonElement
  @query('.tkc__reset') reset: HTMLButtonElement
  @query('.tkc__log') log: HTMLDivElement
  @query('.tkc__scroll-down') scrollDown: HTMLButtonElement
  @query('.tkc__send') send: HTMLButtonElement
  @query('.tkc__textarea') textarea: HTMLTextAreaElement
  @query('.tkc__toggle') toggle: HTMLButtonElement
  @queryAll('.tkc__suggestion') suggestions: HTMLButtonElement[]

  constructor() {
    super()
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    slef = this
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
    if (name === 'bot' && newValue) {
      this.init()
    }
  }

  static lang() {
    return navigator.language || 'en'
  }

  public addHeadingMessages() {
    const lang: string = TolkiChat.lang()
    state.history = [
      infoResponse(
        TolkiChat.privacyNotice[lang] || TolkiChat.privacyNotice['en']
      ),
    ]
    if (state.bot?.props?.welcomeMessage) {
      state.history.push(assistantResponse(state.bot.props.welcomeMessage))
    }
  }

  public init() {
    const botUUID: string = this.getAttribute('bot')
    if (!botUUID) return
    TolkiBot.init(botUUID)
      .then((bot) => {
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

        const history = this.getSetting('history') as TolkiChatItem[]

        if (history) {
          state.history = history
        } else {
          state.history = []
        }
        if (!state.history?.length) {
          this.addHeadingMessages()
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

        this.scrollToBottom()
      })
      .catch((bot) => {
        state.bot = bot
        console.error('Tolki: Bot not initialized:', bot)
      })
  }

  public resetChat() {
    const resetAction = actionResponse(
      `Do you want to start a new chat?
      You will lose the current messages.`,
      [
        {
          label: 'Reset',
          primary: true,
          click() {
            state.chat = UUID()
            slef.saveSetting('chat', state.chat)
            slef.addHeadingMessages()
            slef.saveSetting('history', state.history)
          },
        },
        {
          label: 'Cancel',
          click() {
            state.history = state.history.filter((item) => item !== resetAction)
          },
        },
      ]
    )
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
      styles?.button?.foregroundColor || kool['kool-14']
    map['bubble-background'] =
      styles?.bubble?.backgroundColor || cobalt['cobalt-35']
    map['bubble-color'] = styles?.bubble?.foregroundColor || kool['kool-01']

    return Object.keys(map)
      .map((key: string) => {
        return '--' + key + ':' + map[key]
      })
      .join(';')
  }

  toggleWindow() {
    state.open = state.open === 'true' ? '' : 'true'
    slef.saveSetting('open', state.open)
  }

  resetMessage() {
    this.textarea.value = ''
    this.textarea.style.height = '40px'
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

  autoScrollToBottom() {
    if (state.atBottom) {
      this.scrollToBottom()
    }
  }

  afterReceive() {
    state.pending = false
    this.scrollToBottom(100)
  }

  afterSend() {
    state.pending = true
    this.resetMessage()
    this.scrollToBottom(100)
  }

  logScroll = () => {
    const scrollHeight = this.log.scrollHeight
    const scrollTop = this.log.scrollTop
    const clientHeight = this.log.clientHeight
    const offsetFromBottom = scrollHeight - (scrollTop + clientHeight)
    state.showScrollDown = offsetFromBottom > 200
    state.atBottom = offsetFromBottom <= 50
  }

  clearHistory(): TolkiChatItem[] {
    const filteredHistory: TolkiChatItem[] = state.history.filter(
      (item) => item.type !== TolkiChatItemType.thinking
    )
    state.history = filteredHistory
    return filteredHistory
  }

  saveHistory() {
    const serializedMessages = state.history.filter((item: TolkiChatItem) => {
      return (
        item.type === TolkiChatItemType.action ||
        item.type === TolkiChatItemType.card ||
        item.type === TolkiChatItemType.markdown ||
        item.type === TolkiChatItemType.product ||
        item.type === TolkiChatItemType.userInput
      )
    })
    this.saveSetting('history', serializedMessages)
  }

  async sendMessage() {
    const message: string = this.textarea?.value?.trim()

    if (!message || message === '' || state.bot?.status !== TolkiBotStatus.ok) {
      this.resetMessage()
      this.scrollToBottom(100)
      return
    }

    if (state.virtualKeyboardVisibility === 'visible') {
      setTimeout(() => {
        this.textarea.blur()
      }, 100)
    }

    const userInputItem = userInput(message)
    state.history.push(userInputItem)
    this.clearHistory()
    this.saveHistory()
    state.history.push(thinkingResponse)
    this.afterSend()

    try {
      console.log('Tolki: ', state.chat, state.bot.uuid)
      TolkiApi.message(state.chat, state.bot.uuid, message)
        .then(({ data }: TolkiApiMessageResponse) => {
          if (Array.isArray(data)) {
            const chatItems: TolkiChatItem[] = data
            chatItems.forEach((item) => {
              state.history.push(item)
            })
            this.clearHistory()
            this.saveHistory()
            this.afterReceive()
          }
        })
        .catch(({ status, data, response, error }: TolkiApiMessageResponse) => {
          if (
            status === TolkiApiMessageResponseStatus.error ||
            status === TolkiApiMessageResponseStatus.notOk
          ) {
            state.history.push(errorResponse)
            state.history = state.history.filter(
              (item) => item.type !== TolkiChatItemType.thinking
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
          suggestion.addEventListener('click', () => {
            this.textarea.value = suggestion.textContent
            this.sendMessage().then()
          })
        })
        slef.suggestionsListenersAdded = true
      }
    }
  }

  override render() {
    return state.bot?.status === TolkiBotStatus.ok
      ? html`
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap"
            rel="stylesheet"
          />
          <style>
            :host {
              ${this.colorVariables}
            }

            ${styles}
            ${!state.inline && `:host{position:fixed;z-index:9999999}`}
          </style>
          <div
            class=${classMap({
              tkc__window: true,
              'tkc__window--open':
                (state.open === 'true' || state.unclosable) && !state.inline,
              'tkc__window--inline': state.inline,
              'tkc__window--floating': !state.inline,
              'tkc__window--unclosable': state.unclosable,
            })}
          >
            ${headerTemplate(state.bot.props.name, state.bot.props.avatar)}
            <div
              class=${classMap({
                tkc__log: true,
              })}
            >
              ${state.history.map((item) => chatItemTemplate(item))}
            </div>
            ${suggestionsTemplate(state.bot.props.suggestions)}
            ${textareaTemplate(state.pending, state.showScrollDown)}
            ${state.bot?.props?.unbranded ? '' : brandingTemplate}
          </div>
          ${state.inline
            ? ''
            : toggleTemplate(state.open === 'true', state.unclosable)}
        `
      : html``
  }
}
