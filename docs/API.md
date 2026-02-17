# Tolki Embed API Reference

This document describes the internal API architecture and data types used by the Tolki Chat Web Component.

## Table of Contents

- [Architecture](#architecture)
- [REST API Endpoints](#rest-api-endpoints)
- [Data Types](#data-types)
- [Response Types](#response-types)
- [Events](#events)
- [Global API](#global-api)
- [Commands](#commands)

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Host Page                             │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │              <tolki-chat>                        │   │
│  │                                                  │   │
│  │  ┌──────────────┐    ┌──────────────────────┐  │   │
│  │  │   Bot        │    │    TolkiChat         │  │   │
│  │  │   Service    │───▶│    Component         │  │   │
│  │  └──────────────┘    └──────────────────────┘  │   │
│  │         │                      │               │   │
│  │         ▼                      ▼               │   │
│  │  ┌──────────────┐    ┌──────────────────────┐  │   │
│  │  │   Api        │    │    HistoryManager    │  │   │
│  │  │   Service    │    │                      │  │   │
│  │  └──────────────┘    └──────────────────────┘  │   │
│  │         │                      │               │   │
│  └─────────┼──────────────────────┼───────────────┘   │
│            │                      │                    │
│            ▼                      ▼                    │
│     ┌─────────────┐       ┌─────────────┐             │
│     │ Tolki API   │       │ localStorage│             │
│     └─────────────┘       └─────────────┘             │
│                                                        │
│     window.tolki (cart, orders, links)                │
└────────────────────────────────────────────────────────┘
```

### Services

| Service | Purpose |
|---------|---------|
| `Api` | HTTP client for Tolki backend |
| `Bot` | Bot initialization and configuration |
| `HistoryManager` | Chat history state management |
| `EventBus` | Internal event communication |
| `PropsManager` | Props merging (backend + attributes) |
| `CommandRegistry` | Command pattern implementation |

### Data Flow

1. **Initialization**
   - Component reads `bot` attribute
   - Fetches bot settings from API
   - Loads chat history from localStorage
   - Renders initial state

2. **Sending Message**
   - User types message
   - Message sent to API
   - Response items added to history
   - History persisted to localStorage
   - UI updated

3. **E-commerce Integration**
   - Host page sets `window.tolki.cart`
   - Dispatches `tolki:cart:loaded` event
   - Component renders cart notification
   - User can view cart/orders via commands

---

## REST API Endpoints

The component communicates with two backend services:

| Service | Base URL | Purpose |
|---------|----------|---------|
| Chat API | `https://api.tolki.ai/chat/v1/embed/` | Standard chat functionality |
| Brain API | `https://brain.tolki.ai/v1/embed/` | ADK-enabled bots |

### GET /settings

Retrieves bot configuration and settings.

**Endpoint:**
```
GET https://api.tolki.ai/chat/v1/embed/{bot_uuid}/settings/{lang}
```

**Parameters:**

| Parameter | Type | Location | Description |
|-----------|------|----------|-------------|
| `bot_uuid` | `string` | path | Bot UUID (required) |
| `lang` | `string` | path | Language code (e.g., `en`, `it`) |

**Response:** `BotProps`

```json
{
  "name": "Support Bot",
  "avatar": "https://example.com/avatar.png",
  "defaultOpen": true,
  "expandable": true,
  "unclosable": false,
  "welcomeMessage": "Hello! How can I help?",
  "suggestions": ["How do I...?", "Tell me about..."],
  "messagePlaceholder": "Ask anything",
  "lang": "en",
  "locales": ["en", "it", "es"],
  "styles": {
    "position": "right",
    "toggle": {
      "size": "md",
      "background": "#001ccb"
    }
  }
}
```

**Error Responses:**

| Status | Description | BotStatus |
|--------|-------------|-----------|
| 200 | Success | `ok` |
| 403 | Bot is inactive | `inactive` |
| 404 | Bot not found | `notFound` |

---

### POST /message

Sends a user message and receives bot response.

**Endpoint:**
```
POST https://api.tolki.ai/chat/v1/embed/{bot_uuid}/chat/{chat_uuid}/message
```

For ADK-enabled bots:
```
POST https://brain.tolki.ai/v1/embed/{bot_uuid}/chat/{chat_uuid}/message
```

**Parameters:**

| Parameter | Type | Location | Description |
|-----------|------|----------|-------------|
| `bot_uuid` | `string` | path | Bot UUID (required) |
| `chat_uuid` | `string` | path | Chat session UUID (required) |

**Request Body:**

```json
{
  "message": "Hello, I need help with..."
}
```

**Response:** `Item[]`

The response is an array of items that can be rendered in the chat. See [Response Types](#response-types) for details.

```json
[
  {
    "type": "markdown",
    "content": "Hello! I'd be happy to help you.",
    "level": "default"
  },
  {
    "type": "product",
    "name": "Running Shoes",
    "image": "https://example.com/shoe.jpg",
    "url": "https://example.com/products/shoe",
    "price": "$99.00"
  }
]
```

---

## Data Types

### BotStatus

Bot initialization status.

```typescript
enum BotStatus {
  unknown = 'unknown'       // Initial state
  ok = 'ok'                 // Bot loaded successfully
  notInstalled = 'notInstalled'  // No bot UUID provided
  invalid = 'invalid'       // Invalid UUID format
  notFound = 'notFound'     // Bot not found (404)
  inactive = 'inactive'     // Bot is disabled (403)
}
```

### BotProps

Bot configuration returned from `/settings` endpoint.

```typescript
interface BotProps {
  // Identity
  name: I18nString              // Bot display name
  avatar?: string               // Avatar image URL

  // Behavior
  defaultOpen?: boolean         // Open chat on page load (default: true)
  expandable?: boolean          // Allow window expansion (default: true)
  unclosable?: boolean          // Prevent closing (default: false)

  // Content
  welcomeMessage?: I18nString   // Initial greeting
  suggestions?: I18nArray       // Quick reply suggestions
  toasts?: I18nArray            // Toast notifications
  messagePlaceholder?: I18nString  // Input placeholder
  togglePlaceholder?: I18nString   // Toggle button text

  // Internationalization
  lang?: string                 // Current language
  locales?: string[]            // Available languages

  // PRO Features (backend-controlled)
  icon?: string                 // Custom toggle icon URL
  unbranded?: boolean           // Remove Tolki branding

  // API Routing
  isAdk?: boolean               // Use Brain API instead of Chat API

  // Styles
  styles?: StylesConfig         // Visual configuration
}
```

### StylesConfig

Visual styling configuration.

```typescript
interface StylesConfig {
  // Global
  position?: 'inline' | 'left' | 'center' | 'right'
  margin?: number | [number, number]
  dark?: 'auto' | 'light' | 'dark'
  rounded?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'

  // Per Element
  toggle?: {
    size?: 'sm' | 'md' | 'lg'
    background?: HexColor
    foreground?: HexColor | null
  }
  window?: {
    size?: 'sm' | 'md' | 'lg' | 'xl'
  }
  message?: {
    background?: HexColor
    foreground?: HexColor | null
  }
  backdrop?: {
    color?: HexColor | null
    opacity?: number
    blur?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  }
}
```

### I18nString

Internationalized string type.

```typescript
type I18nString = string | { [lang: string]: string }

// Examples:
"Hello"                                    // Simple string
{ "en": "Hello", "it": "Ciao" }           // Multi-language
```

### I18nArray

Internationalized array type.

```typescript
type I18nArray = string[] | { [lang: string]: string }[]

// Examples:
["Option 1", "Option 2"]                   // Simple array
[{ "en": "Option 1", "it": "Opzione 1" }]  // Multi-language array
```

---

## Response Types

### ItemType

Enum of all possible response types.

```typescript
enum ItemType {
  action = 'action'           // Action buttons
  card = 'card'               // Info card
  markdown = 'markdown'       // Text content
  product = 'product'         // Product card
  thinking = 'thinking'       // Loading indicator
  userInput = 'userInput'     // User message
  cart = 'show_cart'          // Shopping cart
  orders = 'show_orders'      // Order history
  cartNotification = 'cart_notification'  // Cart notification
}
```

### MarkdownResponse

Standard text response with optional formatting.

```typescript
interface MarkdownResponse {
  type: 'markdown'
  content: string                          // Markdown content
  caption?: string                         // Optional caption
  level?: 'default' | 'info' | 'error'    // Visual level
  locale?: string                          // For language change messages
  translate?: boolean                      // Should content be translated
  templateKey?: string                     // Template key for i18n
  propKey?: string                         // Dynamic content from window.tolki.props
}
```

### ActionResponse

Interactive message with action buttons.

```typescript
interface ActionResponse {
  type: 'action'
  text: string                   // Message text
  actions: Action[]              // Available actions
  data?: Record<string, unknown> // Optional payload
  translate?: boolean            // Should text be translated
  templateKey?: string           // Template key for i18n
}

interface Action {
  label: string                  // Button label
  primary?: boolean              // Primary button style
  command: string                // Command to execute
  data?: Record<string, unknown> // Data passed to command
  templateKey?: string           // Template key for label
}
```

### ProductResponse

Product display card.

```typescript
interface ProductResponse {
  type: 'product'
  name: string                   // Product name
  image: string                  // Product image URL
  url: string                    // Product page URL
  description?: string           // Product description
  price?: string                 // Formatted price
  data?: Record<string, unknown> // Additional data
}
```

### CardResponse

Generic information card.

```typescript
interface CardResponse {
  type: 'card'
  name: string                   // Card title
  image: string                  // Card image URL
  description?: string           // Card description
  data?: Record<string, unknown> // Additional data
}
```

### CartResponse / OrdersResponse

Commands to display cart or orders.

```typescript
interface CartResponse {
  type: 'show_cart'
}

interface OrdersResponse {
  type: 'show_orders'
}
```

### UserInput

User message (outgoing).

```typescript
interface UserInput {
  type: 'userInput'
  content: string                // Message content
}
```

---

## Events

### Window Events

Events dispatched on the `window` object.

| Event | Description | Detail |
|-------|-------------|--------|
| `tolki:update` | Request component re-render | - |
| `tolki:cart:loaded` | Cart data has been loaded/updated | `{ cart: CartData }` |

**Example:**

```javascript
// Trigger component update
window.dispatchEvent(new Event('tolki:update'))

// Notify cart loaded
window.dispatchEvent(new CustomEvent('tolki:cart:loaded', {
  detail: { cart: window.tolki.cart }
}))
```

### EventBus

Internal event bus for component communication.

```typescript
import { eventBus } from './services/event-bus'

// Subscribe
const unsubscribe = eventBus.on('tolki:update', () => {
  console.log('Update triggered')
})

// Emit
eventBus.emit('tolki:update')

// Unsubscribe
unsubscribe()
```

---

## Global API

### window.tolki

Global object for integration with the host page.

```typescript
interface WindowTolki {
  // Cart data
  cart?: {
    items: CartItem[]
    total: string
    subtotal: string
    item_count: number
    status?: 'idle' | 'loading' | 'loaded' | 'error'
  }

  // Order history
  orders?: {
    [status: string]: Order[]  // e.g., 'pending', 'completed'
  }

  // Navigation links
  links?: {
    cart?: string
    checkout?: string
    shop?: string
    myaccount?: string
    orders?: string
    terms?: string
    [key: string]: string | undefined
  }

  // User data
  user?: Record<string, unknown> | null

  // Component state
  loaded?: boolean

  // Resolved props (read-only, set by component)
  props?: {
    welcomeMessage?: string
    name?: string
    [key: string]: string | undefined
  }

  // Methods
  update?: () => void  // Trigger component re-render
}
```

### CartItem

```typescript
interface CartItem {
  product_url: string
  image_url: string
  title: string
  price: string
  quantity: number
  subtotal: string
}
```

### Order

```typescript
interface Order {
  order_id?: number | string
  order_number?: string
  order_url?: string
  total?: string
  date_created?: string
  date_modified?: string
  date_completed?: string | null
  status?: string
  status_label?: string
  items?: OrderItem[]
  payment_method?: string
  shipping_method?: string
}

interface OrderItem {
  product_url?: string
  image_url?: string
  title?: string
  price?: string
  quantity?: number
}
```

### window.ActionCommands

Global command handlers for action buttons.

```typescript
interface ActionCommands {
  showCart: () => void
  showCartAndRemoveNotification: () => void
  resetChat: () => Promise<void>
  cancelAction: (data?: unknown, actionToRemove?: ActionResponse) => void
}
```

---

## Commands

Built-in commands that can be triggered from suggestions or actions.

| Command | Description | Parameters |
|---------|-------------|------------|
| `show_cart` | Display shopping cart | - |
| `show_orders` | Display order history | - |
| `set_locale {lang}` | Change language | `lang`: language code |
| `resetChat` | Start new conversation | - |
| `cancelAction` | Cancel/dismiss action | - |

**Usage in Suggestions:**

```html
<tolki-chat suggestions='[
  "View my cart [show_cart]",
  "[show_orders]",
  "Switch to Italian [set_locale it]"
]'></tolki-chat>
```
