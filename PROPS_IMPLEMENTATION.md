# Props System Implementation

## Overview

This document describes the comprehensive props system implemented for the Tolki Chat web component. The system provides a flexible, type-safe way to configure the chat widget with support for multiple data sources, automatic color generation, and internationalization.

**Implementation Date**: 2025-01-19
**Features**: 19+ configurable props, auto-contrast, auto-hover-colors, i18n support, PRO plan features

---

## Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    TolkiChat Component                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              PropsManager                             │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  Priority System (4 levels):                   │  │   │
│  │  │  1. PRO Backend Props    (highest priority)    │  │   │
│  │  │  2. User Attributes      (HTML/JS API)         │  │   │
│  │  │  3. Standard Backend     (API response)        │  │   │
│  │  │  4. Component Defaults   (fallback)            │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │                                                        │   │
│  │  Auto-Generation:                                     │   │
│  │  • Icon color (contrast with toggleColor)            │   │
│  │  • Hover colors (brightness adjustment)              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### File Structure

```
src/
├── types/
│   └── props.ts                  # Type definitions and interfaces
├── utils/
│   ├── color.ts                  # Color manipulation utilities
│   ├── props-parser.ts           # Attribute parsing (DSL/JSON)
│   └── props-transformer.ts      # Backend → Component props mapping
├── services/
│   └── props-manager.ts          # Priority system and validation
└── components/
    └── tolki-chat/
        └── tolki-chat.ts         # Component integration
```

---

## Type System

### Core Types

```typescript
// Color types
type HexColor = `#${string}`  // #RGB or #RRGGBB

// Internationalization types
type I18nString = string | { [lang: string]: string }
type I18nArray = string[] | { [lang: string]: string }[]

// Component-specific types
type ChatPosition = 'inline' | 'left' | 'center' | 'right'
type ChatSize = 'md' | 'lg' | 'xl'
type DarkMode = 'auto' | 'light' | 'dark'
type RoundedSize = 'none' | 'sm' | 'md' | 'lg' | 'xl'
```

### Props Interface

```typescript
interface TolkiChatProps {
  // Layout & Positioning
  position: ChatPosition              // default: 'right'
  size: ChatSize                      // default: 'md'
  defaultOpen: boolean                // default: true
  expandable: boolean                 // default: true
  unclosable: boolean                 // default: false

  // Appearance
  dark: DarkMode                      // default: 'auto' ('auto' | 'light' | 'dark')
  rounded: RoundedSize                // default: 'xl' ('none' | 'sm' | 'md' | 'lg' | 'xl')
  blur: boolean                       // default: true
  backdrop: HexColor | null           // default: null
  avatar: string | null               // default: null

  // Toggle Button Colors
  toggleBackground: HexColor          // default: '#3b82f6'
  toggleContent: HexColor | null      // default: null (auto-generated for contrast)

  // Message Bubble Colors (user messages)
  messageBackground: HexColor         // default: '#2563eb'
  messageContent: HexColor | null     // default: null (auto-generated for contrast)

  // Icon (PRO only)
  icon: string | null                 // URL to custom icon image (PRO only)

  // Branding (PRO only)
  unbranded: boolean                  // default: false

  // Content
  messagePlaceholder: string          // default: 'Ask Anything'
  togglePlaceholder: string           // default: 'Chat with us'
  welcomeMessage: I18nString | null   // default: null
  suggestions: I18nArray              // default: []
  toasts: I18nArray                   // default: []

  // Internationalization
  lang: string                        // default: 'en'
  locales: string[]                   // default: ['en','it','es','fr','de','pt']
}
```

---

## Usage Examples

### 1. HTML Attributes

```html
<!-- Basic usage -->
<tolki-chat
  bot="abc-123"
  position="right"
  toggle-background="#ff0000"
  message-placeholder="Chat with us!">
</tolki-chat>

<!-- Custom colors (hover auto-generated, content auto-contrasted) -->
<tolki-chat
  bot="abc-123"
  toggle-background="#3b82f6"
  message-background="#22c55e">
