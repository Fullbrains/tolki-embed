// Lit Imports
import { property, State, StateController, storage } from '@lit-app/state'
import { html, LitElement } from 'lit'
import { customElement, query } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'

// Libs
import autosize from 'autosize'
import {
  isSupported as isVirtualKeyboardSupported,
  subscribe as subscribeVirtualKeyboardVisibility,
} from 'on-screen-keyboard-detector'

// Okuda Colors
import eigen from '@fullbrains/okuda/colors/eigen'
import cobalt from '@fullbrains/okuda/colors/cobalt'
import cool from '@fullbrains/okuda/colors/cool'

// Styles
import styles from './tolki-chat.scss'

// Tolki
import { decrypt, encrypt, validateUUID } from '../utils/encryption'
import {
  TolkiBot,
  TolkiBotInitResult,
  TolkiBotStatus,
} from '../tolki-bot/tolki-bot'
import {
  assistantMessage,
  errorMessage,
  thinkingMessage,
  TOLKI_SORRY_MESSAGE,
  TolkiChatMessage,
  TolkiChatMessageRole,
  userMessage,
} from './tolki-chat-message'
import {
  TolkiApi,
  TolkiChatApiResponse,
  TolkiChatApiResponseStatus,
} from '../tolki-api/tolki-api'

// Templates
import { header } from '../templates/header'
import { branding } from '../templates/branding'
import { textarea } from '../templates/textarea'
import { toggle } from '../templates/toggle'
import { message } from '../templates/message'
import { isDark, lighten } from '../utils/color'

const TOKEN_LIMIT = 1000
const SPECIAL_TOKEN_BUFFER = 10
const TOLKI_CHAT: string = `tolki-chat`
const TOLKI_PREFIX: string = `tolki`

class TolkiChatState extends State {
  @storage({ key: 'chat', prefix: TOLKI_PREFIX })
  @property({ value: '' })
  chat: string

  @storage({ key: 'open', prefix: TOLKI_PREFIX })
  @property({ value: '' })
  open: string

  @storage({ key: 'history', prefix: TOLKI_PREFIX })
  @property({ value: '' })
  history: string

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
  messages: TolkiChatMessage[]
}

const state = new TolkiChatState()

@customElement(TOLKI_CHAT)
export class TolkiChat extends LitElement {
  static styles = styles
  totalTokens: number = 0
  stateController = new StateController(this, state)

  @query('.tkc__close') close: HTMLButtonElement
  @query('.tkc__log') log: HTMLDivElement
  @query('.tkc__scroll-down') scrollDown: HTMLButtonElement
  @query('.tkc__send') send: HTMLButtonElement
  @query('.tkc__textarea') textarea: HTMLTextAreaElement
  @query('.tkc__toggle') toggle: HTMLButtonElement

  constructor() {
    super()

    TolkiBot.init()
      .then((bot) => {
        state.bot = bot

        if (!validateUUID(state.chat)) {
          state.chat = window.crypto.randomUUID()
        }

        if (state.history) {
          const password = state.chat + state.bot.uuid
          const encrypted = JSON.parse(state.history)
          decrypt(encrypted.ciphertext, encrypted.iv, password).then(
            (decrypted: string) => {
              if (decrypted && typeof decrypted === 'string') {
                const decryptedAny = JSON.parse(decrypted)
                if (Array.isArray(decryptedAny)) {
                  state.messages = decryptedAny as TolkiChatMessage[]
                }
              }
            }
          )
        }

        this.scrollToBottom()
      })
      .catch((bot) => {
        state.bot = bot
        console.error('Tolki: Bot not initialized:', bot)
      })

    if (isVirtualKeyboardSupported()) {
      subscribeVirtualKeyboardVisibility((visibility) => {
        state.virtualKeyboardVisibility = visibility
      })
    }
  }

