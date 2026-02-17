# Tolki Chat Web Component

A customizable, embeddable chat widget built with [Lit](https://lit.dev/) that connects to the Tolki AI platform.

## Installation

### Via Script Tag

```html
<script src="https://cdn.tolki.ai/chat.js"></script>
```

### Via NPM

```bash
npm install tolki-chat-wc
```

## Quick Start

### 1. Create a Bot

1. Go to [Tolki Studio](https://studio.tolki.ai)
2. Sign up or log in to your account
3. Create a new bot and configure it
4. Navigate to the **Embed** section
5. Copy the embed code - it contains your `bot` UUID

### 2. Add to Your Website

Add the component to your HTML:

```html
<script src="https://cdn.tolki.ai/chat.js"></script>
<tolki-chat bot="YOUR_BOT_UUID"></tolki-chat>
```

Replace `YOUR_BOT_UUID` with the UUID from your embed code (e.g., `9da7b9b4-2fb3-4189-a5d2-391f509f5286`).

The `bot` attribute is required and must be a valid UUID from Tolki Studio.

## Attributes

### Layout & Positioning

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `position` | `'inline' \| 'left' \| 'center' \| 'right'` | `'right'` | Widget position. Use `inline` to embed directly in the page flow. |
| `window-size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'sm'` | Chat window size (400px, 540px, 768px, 860px). |
| `toggle-size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Toggle button size (48px, 60px, 72px). |
| `margin` | `number \| [number, number]` | `20` | Margin in pixels. Single value for all sides, or `[x, y]` for horizontal/vertical. |
| `default-open` | `boolean` | `true` | Whether the chat opens automatically on page load (desktop only). |
| `expandable` | `boolean` | `true` | Allow the chat window to be expanded. |
| `unclosable` | `boolean` | `false` | Prevent the chat from being closed. |

### Appearance

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `dark` | `'auto' \| 'light' \| 'dark'` | `'auto'` | Dark mode setting. `auto` follows system preference. |
| `rounded` | `'none' \| 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'xl'` | Border radius (0px, 5px, 10px, 15px, 20px, 25px). |
| `avatar` | `string` | `null` | URL for the bot avatar image. |
| `backdrop-color` | `hex color` | `null` | Backdrop overlay color (e.g., `#000000`). |
| `backdrop-opacity` | `number` | `0.5` | Backdrop opacity (0-1). |
| `backdrop-blur` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Backdrop blur intensity. |

### Colors

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `toggle-background` | `hex color` | `#001ccb` | Toggle button background color. |
| `toggle-content` | `hex color` | auto | Toggle button icon/text color. Auto-calculated for contrast if not set. |
| `message-background` | `hex color` | `#001ccb` | User message bubble background color. |
| `message-content` | `hex color` | auto | User message text color. Auto-calculated for contrast if not set. |

### Content

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | `string \| I18nString` | `''` | Bot display name shown in the header. |
| `message-placeholder` | `string \| I18nString` | `'Ask anything'` | Input field placeholder text. |
| `toggle-placeholder` | `string \| I18nString` | `''` | Text shown next to the toggle button. |
| `welcome-message` | `string \| I18nString` | `null` | Initial welcome message displayed to users. |
| `suggestions` | `string[] \| I18nArray` | `[]` | Quick reply suggestions. Supports commands with `[command]` syntax. |
| `toasts` | `string[] \| I18nArray` | `[]` | Toast notifications to display. |

### Internationalization

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `lang` | `string` | `'en'` | Current language code. |
| `locales` | `string[]` | `['en', 'it', 'es', 'fr', 'de', 'pt']` | Available language codes. |

### PRO Features

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `icon` | `string` | `null` | Custom toggle button icon URL (PRO only). |
| `unbranded` | `boolean` | `false` | Remove Tolki branding (PRO only). |

## Internationalized Strings

Content attributes support internationalization. You can provide:

**Simple string:**
```html
<tolki-chat name="Support Bot"></tolki-chat>
```

**JSON object with language keys:**
```html
<tolki-chat name='{"en": "Support Bot", "it": "Bot di Supporto", "es": "Bot de Soporte"}'></tolki-chat>
```

## Suggestions with Commands

Suggestions can trigger built-in commands using bracket syntax:

```html
<tolki-chat suggestions='["How can I help?", "View Cart [show_cart]", "[show_orders]"]'></tolki-chat>
```

Available commands:
- `[show_cart]` - Display the shopping cart
- `[show_orders]` - Display order history
- `[set_locale xx]` - Change language (e.g., `[set_locale it]`)

## E-commerce Integration

For e-commerce sites, expose cart and order data on `window.tolki`:

```javascript
window.tolki = {
  cart: {
    items: [
      {
        product_url: 'https://example.com/product/shoe',
        image_url: 'https://example.com/images/shoe.jpg',
        title: 'Running Shoe',
        price: '$99.00',
        quantity: 1,
        subtotal: '$99.00'
      }
    ],
    total: '$99.00',
    subtotal: '$99.00',
    item_count: 1
  },
  orders: {
    pending: [
      {
        order_id: 12345,
        order_number: '12345',
        order_url: 'https://example.com/orders/12345',
        total: '$99.00',
        date_created: '2024-01-15 10:30:00',
        status: 'pending',
        status_label: 'Pending',
        items: [...],
        payment_method: 'Credit Card',
        shipping_method: 'Standard Shipping'
      }
    ]
  },
  links: {
    cart: 'https://example.com/cart',
    checkout: 'https://example.com/checkout',
    shop: 'https://example.com'
  }
};

// Notify the component when cart data is loaded
window.dispatchEvent(new CustomEvent('tolki:cart:loaded', {
  detail: { cart: window.tolki.cart }
}));
```

## Examples

### Basic Floating Widget

```html
<tolki-chat
  bot="your-bot-uuid"
  position="right"
  toggle-background="#3b82f6"
  name="Support"
></tolki-chat>
```

### Inline Embedded Chat

```html
<tolki-chat
  bot="your-bot-uuid"
  position="inline"
  window-size="lg"
></tolki-chat>
```

### Dark Mode with Custom Colors

```html
<tolki-chat
  bot="your-bot-uuid"
  dark="dark"
  toggle-background="#8b5cf6"
  message-background="#8b5cf6"
  rounded="lg"
></tolki-chat>
```

### Multi-language Setup

```html
<tolki-chat
  bot="your-bot-uuid"
  lang="it"
  name='{"en": "Assistant", "it": "Assistente", "es": "Asistente"}'
  welcome-message='{"en": "Hello! How can I help?", "it": "Ciao! Come posso aiutarti?", "es": "Hola! Como puedo ayudarte?"}'
></tolki-chat>
```

### With Backdrop Overlay

```html
<tolki-chat
  bot="your-bot-uuid"
  backdrop-color="#000000"
  backdrop-opacity="0.5"
  backdrop-blur="md"
></tolki-chat>
```

## Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
npm install
```

### Commands

```bash
# Build the component
npm run build

# Build with watch mode
npm run build:watch

# Start development server
npm run dev

# Run linter
npx eslint .

# Format code
npx prettier --write .

# Type check
npx tsc --noEmit
```

### Project Structure

```
src/
├── components/
│   └── tolki-chat/
│       ├── tolki-chat.ts      # Main component
│       ├── styles/            # SCSS styles
│       └── templates/         # Lit HTML templates
├── services/
│   ├── api.ts                 # API client
│   ├── bot.ts                 # Bot configuration
│   ├── history-manager.ts     # Chat history
│   └── ...                    # Other services
├── types/                     # TypeScript types
├── utils/                     # Utility functions
└── locales/                   # i18n translations
```

## Browser Support

- Chrome 90+
- Firefox 90+
- Safari 14+
- Edge 90+

## License

This project is dual-licensed:

- **AGPL-3.0** for open source use - see [LICENSE](LICENSE)
- **Commercial License** available for proprietary use - contact [info@tolki.ai](mailto:info@tolki.ai)

If you modify this software and make it available over a network, you must release your modifications under AGPL-3.0. For commercial licensing without this requirement, contact us.
