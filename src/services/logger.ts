/**
 * Log levels
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  enabled: boolean
  level: LogLevel
  prefix: string
}

/**
 * Centralized logging service
 * Can be configured to disable logging in production or integrate with error tracking services
 */
export class Logger {
  private static config: LoggerConfig = {
    enabled: true,
    level: LogLevel.INFO,
    prefix: '[Tolki]',
  }

  /**
   * Configure the logger
   */
  static configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Log an error
   */
  static error(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(`${this.config.prefix} ${message}`, ...args)
      // Future: Add integration with error tracking service here
      // if (window.Sentry) {
      //   window.Sentry.captureException(new Error(message), {
      //     tags: { component: 'tolki-chat' },
      //     extra: { args }
      //   })
      // }
    }
  }

  /**
   * Log a warning
   */
  static warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(`${this.config.prefix} ${message}`, ...args)
    }
  }

  /**
   * Log info
   */
  static info(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(`${this.config.prefix} ${message}`, ...args)
    }
  }

  /**
   * Log debug info
   */
  static debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(`${this.config.prefix} ${message}`, ...args)
    }
  }

  /**
   * Check if should log based on current level
   */
  private static shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false

    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG]
    const currentLevelIndex = levels.indexOf(this.config.level)
    const requestedLevelIndex = levels.indexOf(level)

    return requestedLevelIndex <= currentLevelIndex
  }

  /**
   * Disable all logging
   */
  static disable(): void {
    this.config.enabled = false
  }

  /**
   * Enable logging
   */
  static enable(): void {
    this.config.enabled = true
  }
}
