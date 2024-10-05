export enum TolkiChatMarkdownResponseLevel {
  default = 'default',
  info = 'info',
  error = 'error',
}

export enum TolkiChatItemType {
  action = 'action',
  card = 'card',
  markdown = 'markdown',
  product = 'product',
  thinking = 'thinking',
  userInput = 'userInput',
}

export type TolkiChatItem =
  | TolkiChatActionResponse
  | TolkiChatCardResponse
  | TolkiChatMarkdownResponse
  | TolkiChatProductResponse
  | TolkiChatThinkingResponse
  | TolkiChatUserInput

export interface TolkiChatActionResponse {
  type: TolkiChatItemType.action
  text: string
  data?: { [key: string]: unknown }
}

export interface TolkiChatCardResponse {
  type: TolkiChatItemType.card
  image: string
  name: string
  description?: string
  data?: { [key: string]: unknown }
}

export interface TolkiChatMarkdownResponse {
  type: TolkiChatItemType.markdown
  content: string
  level?: TolkiChatMarkdownResponseLevel
}

export interface TolkiChatProductResponse {
  type: TolkiChatItemType.product
  image: string
  name: string
  description?: string
  price?: string
  data?: { [key: string]: unknown }
}

export interface TolkiChatThinkingResponse {
  type: TolkiChatItemType.thinking
}

export interface TolkiChatUserInput {
  type: TolkiChatItemType.userInput
  content: string
}

export const TOLKI_ERROR_MESSAGE: string =
  'Sorry, there was an error processing your message.'

export const thinkingResponse: TolkiChatThinkingResponse = {
  type: TolkiChatItemType.thinking,
}

export const userInput = (message: string): TolkiChatUserInput => {
  if (message && message.trim()) {
    return {
      type: TolkiChatItemType.userInput,
      content: message.trim(),
    }
  }
}

export const errorResponse: TolkiChatMarkdownResponse = {
  type: TolkiChatItemType.markdown,
  content: TOLKI_ERROR_MESSAGE,
  level: TolkiChatMarkdownResponseLevel.error,
}

export const assistantResponse = (
  message: string
): TolkiChatMarkdownResponse => {
  if (message && message.trim()) {
    return {
      type: TolkiChatItemType.markdown,
      content: message.trim(),
      level: TolkiChatMarkdownResponseLevel.default,
    }
  }
}

export const infoResponse = (message: string): TolkiChatMarkdownResponse => {
  if (message && message.trim()) {
    return {
      type: TolkiChatItemType.markdown,
      content: message.trim(),
      level: TolkiChatMarkdownResponseLevel.info,
    }
  }
}
