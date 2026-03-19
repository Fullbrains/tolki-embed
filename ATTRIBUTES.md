# `<tolki-chat>` Attributes Reference

Complete guide to all HTML attributes available for the `<tolki-chat>` web component.

> **Note:** HTML attributes use kebab-case (e.g. `default-open`), which is internally converted to camelCase (e.g. `defaultOpen`). Attributes set via HTML have **highest priority** and override values coming from the backend.

---

## Table of Contents

- [bot](#bot) - Bot identifier
- [position](#position) - Widget positioning
- [window-size](#window-size) - Chat window size
- [toggle-size](#toggle-size) - Toggle button size
- [margin](#margin) - Widget margin
- [default-open](#default-open) - Auto-open on load
- [expandable](#expandable) - Window expandability
- [unclosable](#unclosable) - Prevent closing
- [dark](#dark) - Dark mode
- [rounded](#rounded) - Border radius
- [avatar](#avatar) - Bot avatar image
- [backdrop-color](#backdrop-color) - Overlay background color
- [backdrop-opacity](#backdrop-opacity) - Overlay opacity
- [backdrop-blur](#backdrop-blur) - Overlay blur
- [toggle-background](#toggle-background) - Toggle button background color
- [toggle-content](#toggle-content) - Toggle button content color
- [message-background](#message-background) - User message background color
- [message-content](#message-content) - User message text color
- [icon](#icon) - Custom icon (PRO)
- [unbranded](#unbranded) - Remove Tolki branding (PRO)
- [name](#name) - Bot name
- [message-placeholder](#message-placeholder) - Input placeholder text
- [toggle-placeholder](#toggle-placeholder) - Toggle button label
- [welcome-message](#welcome-message) - Welcome message
- [suggestions](#suggestions) - Quick suggestions
- [toasts](#toasts) - Toast messages
- [lang](#lang) - Interface language
- [locales](#locales) - Available languages
- [inline](#inline) - Inline mode (deprecated)

---

## `bot`

UUID identifier of the bot. **Required attribute** for component initialization. When set, the component connects to the Tolki backend to retrieve the bot configuration.

| Property | Value |
|----------|-------|
| **Type** | `string` (UUID) |
| **Required** | Yes |
| **Default** | — |

```html
<tolki-chat bot="550e8400-e29b-41d4-a716-446655440000"></tolki-chat>
```

---

## `position`

Widget positioning on the page. Determines where the toggle button and chat window are displayed.

| Property | Value |
|----------|-------|
| **Type** | `'inline'` \| `'left'` \| `'center'` \| `'right'` |
| **Default** | `'right'` |

- `right` — Bottom-right corner (classic chat widget position)
- `left` — Bottom-left corner
- `center` — Bottom-center
- `inline` — Embedded directly in the page flow (no toggle button)

```html
<!-- Bottom-right (default) -->
<tolki-chat bot="..." position="right"></tolki-chat>

<!-- Bottom-left -->
<tolki-chat bot="..." position="left"></tolki-chat>

<!-- Bottom-center -->
<tolki-chat bot="..." position="center"></tolki-chat>

<!-- Embedded in the page, no toggle -->
<tolki-chat bot="..." position="inline"></tolki-chat>
```

---

## `window-size`

Size of the chat window when open.

| Property | Value |
|----------|-------|
| **Type** | `'sm'` \| `'md'` \| `'lg'` \| `'xl'` |
| **Default** | `'sm'` |

```html
<!-- Small window -->
<tolki-chat bot="..." window-size="sm"></tolki-chat>

<!-- Medium window -->
<tolki-chat bot="..." window-size="md"></tolki-chat>

<!-- Large window -->
<tolki-chat bot="..." window-size="lg"></tolki-chat>

<!-- Extra-large window -->
<tolki-chat bot="..." window-size="xl"></tolki-chat>
```

---

## `toggle-size`

Size of the circular button that opens/closes the chat.

| Property | Value |
|----------|-------|
| **Type** | `'sm'` \| `'md'` \| `'lg'` |
| **Default** | `'md'` |

```html
<!-- Small button -->
<tolki-chat bot="..." toggle-size="sm"></tolki-chat>

<!-- Medium button (default) -->
<tolki-chat bot="..." toggle-size="md"></tolki-chat>

<!-- Large button -->
<tolki-chat bot="..." toggle-size="lg"></tolki-chat>
```

---

## `margin`

Widget margin from the page edges, in pixels. Supports a single value (applied to all sides) or two values for the X and Y axes.

| Property | Value |
|----------|-------|
| **Type** | `number` \| `[number, number]` |
| **Default** | `20` |

**Supported formats:**
- Single number: `"20"` — equal margin on all sides
- Comma-separated: `"20,30"` — X=20px, Y=30px
- JSON array: `"[20,30]"` — X=20px, Y=30px

```html
<!-- 20px margin on all sides -->
<tolki-chat bot="..." margin="20"></tolki-chat>

<!-- X=10px, Y=30px -->
<tolki-chat bot="..." margin="10,30"></tolki-chat>

<!-- JSON format -->
<tolki-chat bot="..." margin="[15,25]"></tolki-chat>

<!-- No margin -->
<tolki-chat bot="..." margin="0"></tolki-chat>
```

---

## `default-open`

When set, the chat window opens automatically on page load.

| Property | Value |
|----------|-------|
| **Type** | `boolean` |
| **Default** | `true` |

```html
<!-- Chat open on load -->
<tolki-chat bot="..." default-open></tolki-chat>
<tolki-chat bot="..." default-open="true"></tolki-chat>

<!-- Chat closed on load -->
<tolki-chat bot="..." default-open="false"></tolki-chat>
```

---

## `expandable`

Allows the user to expand the chat window to fullscreen.

| Property | Value |
|----------|-------|
| **Type** | `boolean` |
| **Default** | `true` |

```html
<!-- Expansion enabled (default) -->
<tolki-chat bot="..." expandable></tolki-chat>

<!-- Expansion disabled -->
<tolki-chat bot="..." expandable="false"></tolki-chat>
```

---

## `unclosable`

When enabled, the user cannot close the chat window. Useful for inline widgets or when the chat must always remain visible.

| Property | Value |
|----------|-------|
| **Type** | `boolean` |
| **Default** | `false` |

```html
<!-- Chat cannot be closed -->
<tolki-chat bot="..." unclosable></tolki-chat>

<!-- Standard behavior (closable) -->
<tolki-chat bot="..." unclosable="false"></tolki-chat>
```

---

## `dark`

Controls the widget's dark mode.

| Property | Value |
|----------|-------|
| **Type** | `'auto'` \| `'light'` \| `'dark'` |
| **Default** | `'auto'` |

- `auto` — Follows the operating system preference (`prefers-color-scheme`)
- `light` — Always light mode
- `dark` — Always dark mode

```html
<!-- Follow system settings (default) -->
<tolki-chat bot="..." dark="auto"></tolki-chat>

<!-- Always light mode -->
<tolki-chat bot="..." dark="light"></tolki-chat>

<!-- Always dark mode -->
<tolki-chat bot="..." dark="dark"></tolki-chat>
```

---

## `rounded`

Controls the widget's border radius.

| Property | Value |
|----------|-------|
| **Type** | `'none'` \| `'xs'` \| `'sm'` \| `'md'` \| `'lg'` \| `'xl'` |
| **Default** | `'xl'` |

| Value | Pixels |
|-------|--------|
| `none` | 0px |
| `xs` | 5px |
| `sm` | 10px |
| `md` | 15px |
| `lg` | 20px |
| `xl` | 25px |

```html
<!-- Very rounded corners (default) -->
<tolki-chat bot="..." rounded="xl"></tolki-chat>

<!-- Square corners -->
<tolki-chat bot="..." rounded="none"></tolki-chat>

<!-- Slightly rounded corners -->
<tolki-chat bot="..." rounded="sm"></tolki-chat>
```

---

## `avatar`

URL of the avatar image displayed next to the bot name in the chat header.

| Property | Value |
|----------|-------|
| **Type** | `string` (URL) |
| **Default** | `null` |

```html
<tolki-chat bot="..." avatar="https://example.com/bot-avatar.png"></tolki-chat>
```

---

## `backdrop-color`

Color of the overlay background that appears behind the chat window when open (on mobile or in fullscreen mode). Hex color format.

| Property | Value |
|----------|-------|
| **Type** | `HexColor` |
| **Default** | `null` (uses system color) |

```html
<!-- Black overlay -->
<tolki-chat bot="..." backdrop-color="#000000"></tolki-chat>

<!-- Dark blue overlay -->
<tolki-chat bot="..." backdrop-color="#1a1a2e"></tolki-chat>
```

---

## `backdrop-opacity`

Overlay background opacity, from 0 (transparent) to 1 (opaque).

| Property | Value |
|----------|-------|
| **Type** | `number` (0-1) |
| **Default** | `0.5` |

```html
<!-- Semi-transparent overlay (default) -->
<tolki-chat bot="..." backdrop-opacity="0.5"></tolki-chat>

<!-- Nearly transparent overlay -->
<tolki-chat bot="..." backdrop-opacity="0.2"></tolki-chat>

<!-- Opaque overlay -->
<tolki-chat bot="..." backdrop-opacity="0.9"></tolki-chat>
```

---

## `backdrop-blur`

Intensity of the overlay background blur effect.

| Property | Value |
|----------|-------|
| **Type** | `'none'` \| `'sm'` \| `'md'` \| `'lg'` \| `'xl'` |
| **Default** | `'md'` |

```html
<!-- No blur -->
<tolki-chat bot="..." backdrop-blur="none"></tolki-chat>

<!-- Medium blur (default) -->
<tolki-chat bot="..." backdrop-blur="md"></tolki-chat>

<!-- Heavy blur -->
<tolki-chat bot="..." backdrop-blur="xl"></tolki-chat>
```

---

## `toggle-background`

Background color of the circular toggle button that opens the chat. Hex color format.

| Property | Value |
|----------|-------|
| **Type** | `HexColor` |
| **Default** | `'#001ccb'` |

> **Note:** The hover color is automatically generated (darkening or lightening the base color by approximately 8%).

```html
<!-- Red button -->
<tolki-chat bot="..." toggle-background="#e74c3c"></tolki-chat>

<!-- Green button -->
<tolki-chat bot="..." toggle-background="#27ae60"></tolki-chat>

<!-- Black button -->
<tolki-chat bot="..." toggle-background="#000000"></tolki-chat>
```

---

## `toggle-content`

Color of the content (icon/text) inside the toggle button. If not specified, it is automatically generated based on the brightness of `toggle-background` (white for dark backgrounds, black for light backgrounds).

| Property | Value |
|----------|-------|
| **Type** | `HexColor` |
| **Default** | Auto-generated from `toggle-background` |

```html
<!-- White icon on red background -->
<tolki-chat bot="..." toggle-background="#e74c3c" toggle-content="#ffffff"></tolki-chat>

<!-- Custom icon color -->
<tolki-chat bot="..." toggle-background="#f1c40f" toggle-content="#2c3e50"></tolki-chat>
```

---

## `message-background`

Background color of the user's message bubbles. Hex color format.

| Property | Value |
|----------|-------|
| **Type** | `HexColor` |
| **Default** | `'#001ccb'` |

```html
<!-- Green user messages -->
<tolki-chat bot="..." message-background="#27ae60"></tolki-chat>

<!-- Purple user messages -->
<tolki-chat bot="..." message-background="#8e44ad"></tolki-chat>
```

---

## `message-content`

Text color of the user's messages. If not specified, it is automatically generated based on the brightness of `message-background`.

| Property | Value |
|----------|-------|
| **Type** | `HexColor` |
| **Default** | Auto-generated from `message-background` |

```html
<!-- Black text on light background -->
<tolki-chat bot="..." message-background="#ecf0f1" message-content="#2c3e50"></tolki-chat>

<!-- Custom text color -->
<tolki-chat bot="..." message-background="#2c3e50" message-content="#1abc9c"></tolki-chat>
```

---

## `icon`

URL of a custom icon to display in the toggle button instead of the default icon. **PRO feature** — the backend only sends this value for bots with an active PRO plan.

| Property | Value |
|----------|-------|
| **Type** | `string` (URL) |
| **Default** | `null` |

```html
<tolki-chat bot="..." icon="https://example.com/custom-icon.svg"></tolki-chat>
```

---

## `unbranded`

Removes the "Powered by Tolki" branding from the bottom of the chat. **PRO feature** — the backend only sends this value for bots with an active PRO plan.

| Property | Value |
|----------|-------|
| **Type** | `boolean` |
| **Default** | `false` |

```html
<!-- Remove Tolki branding -->
<tolki-chat bot="..." unbranded></tolki-chat>
<tolki-chat bot="..." unbranded="true"></tolki-chat>
```

---

## `name`

Bot name displayed in the chat window header. Supports internationalization (i18n) to show different names based on the language.

| Property | Value |
|----------|-------|
| **Type** | `string` \| `I18nString` |
| **Default** | `''` |

**Supported formats:**
- Plain string: `"Assistant"`
- JSON object with language keys: `'{"en":"Assistant","it":"Assistente"}'`
- Pipe format: `"en:Assistant|it:Assistente|es:Asistente"`

```html
<!-- Simple name -->
<tolki-chat bot="..." name="Tolki Assistant"></tolki-chat>

<!-- Multilingual name (JSON format) -->
<tolki-chat bot="..." name='{"en":"Assistant","it":"Assistente","es":"Asistente"}'></tolki-chat>

<!-- Multilingual name (pipe format) -->
<tolki-chat bot="..." name="en:Assistant|it:Assistente|es:Asistente"></tolki-chat>
```

---

## `message-placeholder`

Placeholder text shown in the input area when it is empty. Supports i18n.

| Property | Value |
|----------|-------|
| **Type** | `string` \| `I18nString` |
| **Default** | Multilingual: "Ask anything" / "Chiedi qualsiasi cosa" / etc. |

```html
<!-- Simple placeholder -->
<tolki-chat bot="..." message-placeholder="Type a message..."></tolki-chat>

<!-- Multilingual placeholder (JSON format) -->
<tolki-chat bot="..." message-placeholder='{"en":"Type a message...","it":"Scrivi un messaggio..."}'></tolki-chat>

<!-- Multilingual placeholder (pipe format) -->
<tolki-chat bot="..." message-placeholder="en:Type a message...|it:Scrivi un messaggio..."></tolki-chat>
```

---

## `toggle-placeholder`

Text displayed next to the toggle button (useful for adding a label to the open button). Supports i18n.

| Property | Value |
|----------|-------|
| **Type** | `string` \| `I18nString` |
| **Default** | `''` (no text) |

```html
<!-- Simple text -->
<tolki-chat bot="..." toggle-placeholder="Need help?"></tolki-chat>

<!-- Multilingual text -->
<tolki-chat bot="..." toggle-placeholder="en:Need help?|it:Hai bisogno di aiuto?"></tolki-chat>
```

---

## `welcome-message`

Welcome message displayed when the chat opens, before the user types anything. Supports i18n.

| Property | Value |
|----------|-------|
| **Type** | `string` \| `I18nString` |
| **Default** | `null` (no message) |

```html
<!-- Simple message -->
<tolki-chat bot="..." welcome-message="Hi! How can I help you?"></tolki-chat>

<!-- Multilingual message (JSON format) -->
<tolki-chat bot="..." welcome-message='{"en":"Hi! How can I help?","it":"Ciao! Come posso aiutarti?"}'></tolki-chat>

<!-- Multilingual message (pipe format) -->
<tolki-chat bot="..." welcome-message="en:Hi! How can I help?|it:Ciao! Come posso aiutarti?"></tolki-chat>
```

---

## `suggestions`

List of quick suggestions shown below the welcome message. Users can click them to quickly send a predefined message. Supports i18n arrays.

| Property | Value |
|----------|-------|
| **Type** | `string[]` \| `I18nArray` |
| **Default** | `[]` (no suggestions) |

**Supported formats:**
- Comma-separated list: `"Pricing,Support,Contact"`
- JSON array: `'["Pricing","Support","Contact"]'`
- JSON i18n array: `'[{"en":"Pricing","it":"Prezzi"},{"en":"Support","it":"Assistenza"}]'`
- Pipe format comma-separated: `"en:Pricing|it:Prezzi,en:Support|it:Assistenza"`

```html
<!-- Simple suggestions -->
<tolki-chat bot="..." suggestions="Pricing,Support,Contact"></tolki-chat>

<!-- JSON array suggestions -->
<tolki-chat bot="..." suggestions='["How much does it cost?","How does it work?","Contact us"]'></tolki-chat>

<!-- Multilingual suggestions (JSON format) -->
<tolki-chat bot="..." suggestions='[{"en":"Pricing","it":"Prezzi"},{"en":"How it works","it":"Come funziona"}]'></tolki-chat>

<!-- Multilingual suggestions (pipe format) -->
<tolki-chat bot="..." suggestions="en:Pricing|it:Prezzi,en:How it works|it:Come funziona"></tolki-chat>
```

---

## `toasts`

List of toast messages displayed as temporary notifications. Supports i18n arrays.

| Property | Value |
|----------|-------|
| **Type** | `string[]` \| `I18nArray` |
| **Default** | `[]` (no toasts) |

Supported formats are the same as [`suggestions`](#suggestions).

```html
<!-- Simple toasts -->
<tolki-chat bot="..." toasts="Welcome!,Need help?"></tolki-chat>

<!-- Multilingual toasts -->
<tolki-chat bot="..." toasts='[{"en":"Welcome!","it":"Benvenuto!"},{"en":"Need help?","it":"Hai bisogno di aiuto?"}]'></tolki-chat>
```

---

## `lang`

Widget interface language. This attribute is **bidirectional**: it can be set via HTML and is automatically updated when the user changes language from the chat.

| Property | Value |
|----------|-------|
| **Type** | `string` (ISO language code) |
| **Default** | `'en'` |

Supported languages by default: `en`, `it`, `es`, `fr`, `de`, `pt`.

```html
<!-- Italian interface -->
<tolki-chat bot="..." lang="it"></tolki-chat>

<!-- Spanish interface -->
<tolki-chat bot="..." lang="es"></tolki-chat>

<!-- French interface -->
<tolki-chat bot="..." lang="fr"></tolki-chat>
```

---

## `locales`

List of available languages for the language selector in the chat. If the bot only supports certain languages, you can limit the options shown.

| Property | Value |
|----------|-------|
| **Type** | `string[]` |
| **Default** | `['en', 'it', 'es', 'fr', 'de', 'pt']` |

**Supported formats:**
- Comma-separated list: `"en,it,es"`
- JSON array: `'["en","it","es"]'`

```html
<!-- Only Italian and English -->
<tolki-chat bot="..." locales="en,it"></tolki-chat>

<!-- Only Italian -->
<tolki-chat bot="..." locales="it"></tolki-chat>

<!-- JSON format -->
<tolki-chat bot="..." locales='["en","it","fr","de"]'></tolki-chat>
```

---

## `inline`

> **Deprecated** — Use `position="inline"` instead.

Legacy attribute to enable inline mode (chat embedded directly in the page).

| Property | Value |
|----------|-------|
| **Type** | `boolean` |
| **Default** | `false` |

```html
<!-- Deprecated -->
<tolki-chat bot="..." inline></tolki-chat>

<!-- Use instead -->
<tolki-chat bot="..." position="inline"></tolki-chat>
```

---

## Full Example

Here is an example using many of the available attributes:

```html
<tolki-chat
  bot="550e8400-e29b-41d4-a716-446655440000"
  position="right"
  window-size="md"
  toggle-size="lg"
  margin="20,30"
  default-open="false"
  expandable
  dark="auto"
  rounded="lg"
  toggle-background="#e74c3c"
  message-background="#e74c3c"
  backdrop-blur="lg"
  backdrop-opacity="0.6"
  avatar="https://example.com/avatar.png"
  name="en:Assistant|it:Assistente"
  message-placeholder="en:Ask me anything...|it:Chiedimi qualsiasi cosa..."
  welcome-message="en:Hello! How can I help you?|it:Ciao! Come posso aiutarti?"
  suggestions="en:Pricing|it:Prezzi,en:How it works|it:Come funziona"
  lang="it"
  locales="en,it"
></tolki-chat>
```

---

## Priority System

Component attributes follow a three-level priority system:

1. **HTML Attributes** (highest priority) — Values set directly in the HTML tag
2. **Backend** — Values received from the Tolki API based on the bot configuration
3. **Default Values** (lowest priority) — Built-in fallback values

This means an attribute set via HTML always overrides the value from the backend, allowing full client-side customization.