  get colorVariables() {
    const styles = state.bot.props.styles?.chat
    const map: { [key: string]: string } = {}
    if (styles.button?.color) {
      map['toggle-default-background'] = styles.button.color
      map['toggle-hover-background'] = lighten(styles.button.color, 30)
      map['toggle-dots-background'] = isDark(styles.button.color)
        ? '#fff'
        : eigen['eigen-45']
    } else {
      map['toggle-default-background'] = cobalt['cobalt-41']
      map['toggle-hover-background'] = cobalt['cobalt-35']
      map['toggle-dots-background'] = cool['cool-14']
    }
    if (styles.bubble?.color) {
      map['bubble-background'] = styles.bubble.color
      map['bubble-color'] = isDark(styles.bubble.color)
        ? '#fff'
        : eigen['eigen-45']
    } else {
      map['bubble-background'] = cobalt['cobalt-35']
      map['bubble-color'] = '#fff'
    }

    return Object.keys(map)
      .map((key: string) => {
        return '--' + key + ':' + map[key]
      })
      .join(';')
  }

  estimateTokens(message: string) {
    return message.split(/\s+/).length + SPECIAL_TOKEN_BUFFER
  }

  toggleWindow() {
    state.open = state.open === 'true' ? '' : 'true'
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

  saveHistory() {
    const serializedMessages = JSON.stringify(
      state.messages.filter((message: TolkiChatMessage) => {
        return (
          message.role === TolkiChatMessageRole.assistant ||
          message.role === TolkiChatMessageRole.user ||
          message.role === TolkiChatMessageRole.info
        )
      })
    )
    encrypt(serializedMessages, state.chat + state.bot.uuid).then(
      (res: { [key: string]: string }) => {
        console.log(res)
        state.history = JSON.stringify(res)
      }
    )
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

    this.totalTokens += this.estimateTokens(message)
    state.messages.push(userMessage(message))
    const filteredMessages: TolkiChatMessage[] = state.messages.filter(
      (msg) => msg.role !== TolkiChatMessageRole.thinking
    )
    state.messages = [...filteredMessages]
    this.saveHistory()
    const lastMessage: TolkiChatMessage =
      filteredMessages[filteredMessages.length - 1]
    filteredMessages.push(thinkingMessage)
    state.messages = [...filteredMessages]
    this.afterSend()

    try {
      TolkiApi.chat(state.chat, state.bot.uuid, lastMessage.content)
        .then(({ data }: TolkiChatApiResponse) => {
          const content: string =
            (data as { [key: string]: string }).content || TOLKI_SORRY_MESSAGE
          this.totalTokens += this.estimateTokens(content)
          state.messages.push(assistantMessage(content))
          state.messages = state.messages.filter(
            (msg) => msg.role !== TolkiChatMessageRole.thinking
          )
          this.saveHistory()
          this.afterReceive()
        })
        .catch(({ status, data, response, error }: TolkiChatApiResponse) => {
          if (
            status === TolkiChatApiResponseStatus.error ||
            status === TolkiChatApiResponseStatus.notOk
          ) {
            state.messages.push(errorMessage)
            state.messages = state.messages.filter(
              (msg) => msg.role !== TolkiChatMessageRole.thinking
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

    while (this.totalTokens > TOKEN_LIMIT && state.messages.length > 0) {
      const removedMessage = state.messages.shift()
      this.totalTokens -= this.estimateTokens(removedMessage.content)
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
          </style>
          <div
            class=${classMap({
              tkc__window: true,
              'tkc__window--open': state.open === 'true',
            })}
          >
            ${header(state.bot.props.name, state.bot.props.avatar)}
            <div
              class=${classMap({
                tkc__log: true,
              })}
            >
              ${state.messages.map((msg) => message(msg.content, msg.role))}
            </div>
            ${textarea(state.pending, state.showScrollDown)} ${branding}
          </div>
          ${toggle(state.open === 'true')}
        `
      : html``
  }
}

const tolkiElement = document.createElement(TOLKI_CHAT)
document.body.appendChild(tolkiElement)