</tolki-chat>

<!-- Override auto-generated content colors -->
<tolki-chat
  bot="abc-123"
  toggle-background="#000000"
  toggle-content="#00ff00"
  message-background="#ffffff"
  message-content="#ff0000">
</tolki-chat>

<!-- With i18n (JSON format) -->
<tolki-chat
  bot="abc-123"
  welcome-message='{"en":"Hello!","it":"Ciao!","es":"Hola!"}'
  suggestions='["Help","Pricing","Contact"]'>
</tolki-chat>

<!-- Inline mode -->
<tolki-chat
  bot="abc-123"
  position="inline"
  unclosable>
</tolki-chat>

<!-- Custom border radius -->
<tolki-chat
  bot="abc-123"
  rounded="lg">          <!-- Large corners (15px) -->
</tolki-chat>

<!-- Sharp corners -->
<tolki-chat
  bot="abc-123"
  rounded="none">        <!-- No border radius -->
</tolki-chat>

<!-- Dark mode -->
<tolki-chat
  bot="abc-123"
  dark="dark">           <!-- Force dark mode -->
</tolki-chat>
```

### 2. JavaScript API

```javascript
// Get component reference
const chat = document.querySelector('tolki-chat')

// Set attributes programmatically
chat.setAttribute('toggle-background', '#ff0000')
chat.setAttribute('toggle-content', '#ffffff')  // Or omit for auto-generation
chat.setAttribute('position', 'left')
chat.setAttribute('dark', '')  // boolean attribute

// Set complex props via JSON
chat.setAttribute('suggestions', JSON.stringify([
  { en: 'Help', it: 'Aiuto' },
  { en: 'Pricing', it: 'Prezzi' }
]))
```

### 3. Backend Configuration

The backend can provide props via the Bot API response:

```typescript
// Backend response (BotProps format)
{
  name: "Support Bot",
  avatar: "https://example.com/avatar.png",
  welcomeMessage: "How can I help?",
  suggestions: ["Help", "Pricing", "Contact"],
  defaultOpen: true,
  unbranded: true,  // PRO only
  icon: "https://example.com/custom-icon.svg",  // PRO only
  styles: {
    chat: {
      button: {
        defaultBackgroundColor: "#3b82f6",  // → toggleBackground
        foregroundColor: "#ffffff"          // → toggleContent
        // hoverBackgroundColor is ignored (auto-generated)
      },
      bubble: {
        backgroundColor: "#22c55e",   // → messageBackground
        foregroundColor: "#ffffff"     // → messageContent
      }
    }
  }
}

// Automatically transformed to TolkiChatProps:
// {
//   toggleBackground: "#3b82f6",
//   toggleContent: "#ffffff",
//   messageBackground: "#22c55e",
//   messageContent: "#ffffff",
//   unbranded: true,
//   icon: "https://example.com/custom-icon.svg",
//   ...
// }
```

---

## Auto-Generation Features

### Content Colors (Auto-Contrast)

When `toggleContent` or `messageContent` are `null`, they are automatically calculated for optimal contrast with their respective backgrounds:

```typescript
// Algorithm (using tinycolor2)
const color = tinycolor(background)
const isLight = color.getLuminance() > 0.5
content = isLight ? '#000000' : '#ffffff'  // Black for light backgrounds, white for dark
```

**Examples**:
- `toggleBackground="#3b82f6"` (blue, dark) → `toggleContent="#ffffff"` (white)
- `toggleBackground="#fbbf24"` (yellow, light) → `toggleContent="#000000"` (black)
- `messageBackground="#22c55e"` (green, medium) → `messageContent="#ffffff"` (white)

**User Attribute Behavior**:
When you set a background color via HTML attribute but NOT its corresponding content color, the system explicitly sets content to `null` at User Attributes priority, overriding any backend value to trigger auto-generation.

### Hover Colors (Auto-Brightness)

Hover colors are **always** auto-generated - you cannot customize them:

```typescript
// Algorithm (using tinycolor2)
const color = tinycolor(background)
const adjusted = color.isLight()
  ? color.darken(8)   // Darken light colors
  : color.brighten(8) // Brighten dark colors
