import { Command } from '../services/command-registry'

/**
 * Command to change language
 */
export class SetLocaleCommand implements Command<string> {
  name = 'set_locale'

  // Supported locales - can be configured
  private supportedLocales = ['en', 'it', 'es', 'fr', 'de', 'pt']

  constructor(private changeLanguage: (locale: string) => Promise<void>) {}

  validate(locale?: string): boolean {
    return typeof locale === 'string' && locale.length >= 2
  }

  canExecute(locale?: string): boolean {
    if (!locale) return false
    return this.supportedLocales.includes(locale.toLowerCase())
  }

  async execute(locale: string): Promise<void> {
    await this.changeLanguage(locale)
  }

  /**
   * Add supported locale
   */
  addSupportedLocale(locale: string): void {
    if (!this.supportedLocales.includes(locale)) {
      this.supportedLocales.push(locale)
    }
  }

  /**
   * Get supported locales
   */
  getSupportedLocales(): string[] {
    return [...this.supportedLocales]
  }
}
