export enum MarkdownResponseLevel {
  default = 'default',
  info = 'info',
  error = 'error',
}

export enum ItemType {
  action = 'action',
  card = 'card',
  markdown = 'markdown',
  product = 'product',
  thinking = 'thinking',
  userInput = 'userInput',
  cart = 'show_cart',
  orders = 'show_orders',
  cartNotification = 'cart_notification',
}

export interface Action {
  label: string
  primary?: boolean
  command: string // Command name that will be mapped to a function
  data?: { [key: string]: unknown } // Optional data to pass to the command
  templateKey?: string // Template key for translatable labels
  templateParams?: { [key: string]: unknown } // Parameters for template
}

export interface ActionResponse {
  type: ItemType.action
  text: string
  actions: Action[]
  data?: { [key: string]: unknown }
  translate?: boolean // Whether the text should be translated instead of displayed
  templateKey?: string // Template key for translatable text
  templateParams?: { [key: string]: unknown } // Parameters for template
}

export interface CartResponse {
  type: ItemType.cart
}

export interface OrdersResponse {
  type: ItemType.orders
}

export interface CardResponse {
  type: ItemType.card
  image: string
  name: string
  description?: string
  data?: { [key: string]: unknown }
}

export interface MarkdownResponse {
  type: ItemType.markdown
  content: string
  caption?: string
  level?: MarkdownResponseLevel
  locale?: string // For setLocale messages
  translate?: boolean // Whether content should be translated instead of displayed
  templateKey?: string // Template key for translatable content
  templateParams?: { [key: string]: unknown } // Parameters for template
  propKey?: string // Key to read dynamic i18n content from window.tolki.props
}

export interface ProductResponse {
  type: ItemType.product
  image: string
  name: string
  url: string
  description?: string
  price?: string
  data?: { [key: string]: unknown }
}

export interface ThinkingResponse {
  type: ItemType.thinking
}

export interface UserInput {
  type: ItemType.userInput
  content: string
}

export interface CartNotificationResponse {
  type: ItemType.cartNotification
  // This type is dynamically rendered and not persisted in history
}

export type Item =
  | ActionResponse
  | CardResponse
  | MarkdownResponse
  | ProductResponse
  | CartResponse
  | OrdersResponse
  | ThinkingResponse
  | UserInput
  | CartNotificationResponse
