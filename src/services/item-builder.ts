import '../types/global' // Import global types for window.tolki
import {
  Action,
  ActionResponse,
  CartResponse,
  CartNotificationResponse,
  ItemType,
  MarkdownResponse,
  MarkdownResponseLevel,
  OrdersResponse,
  ThinkingResponse,
  UserInput,
} from '../types/item'

export class ItemBuilder {
  static thinking(): ThinkingResponse {
    return {
      type: ItemType.thinking,
    }
  }

  static action(
    message: string,
    actions?: Action[],
    data?: { [key: string]: unknown },
    translate: boolean = true,
    templateData?: {
      templateKey?: string
      templateParams?: { [key: string]: unknown }
    }
  ): ActionResponse {
    const result: ActionResponse = {
      type: ItemType.action,
      text: message,
      actions,
      data,
      translate,
    }

    if (templateData) {
      result.templateKey = templateData.templateKey
      result.templateParams = templateData.templateParams
    }

    return result
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
    return ItemBuilder.markdown(
      'Sorry, there was an error processing your message.',
      MarkdownResponseLevel.error,
      true
    )
  }

  static markdown(
    message: string,
    level: MarkdownResponseLevel = MarkdownResponseLevel.default,
    translate: boolean = false
  ): MarkdownResponse | undefined {
    if (message && message.trim()) {
      const result: MarkdownResponse = {
        type: ItemType.markdown,
        content: message.trim(),
        level,
      }
      if (translate) {
        result.translate = translate
      }
      return result
    }
    return undefined
  }

  static assistant(message: string): MarkdownResponse | undefined {
    return ItemBuilder.markdown(message, MarkdownResponseLevel.default)
  }

  static info(
    message: string,
    templateData?: {
      templateKey?: string
      templateParams?: { [key: string]: unknown }
    }
  ): MarkdownResponse | undefined {
    const result = ItemBuilder.markdown(
      message,
      MarkdownResponseLevel.info,
      true
    )
    if (result && templateData) {
      result.templateKey = templateData.templateKey
      result.templateParams = templateData.templateParams
    }
    return result
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

  static cartNotification(): CartNotificationResponse {
    return {
      type: ItemType.cartNotification,
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
}
