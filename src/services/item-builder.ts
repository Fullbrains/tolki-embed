import '../types/global' // Import global types for window.tolki
import {
  Action,
  ActionResponse,
  CartResponse,
  ItemType,
  MarkdownResponse,
  MarkdownResponseLevel,
  OrdersResponse,
  ThinkingResponse,
  UserInput,
} from '../types/item'
import { msg } from '@lit/localize'

export class ItemBuilder {
  static thinking(): ThinkingResponse {
    return {
      type: ItemType.thinking,
    }
  }

  static action(
    message: string,
    actions?: Action[],
    data?: { [key: string]: unknown }
  ): ActionResponse {
    return {
      type: ItemType.action,
      text: message,
      actions,
      data,
    }
  }

  static userInput(message: string): UserInput | undefined {
    if (message && message.trim()) {
      return {
        type: ItemType.userInput,
        content: message.trim(),
      }
    }
    return undefined
  }

  static error(): MarkdownResponse {
    return {
      type: ItemType.markdown,
      content: msg('Sorry, there was an error processing your message.'),
      level: MarkdownResponseLevel.error,
    }
  }

  static markdown(
    message: string,
    level: MarkdownResponseLevel = MarkdownResponseLevel.default
  ): MarkdownResponse | undefined {
    if (message && message.trim()) {
      return {
        type: ItemType.markdown,
        content: message.trim(),
        level,
      }
    }
    return undefined
  }

  static assistant(message: string): MarkdownResponse | undefined {
    return ItemBuilder.markdown(message, MarkdownResponseLevel.default)
  }

  static info(message: string): MarkdownResponse | undefined {
    return ItemBuilder.markdown(message, MarkdownResponseLevel.info)
  }

  static cart(): CartResponse {
    return {
      type: ItemType.cart,
    }
  }

  static orders(): OrdersResponse {
    return {
      type: ItemType.orders,
    }
  }

  static getLanguageName(locale: string): string {
    const languageNames: { [key: string]: string } = {
      en: 'English',
      it: 'Italiano',
      es: 'Español',
      fr: 'Français',
      de: 'Deutsch',
    }
    return languageNames[locale] || locale
  }

  static setLocale(
    locale: string,
    showMessage: boolean = true
  ): MarkdownResponse {
    const languageName = ItemBuilder.getLanguageName(locale)

    // Se non vogliamo mostrare il messaggio, restituisci un messaggio vuoto con locale
    if (!showMessage) {

      return {
        type: ItemType.markdown,
        content: '',
        level: MarkdownResponseLevel.info,
        locale: locale,
      }
    }

    // Messaggi localizzati per ogni lingua
    const localizedMessages: { [key: string]: string } = {
      en: `Language set to ${languageName}`,
      it: `Lingua impostata su ${languageName}`,
      es: `Idioma establecido en ${languageName}`,
      fr: `Langue définie sur ${languageName}`,
      de: `Sprache auf ${languageName} eingestellt`,
    }

    const messageText = localizedMessages[locale] || localizedMessages['en']
    const message = ItemBuilder.info(messageText)
    if (message) {
      message.locale = locale
    }
    return message
  }
}
