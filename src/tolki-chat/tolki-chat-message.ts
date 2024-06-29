export enum TolkiChatMessageRole {
  user = 'user',
  assistant = 'assistant',
  thinking = 'thinking',
  info = 'info',
  error = 'error',
}

export interface TolkiChatMessage {
  role: TolkiChatMessageRole
  content?: string
}

export const TOLKI_SORRY_MESSAGE: string = "Sorry, I didn't understand that."
export const TOLKI_ERROR_MESSAGE: string =
  'Sorry, there was an error processing your message.'

export const thinkingMessage: TolkiChatMessage = {
  role: TolkiChatMessageRole.thinking,
}

export const userMessage = (message: string): TolkiChatMessage => {
  if (message && message.trim()) {
    return {
      role: TolkiChatMessageRole.user,
      content: message.trim(),
    }
  }
}

export const errorMessage: TolkiChatMessage = {
  role: TolkiChatMessageRole.error,
  content: TOLKI_ERROR_MESSAGE,
}

export const assistantMessage = (message: string): TolkiChatMessage => {
  if (message && message.trim()) {
    return {
      role: TolkiChatMessageRole.assistant,
      content: message.trim(),
    }
  }
}

export const infoMessage = (message: string): TolkiChatMessage => {
  if (message && message.trim()) {
    return {
      role: TolkiChatMessageRole.info,
      content: message.trim(),
    }
  }
}
