import { Logger } from './logger'

/**
 * Base interface for commands
 */
export interface Command<T = void> {
  name: string
  validate(params?: T): boolean
  canExecute(params?: T): boolean
  execute(params?: T): void | Promise<void>
}

/**
 * Command middleware for cross-cutting concerns
 */
export interface CommandMiddleware {
  before?(command: string, params?: unknown): void
  after?(command: string): void
  error?(command: string, error: Error): void
}

/**
 * Registry for managing commands with middleware support
 */
export class CommandRegistry {
  private commands = new Map<string, Command>()
  private middlewares: CommandMiddleware[] = []

  /**
   * Register a command
   */
  register(command: Command): void {
    if (this.commands.has(command.name)) {
      Logger.warn(`Command already registered: ${command.name}. Overwriting.`)
    }
    this.commands.set(command.name, command)
  }

  /**
   * Register multiple commands
   */
  registerMany(commands: Command[]): void {
    commands.forEach((cmd) => this.register(cmd))
  }

  /**
   * Add middleware
   */
  use(middleware: CommandMiddleware): void {
    this.middlewares.push(middleware)
  }

  /**
   * Execute a command by name
   */
  async execute(name: string, params?: unknown): Promise<void> {
    const command = this.commands.get(name)

    if (!command) {
      const error = new Error(`Unknown command: ${name}`)
      this.middlewares.forEach((m) => m.error?.(name, error))
      throw error
    }

    // Validate params (using type assertion since we can't preserve generic type through Map)
    if (!command.validate(params as any)) {
      const error = new Error(`Invalid params for command: ${name}`)
      this.middlewares.forEach((m) => m.error?.(name, error))
      throw error
    }

    // Check if can execute
    if (!command.canExecute(params as any)) {
      Logger.debug(`Command cannot be executed: ${name}`)
      return // Silently skip if conditions not met
    }

    try {
      // Before middleware
      this.middlewares.forEach((m) => m.before?.(name, params))

      // Execute command
      await command.execute(params as any)

      // After middleware
      this.middlewares.forEach((m) => m.after?.(name))
    } catch (error) {
      // Error middleware
      this.middlewares.forEach((m) =>
        m.error?.(name, error instanceof Error ? error : new Error(String(error)))
      )
      throw error
    }
  }

  /**
   * Check if command exists
   */
  has(name: string): boolean {
    return this.commands.has(name)
  }

  /**
   * Get command by name
   */
  get(name: string): Command | undefined {
    return this.commands.get(name)
  }

  /**
   * Unregister a command
   */
  unregister(name: string): boolean {
    return this.commands.delete(name)
  }

  /**
   * Get all registered command names
   */
  getCommands(): string[] {
    return Array.from(this.commands.keys())
  }

  /**
   * Clear all commands
   */
  clear(): void {
    this.commands.clear()
  }
}

/**
 * Logging middleware for debugging
 */
export class LoggingMiddleware implements CommandMiddleware {
  before(command: string, params?: unknown): void {
    Logger.debug(`Executing command: ${command}`, params)
  }

  error(command: string, error: Error): void {
    Logger.error(`Command failed: ${command}`, error)
  }
}

/**
 * Analytics middleware (example)
 */
export class AnalyticsMiddleware implements CommandMiddleware {
  after(command: string): void {
    // Send analytics event
    if (typeof window !== 'undefined' && (window as any).analytics) {
      ;(window as any).analytics?.track?.('command_executed', { command })
    }
  }
}