hoverColor = adjusted.toHexString()
```

**Examples**:
- `toggleBackground="#3b82f6"` → hover: brightened by 8 percentage points
- `toggleBackground="#fbbf24"` → hover: darkened by 8 percentage points

---

## Props Priority System

Props can come from 4 different sources. Higher priority wins:

### Priority Levels

1. **PRO Backend (Highest)** - Priority: 4
   - Source: API response when `isAdk: true`
   - Can set: **ONLY PRO-only props** (`unbranded`, `icon` as URL)
   - Example: `{ unbranded: true, icon: "https://..." }`

2. **User Attributes** - Priority: 3
   - Source: HTML attributes or JavaScript API
   - Can set: All NON-PRO props (colors, placeholders, avatar, etc.)
   - Example: `<tolki-chat toggle-background="#ff0000">`

3. **Standard Backend** - Priority: 2
   - Source: API response (all standard props from backend)
   - Can set: All NON-PRO props (colors, avatar, welcomeMessage, suggestions, etc.)
   - **IMPORTANT**: Colors from backend are **STANDARD**, not PRO

4. **Component Defaults (Lowest)** - Priority: 1
   - Source: `DEFAULT_PROPS` in `props.ts`
   - Fallback when no other source provides value

### Example Priority Resolution

```typescript
// Scenario 1: Standard props
// - Standard Backend: toggleBackground = "#0000ff"
// - User Attr:        toggleBackground = "#00ff00"
// - Default:          toggleBackground = "#3b82f6"

// Result: User Attr wins (priority 3 > 2) → toggleBackground = "#00ff00"

// Scenario 2: PRO props
// - PRO Backend:  unbranded = true
// - User Attr:    unbranded = false  // ❌ Ignored (lower priority)

// Result: PRO Backend wins → unbranded = true

// Scenario 3: Auto-generation with backend
// - Standard Backend: toggleBackground = "#0000ff", toggleContent = "#d7dcdf"
// - User Attr:        toggleBackground = "#00ff00" (but NOT toggleContent)

// Result:
//   - toggleBackground = "#00ff00" (user wins)
//   - toggleContent = null (explicitly set to override backend)
//   - Auto-generation calculates toggleContent based on "#00ff00"
```

---

## PRO-Only Features

Only available when `isBotPro() === true` (determined by `isAdk` flag):

### Props

- **`unbranded`**: Remove Tolki branding (boolean)
- **`icon`**: Custom icon image URL (string)

**IMPORTANT**: Colors are NOT PRO-only! All color props (`toggleBackground`, `toggleContent`, `messageBackground`, `messageContent`) are available to all users and can be set from:
- Standard Backend (priority 2)
- User Attributes (priority 3)

### Validation

```typescript
// User tries to set PRO prop via HTML attribute
<tolki-chat unbranded="true">  // ❌ Ignored with warning
<tolki-chat icon="https://...">  // ❌ Ignored with warning

// PRO backend sets it
{ isAdk: true, unbranded: true, icon: "https://..." }  // ✅ Applied

