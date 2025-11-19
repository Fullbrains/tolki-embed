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
type HexColor = `#${string}`                    // #RGB or #RRGGBB
type HexColorPair = `${HexColor},${HexColor}`   // #hex,#hex (default,hover)

// Internationalization types
type I18nString = string | { [lang: string]: string }
type I18nArray = string[] | { [lang: string]: string }[]

// Component-specific types
type ChatPosition = 'inline' | 'left' | 'center' | 'right'
type ChatSize = 'md' | 'lg' | 'xl'
type IconValue = HexColor | HexColorPair | string  // string = URL (PRO only)
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
  dark: boolean                       // default: false
  blur: boolean                       // default: true
  backdrop: HexColor | null           // default: null
  avatar: string | null               // default: null

  // Colors
  toggleColor: HexColor | HexColorPair  // default: '#3b82f6'
  icon: IconValue | null                // default: null (auto-generated)
  messageColor: HexColor | HexColorPair // default: '#2563eb'

  // Branding (PRO only)
  unbranded: boolean                  // default: false

  // Content
  placeholder: string                 // default: 'Ask Anything'
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
  toggle-color="#ff0000"
  placeholder="Chat with us!">
</tolki-chat>

<!-- With color pairs (default,hover) -->
<tolki-chat
  bot="abc-123"
  toggle-color="#3b82f6,#2563eb"
  message-color="#22c55e,#16a34a">
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
```

### 2. JavaScript API

```javascript
// Get component reference
const chat = document.querySelector('tolki-chat')

// Set attributes programmatically
chat.setAttribute('toggle-color', '#ff0000')
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
  styles: {
    chat: {
      button: {
        defaultBackgroundColor: "#3b82f6",
        hoverBackgroundColor: "#2563eb",
        foregroundColor: "#ffffff"
      },
      bubble: {
        backgroundColor: "#22c55e",
        foregroundColor: "#ffffff"
      }
    }
  }
}

// Automatically transformed to TolkiChatProps
```

---

## Auto-Generation Features

### Icon Color (Auto-Contrast)

When `icon` prop is `null`, the color is automatically calculated for optimal contrast:

```typescript
// Algorithm
const luminance = getLuminance(toggleColor)
icon = luminance > 0.5 ? '#000000' : '#ffffff'  // Black for light, white for dark
```

**Examples**:
- `toggleColor="#3b82f6"` (blue, dark) → `icon="#ffffff"` (white)
- `toggleColor="#fbbf24"` (yellow, light) → `icon="#000000"` (black)

### Hover Color (Auto-Brightness)

When a single color is provided (not a color pair), hover is auto-generated:

```typescript
// Algorithm
const luminance = getLuminance(color)
const percent = luminance < 0.5 ? 15 : -15  // Lighten dark, darken light
hoverColor = adjustBrightness(color, percent)
```

**Examples**:
- `toggleColor="#3b82f6"` → hover: `#4d94f7` (lightened 15%)
- `toggleColor="#fbbf24"` → hover: `#d5a21f` (darkened 15%)

---

## Props Priority System

Props can come from 4 different sources. Higher priority wins:

### Priority Levels

1. **PRO Backend (Highest)** - Priority: 4
   - Source: API response when `isAdk: true`
   - Can set: ALL props including PRO-only
   - Example: `unbranded`, `icon` as URL

2. **User Attributes** - Priority: 3
   - Source: HTML attributes or JavaScript API
   - Can set: All NON-PRO props
   - Example: `<tolki-chat toggle-color="#ff0000">`

3. **Standard Backend** - Priority: 2
   - Source: API response when `isAdk: false`
   - Can set: All NON-PRO props
   - Example: `welcomeMessage`, `suggestions`

4. **Component Defaults (Lowest)** - Priority: 1
   - Source: `DEFAULT_PROPS` in `props.ts`
   - Fallback when no other source provides value

### Example Priority Resolution

