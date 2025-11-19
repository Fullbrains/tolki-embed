/**
 * Repository for managing bot-specific settings in localStorage
 * Provides type-safe access to persisted settings
 */
export class SettingsRepository {
  private readonly storageKey: string
  private cache: { [botId: string]: { [key: string]: unknown } } = {}

  constructor(storageKey: string = 'tolki-settings') {
    this.storageKey = storageKey
    this.loadFromStorage()
  }

  /**
   * Load settings from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        this.cache = JSON.parse(stored)
      }
    } catch (error) {
      console.error('[Tolki] Failed to load settings from localStorage:', error)
      this.cache = {}
    }
  }

  /**
   * Save settings to localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.cache))
    } catch (error) {
      console.error('[Tolki] Failed to save settings to localStorage:', error)
    }
  }

  /**
   * Get a setting value for a specific bot
   */
  get<T = unknown>(botId: string, key: string): T | undefined {
    if (!botId) return undefined
    return this.cache[botId]?.[key] as T | undefined
  }

  /**
   * Set a setting value for a specific bot
   */
  set<T = unknown>(botId: string, key: string, value: T): void {
    if (!botId) return

    if (!this.cache[botId]) {
      this.cache[botId] = {}
    }

    this.cache[botId][key] = value
    this.saveToStorage()
  }

  /**
   * Get all settings for a bot
   */
  getAll(botId: string): { [key: string]: unknown } | undefined {
    if (!botId) return undefined
    return this.cache[botId] ? { ...this.cache[botId] } : undefined
  }

  /**
   * Clear all settings for a specific bot
   */
  clear(botId: string): void {
    if (!botId) return

    delete this.cache[botId]
    this.saveToStorage()
  }

  /**
   * Clear all settings for all bots
   */
  clearAll(): void {
    this.cache = {}
    this.saveToStorage()
  }

  /**
   * Check if a setting exists
   */
  has(botId: string, key: string): boolean {
    if (!botId) return false
    return this.cache[botId]?.[key] !== undefined
  }

  /**
   * Get the raw storage key (for debugging)
   */
  getStorageKey(): string {
    return this.storageKey
  }
}