// Colors work for everyone
<tolki-chat toggle-background="#ff0000">  // ✅ Works for all users
{ styles: { chat: { button: { defaultBackgroundColor: "#ff0000" } } } }  // ✅ Works for all users
```

---

## Attribute Parsing

### Supported Formats

#### Simple String
```html
<tolki-chat message-placeholder="Type here...">
<tolki-chat toggle-placeholder="Chat with us">
```

#### Boolean
```html
<tolki-chat dark>                    <!-- true -->
<tolki-chat dark="">                 <!-- true -->
<tolki-chat dark="true">             <!-- true -->
<tolki-chat dark="false">            <!-- false -->
```

#### Hex Color
```html
<tolki-chat toggle-background="#ff0000">   <!-- Background color (hover auto-generated) -->
<tolki-chat toggle-content="#ffffff">      <!-- Content color (or omit for auto-contrast) -->
```

#### Array (DSL)
```html
<tolki-chat suggestions="Help,Pricing,Contact">
<tolki-chat locales="en,it,es,fr">
```

#### Array (JSON)
```html
<tolki-chat suggestions='["Help","Pricing","Contact"]'>
```

#### I18n String (JSON only)
```html
<tolki-chat welcome-message='{"en":"Hello","it":"Ciao"}'>
```

#### I18n Array (JSON only)
```html
<tolki-chat suggestions='[{"en":"Help","it":"Aiuto"},{"en":"Pricing","it":"Prezzi"}]'>
```

### Case Conversion

HTML attributes use `kebab-case`, component uses `camelCase`:

```html
<tolki-chat default-open="true">  <!-- HTML -->
```
```typescript
props.defaultOpen  // Component property
```

---

## Color Utilities Reference

### File: `src/utils/color.ts`

Uses **tinycolor2** library for robust color manipulation.

```typescript
// Auto-contrast (returns white or black)
getContrastColor(hex: string): '#ffffff' | '#000000'

// Auto-generate hover (darken light / brighten dark by 8 percentage points)
generateHoverColor(hex: string): HexColor

// Validation
isValidHexColor(color: string): boolean
```

### Algorithm Details

**Luminance Calculation** (via tinycolor2):
```typescript
const color = tinycolor(hex)
const luminance = color.getLuminance()  // 0 = black, 1 = white
```

**Contrast Threshold**: 0.5
- Luminance > 0.5 → Light background → Use black text (#000000)
- Luminance ≤ 0.5 → Dark background → Use white text (#ffffff)

**Brightness Adjustment** (via tinycolor2):
```typescript
const color = tinycolor(hex)
const adjusted = color.isLight()
  ? color.darken(8)   // Darken by 8 percentage points on HSL lightness scale
  : color.brighten(8) // Brighten by 8 percentage points
```

**Note**: tinycolor2's `brighten(n)` and `darken(n)` adjust HSL lightness by n percentage points (0-100 scale), not n%.

---

## Migration Notes

### Legacy `inline` Attribute

The old `inline` boolean attribute is now deprecated in favor of `position`:

```html
<!-- Old (still works for backward compatibility) -->
<tolki-chat inline>

<!-- New (recommended) -->
<tolki-chat position="inline">
```

**Compatibility**: Both work, but `position="inline"` is preferred.

### State Properties

For backward compatibility, some state properties are auto-synced:

```typescript
// When props change:
state.inline = props.position === 'inline'
state.unclosable = props.unclosable
```

---

## Testing

### Type Check

```bash
npx tsc --noEmit
```

### Manual Testing

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module" src="dist/chat.js"></script>
</head>
<body>
  <!-- Test auto-contrast on dark background -->
  <tolki-chat
    bot="test-bot"
    toggle-background="#000000">  <!-- Should auto-generate white content (#ffffff) -->
  </tolki-chat>

  <!-- Test auto-contrast on light background -->
  <tolki-chat
    bot="test-bot"
    toggle-background="#fbbf24">  <!-- Should auto-generate black content (#000000) -->
  </tolki-chat>

  <!-- Test auto-hover -->
  <tolki-chat
    bot="test-bot"
    toggle-background="#3b82f6">  <!-- Should auto-generate hover color (brightened) -->
  </tolki-chat>

  <!-- Test i18n -->
  <tolki-chat
    bot="test-bot"
    welcome-message='{"en":"Hello","it":"Ciao"}'
    lang="it">
  </tolki-chat>
</body>
</html>
```

---

## API Reference

### PropsManager

```typescript
class PropsManager {
  // Set props from different sources
  setProBackendProps(props: Partial<TolkiChatProps>): void
  setUserAttributes(attributes: { [key: string]: string | boolean | null }): void
  setStandardBackendProps(props: Partial<TolkiChatProps>): void

  // Get final computed props
  getProps(): TolkiChatProps

  // Reset all sources
  reset(): void
}
```

### Transformer

