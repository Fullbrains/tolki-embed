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
}

export interface Action {
  label: string
  primary?: boolean
  click: () => void
}

export interface ActionResponse {
  type: ItemType.action
  text: string
  actions: Action[]
  data?: { [key: string]: unknown }
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
}

export interface ProductResponse {
  type: ItemType.product
  image: string
  name: string
  Url: string
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

export type Item =
  | ActionResponse
  | CardResponse
  | MarkdownResponse
  | ProductResponse
  | CartResponse
  | OrdersResponse
  | ThinkingResponse
  | UserInput