```typescript
// Scenario:
// - PRO Backend: toggleColor = "#ff0000"
// - User Attr:   toggleColor = "#00ff00"
// - Std Backend: toggleColor = "#0000ff"
// - Default:     toggleColor = "#3b82f6"

// Result: PRO Backend wins → toggleColor = "#ff0000"
```

---

## PRO-Only Features

Only available when `isBotPro() === true` (determined by `isAdk` flag):

### Props

- **`unbranded`**: Remove Tolki branding
- **`icon` as URL**: Custom icon image (hex colors are available to all)

### Validation

```typescript
// User tries to set PRO prop via HTML attribute
<tolki-chat unbranded="true">  // ❌ Ignored with warning

// PRO backend sets it
{ isAdk: true, unbranded: true }  // ✅ Applied
```

---

## Attribute Parsing

### Supported Formats

#### Simple String
```html
<tolki-chat placeholder="Type here...">
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
<tolki-chat toggle-color="#ff0000">              <!-- Single color -->
<tolki-chat toggle-color="#ff0000,#cc0000">      <!-- Color pair -->
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

```typescript
// Conversion
hexToRgb(hex: string): { r: number, g: number, b: number }
rgbToHex(r: number, g: number, b: number): HexColor

// Luminance (0 = black, 1 = white)
getLuminance(hex: string): number

// Auto-contrast (returns white or black)
getContrastColor(hex: string): '#ffffff' | '#000000'

// Brightness adjustment (-100 to 100)
adjustBrightness(hex: string, percent: number): HexColor

// Auto-generate hover (±15% brightness)
generateHoverColor(hex: string): HexColor

// Parsing
parseHexColorPair(value: string): { default: HexColor, hover: HexColor } | null

// Validation
isValidHexColor(color: string): boolean
isValidHexColorPair(value: string): boolean
```

### Algorithm Details

**Luminance Calculation** (sRGB with gamma correction):
```typescript
// Normalize RGB (0-255) to (0-1)
// Apply gamma correction: v <= 0.03928 ? v/12.92 : ((v+0.055)/1.055)^2.4
// Weighted sum: 0.2126*R + 0.7152*G + 0.0722*B
```

**Contrast Threshold**: 0.5 (WCAG 2.0 compliant)

**Brightness Adjustment**: RGB linear adjustment with clamping (0-255)

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
  <!-- Test auto-contrast -->
  <tolki-chat
    bot="test-bot"
    toggle-color="#000000">  <!-- Should auto-generate white icon -->
  </tolki-chat>

  <!-- Test auto-hover -->
  <tolki-chat
    bot="test-bot"
    toggle-color="#3b82f6">  <!-- Should auto-generate hover color -->
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

### Issue: Icon color not auto-generating

**Cause**: `icon` prop is explicitly set (even to empty string)
**Solution**: Don't set `icon` attribute, or set to `null` via JS

### Issue: Hover color not auto-generating

**Cause**: Using color pair format `#hex,#hex`
**Solution**: Use single color `#hex` to enable auto-generation

### Issue: PRO prop not applying from HTML

**Cause**: PRO props can only be set from PRO backend
**Solution**: Use backend API with `isAdk: true`

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
- [ ] `borderRadius` - Border radius for chat window
- [ ] `animation` - Enable/disable animations
- [ ] `sound` - Enable/disable notification sounds
- [ ] `maxHeight` - Maximum chat window height
- [ ] Theme presets (light/dark/auto)
- [ ] Custom CSS variables support

---

## Version History

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

- **Color Theory**: sRGB gamma correction (IEC 61966-2-1)
- **Contrast**: WCAG 2.0 Level AA (4.5:1 ratio)
- **Luminance Formula**: ITU-R BT.709
- **Type System**: TypeScript 5.5+ template literal types
- **Web Component**: Lit 3.x + @lit-app/state

---

## Credits

Implementation by Claude (Anthropic) based on specifications provided by Giovanni.

Color utilities inspired by:
- Chrome DevTools color picker
- @fullbrains/iride color system
- WCAG contrast guidelines