```typescript
// Transform backend format to component format
transformBotPropsToTolkiProps(
  botProps: BotProps,
  isPro: boolean
): Partial<TolkiChatProps>

// Determine if bot is PRO
isBotPro(botProps: BotProps): boolean
```

### Parser

```typescript
// Parse different value types from string attributes
parseBoolean(value: string | boolean | null): boolean
parseString(value: string | null): string | null
parseI18nString(value: string | null): I18nString | null
parseI18nArray(value: string | null): I18nArray
parseStringArray(value: string | null): string[]
parseHexColor(value: string | null): string | null
parseEnum<T>(value: string | null, allowedValues: readonly T[]): T | null

// Case conversion
attrNameToPropName(attrName: string): string  // kebab-case → camelCase
propNameToAttrName(propName: string): string  // camelCase → kebab-case
```

---

## Troubleshooting

### Issue: Content color not auto-generating

**Cause**: Content color (`toggleContent` or `messageContent`) is explicitly set
**Solution**: Don't set the content attribute to allow auto-generation based on background

### Issue: Hover color looks too bright/dark

**Cause**: Hover colors are always auto-generated with 8 percentage point adjustment
**Solution**: Adjust the base background color instead - hover will auto-adjust accordingly

### Issue: PRO prop not applying from HTML

**Cause**: PRO props (`unbranded`, `icon`) can only be set from PRO backend
**Solution**: Use backend API with `isAdk: true`

### Issue: Backend color not applying

**Cause 1**: User has set the color via HTML attribute (user attributes have higher priority)
**Solution**: Remove the HTML attribute to use backend value

**Cause 2**: User set background color but not content color - system auto-generates content
**Solution**: Either set both colors as attributes, or remove the background attribute to use backend values

### Issue: I18n not parsing

**Cause**: Invalid JSON syntax in attribute
**Solution**: Ensure proper JSON escaping:
```html
<!-- ❌ Wrong -->
<tolki-chat suggestions="{'en':'Help'}">

<!-- ✅ Correct -->
<tolki-chat suggestions='{"en":"Help"}'>
```

---

## Future Enhancements

Potential additions to the props system:

- [ ] `bubbleTextColor` - Text color inside message bubbles
- [ ] `fontSize` - Base font size
- [ ] `animation` - Enable/disable animations
- [ ] `sound` - Enable/disable notification sounds
- [ ] `maxHeight` - Maximum chat window height
- [ ] Custom CSS variables support

---

## Version History

**v2.0.0** (2025-01-20)
- **BREAKING**: Removed color pairs - hover colors now always auto-generated
- **BREAKING**: Renamed `toggleColor` → `toggleBackground`, added `toggleContent`
- **BREAKING**: Renamed `messageColor` → `messageBackground`, added `messageContent`
- **BREAKING**: Split `placeholder` → `messagePlaceholder` + `togglePlaceholder`
- **BREAKING**: `icon` is now URL only (PRO-only), no longer supports hex colors
- Migrated to **tinycolor2** for color manipulation
- Clarified PRO-only props: ONLY `unbranded` and `icon` (as URL)
- All colors are now Standard Backend props, not PRO
- Auto-generation: `toggleContent` and `messageContent` calculate contrast based on backgrounds
- Improved priority system: user attributes can force auto-generation by setting background but not content
- Hover brightness adjustment reduced from 15 to 8 percentage points for subtlety

**v1.0.0** (2025-01-19)
- Initial implementation
- 19 configurable props
- Auto-contrast for icon colors
- Auto-hover color generation
- 4-level priority system
- i18n support
- PRO plan features
- DSL and JSON attribute parsing
- Backward compatible with legacy `inline` attribute

---

## References

- **Color Library**: tinycolor2 by Brian Grinstead
- **Contrast**: WCAG 2.0 guidelines
- **Type System**: TypeScript 5.5+ template literal types
- **Web Component**: Lit 3.x + @lit-app/state

---

## Credits

Implementation by Claude (Anthropic) based on specifications provided by Giovanni.

Color system powered by tinycolor2.
