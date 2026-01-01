# API Proposal - Versione Finale

## Struttura `styles`

```typescript
styles: {
  // === Globali (tutto il widget) ===
  position: 'inline' | 'left' | 'center' | 'right'
  margin: number | [number, number]
  dark: 'auto' | 'light' | 'dark'
  rounded: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'

  // === Per elemento ===
  toggle: {
    size: 'sm' | 'md' | 'lg'
    background: HexColor
    foreground: HexColor | null  // null = auto-contrast
  }

  window: {
    size: 'sm' | 'md' | 'lg' | 'xl'
  }

  message: {
    background: HexColor
    foreground: HexColor | null  // null = auto-contrast
  }

  backdrop: {
    color: HexColor | null
    opacity: number         // 0-1, default 0.5
    blur: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  }
}
```

---

## Root Props

```typescript
interface BotProps {
  // Identità
  name: string
  avatar?: string

  // Comportamento
  defaultOpen?: boolean
  expandable?: boolean
  unclosable?: boolean

  // Contenuto
  welcomeMessage?: I18nString
  suggestions?: I18nArray
  toasts?: I18nArray
  messagePlaceholder?: I18nString
  togglePlaceholder?: I18nString

  // i18n
  lang?: string
  locales?: string[]

  // PRO (il backend manda questi campi solo se il bot è PRO)
  icon?: string
  unbranded?: boolean

  // API routing (determina quale backend usare, NON è correlato a PRO)
  isAdk?: boolean

  // Stili
  styles?: StylesConfig
}
```

---

## Mapping Completo

### Styles

| Prop Componente     | Path API `styles.`   | Default     |
|---------------------|----------------------|-------------|
| `position`          | `position`           | `'right'`   |
| `margin`            | `margin`             | `20`        |
| `dark`              | `dark`               | `'auto'`    |
| `rounded`           | `rounded`            | `'xl'`      |
| `toggleSize`        | `toggle.size`        | `'md'`      |
| `toggleBackground`  | `toggle.background`  | `'#001ccb'` |
| `toggleContent`     | `toggle.foreground`  | `null`      |
| `windowSize`        | `window.size`        | `'sm'`      |
| `messageBackground` | `message.background` | `'#001ccb'` |
| `messageContent`    | `message.foreground` | `null`      |
| `backdropColor`     | `backdrop.color`     | `null`      |
| `backdropOpacity`   | `backdrop.opacity`   | `0.5`       |
| `backdropBlur`      | `backdrop.blur`      | `'md'`      |

### Root Props

| Prop Componente      | Campo API            | Stato    |
|----------------------|----------------------|----------|
| `avatar`             | `avatar`             | ✅ Esiste |
| `defaultOpen`        | `defaultOpen`        | ✅ Esiste |
| `expandable`         | `expandable`         | ❌ Nuovo  |
| `unclosable`         | `unclosable`         | ❌ Nuovo  |
| `welcomeMessage`     | `welcomeMessage`     | ✅ Esiste |
| `suggestions`        | `suggestions`        | ✅ Esiste |
| `toasts`             | `toasts`             | ❌ Nuovo  |
| `messagePlaceholder` | `messagePlaceholder` | ❌ Nuovo  |
| `togglePlaceholder`  | `togglePlaceholder`  | ❌ Nuovo  |
| `lang`               | `lang`               | ❌ Nuovo  |
| `locales`            | `locales`            | ❌ Nuovo  |
| `icon`               | `icon`               | ✅ Esiste |
| `unbranded`          | `unbranded`          | ✅ Esiste |

---

# Breaking Changes

## 1. Struttura `styles` (BREAKING)

### Da cambiare nel Backend

| Vecchio Path                                | Nuovo Path                  | Azione     |
|---------------------------------------------|-----------------------------|------------|
| `styles.chat.button.defaultBackgroundColor` | `styles.toggle.background`  | Rinominare |
| `styles.chat.button.foregroundColor`        | `styles.toggle.foreground`  | Rinominare |
| `styles.chat.button.hoverBackgroundColor`   | ❌ RIMOSSO                   | Eliminare  |
| `styles.chat.bubble.backgroundColor`        | `styles.message.background` | Rinominare |
| `styles.chat.bubble.foregroundColor`        | `styles.message.foreground` | Rinominare |
| `styles.chat`                               | ❌ RIMOSSO                   | Eliminare  |

### Esempio migrazione

```typescript
// PRIMA
{
  styles: {
    chat: {
      button: {
        defaultBackgroundColor: '#001ccb',
          hoverBackgroundColor
      :
        '#0015a3',
          foregroundColor
      :
        '#ffffff'
      }
    ,
      bubble: {
        backgroundColor: '#001ccb',
          foregroundColor
      :
        '#ffffff'
      }
    }
  }
}

// DOPO
{
  styles: {
    toggle: {
      background: '#001ccb',
        foreground
    :
      '#ffffff'
    }
  ,
    message: {
      background: '#001ccb',
        foreground
    :
      '#ffffff'
    }
  }
}
```

---

## 2. Nuove Props `styles` (NON-BREAKING)

Queste sono aggiunte, non breaking:

| Nuova Prop                | Default   | Note                |
|---------------------------|-----------|---------------------|
| `styles.position`         | `'right'` | Posizione widget    |
| `styles.margin`           | `20`      | Margine dal bordo   |
| `styles.dark`             | `'auto'`  | Tema dark/light     |
| `styles.rounded`          | `'xl'`    | Border radius       |
| `styles.toggle.size`      | `'md'`    | Dimensione toggle   |
| `styles.window.size`      | `'sm'`    | Dimensione finestra |
| `styles.backdrop.color`   | `null`    | Colore backdrop     |
| `styles.backdrop.opacity` | `0.5`     | Opacità backdrop    |
| `styles.backdrop.blur`    | `'md'`    | Blur backdrop       |

---

## 3. Nuove Root Props (NON-BREAKING)

Queste sono aggiunte, non breaking:

| Nuova Prop           | Default          | Note               |
|----------------------|------------------|--------------------|
| `expandable`         | `true`           | Permette expand    |
| `unclosable`         | `false`          | Non chiudibile     |
| `toasts`             | `[]`             | Notifiche toast    |
| `messagePlaceholder` | `'Ask anything'` | Placeholder input  |
| `togglePlaceholder`  | `''`             | Testo sul toggle   |
| `lang`               | `'en'`           | Lingua default     |
| `locales`            | `['en',...]`     | Lingue disponibili |

---

## 4. Props da Rimuovere (BREAKING)

| Prop                   | Motivo                     |
|------------------------|----------------------------|
| `version`              | Non usata                  |
| `team`                 | Non usata                  |
| `hoverBackgroundColor` | Auto-generato dal frontend |

---

## 5. Logica PRO da Correggere (BREAKING)

### Problema attuale

In `props-transformer.ts:86-89`, la funzione `isBotPro()` usa erroneamente `isAdk`:

```typescript
// ❌ SBAGLIATO - isAdk NON indica PRO
export function isBotPro(botProps: BotProps): boolean {
  return botProps.isAdk === true
}
```

### Soluzione

Rimuovere `isBotPro()` completamente. Il backend manda `icon` e `unbranded` **solo** se il bot è PRO. Il frontend li usa
se presenti, altrimenti no.

```typescript
// ✅ CORRETTO - nessuna logica PRO nel frontend
// Il backend decide cosa mandare
if (botProps.icon) {
  props.icon = botProps.icon  // Usalo direttamente
}
if (botProps.unbranded) {
  props.unbranded = botProps.unbranded
}
```

### File da modificare

**`src/types/props.ts`:**

- Rimuovere `PRO_ONLY_PROPS` constant
- Rimuovere `isProOnlyProp()` function

**`src/utils/props-transformer.ts`:**

- Rimuovere `isBotPro()` function
- Rimuovere `splitPropsByPriority()` function
- Semplificare `transformBotPropsToTolkiProps()` - usare `icon`/`unbranded` direttamente

**`src/services/props-manager.ts`:**

- Rimuovere `PropsPriority.PRO_BACKEND` (4 livelli → 3 livelli)
- Rimuovere `setProBackendProps()` method
- Rimuovere `isPro` flag da `PropsSource` interface
- Rimuovere check `isProOnlyProp()` in `parseUserAttributes()` e `mergeProps()`
- Semplificare: USER_ATTRIBUTES > BACKEND > DEFAULTS

### Sistema priorità semplificato

```typescript
// PRIMA (4 livelli)
enum PropsPriority {
  PRO_BACKEND = 4,      // ❌ Rimuovere
  USER_ATTRIBUTES = 3,
  STANDARD_BACKEND = 2,
  DEFAULTS = 1,
}

// DOPO (3 livelli)
enum PropsPriority {
  USER_ATTRIBUTES = 3,  // HTML attrs / JS API
  BACKEND = 2,          // API response (include tutto, anche icon/unbranded se PRO)
  DEFAULTS = 1,         // Fallback
}
```

---

# Piano di Implementazione

## Opzione A: Breaking Change Immediato

**Frontend:**

1. Aggiornare `props-transformer.ts` per leggere nuova struttura
2. Rimuovere supporto per `styles.chat`
3. Aggiornare `BotProps` interface

**Backend:**

1. Migrare tutti i bot esistenti alla nuova struttura
2. Aggiornare API per accettare/restituire nuova struttura
3. Rimuovere campi obsoleti dal database

**Rischio:** Bot esistenti smettono di funzionare fino a migrazione

---

## Opzione B: Migrazione Graduale (Consigliata)

### Fase 1: Frontend supporta entrambe

```typescript
// props-transformer.ts
function getToggleBackground(styles: any): HexColor | undefined {
  // Nuova struttura (priorità)
  if (styles?.toggle?.background) {
    return styles.toggle.background
  }
  // Legacy fallback
  if (styles?.chat?.button?.defaultBackgroundColor) {
    return styles.chat.button.defaultBackgroundColor
  }
  return undefined
}
```

### Fase 2: Backend migra gradualmente

- Nuovi bot usano nuova struttura
- Bot esistenti migrati in background
- API accetta entrambi i formati

### Fase 3: Deprecation warning

- Frontend logga warning per struttura legacy
- Dashboard mostra avviso per bot non migrati

### Fase 4: Rimozione legacy

- Frontend rimuove fallback
- Backend rifiuta struttura legacy

---

# Checklist Implementazione

## Frontend (tolki-embed)

### Types

- [ ] `src/types/bot.ts` - aggiornare interface `BotProps` con nuova struttura `styles`
- [ ] `src/types/props.ts` - rimuovere `version`, `team`, `PRO_ONLY_PROPS`, `isProOnlyProp()`

### Transformer

- [ ] `src/utils/props-transformer.ts` - rimuovere `isBotPro()`, `splitPropsByPriority()`
- [ ] `src/utils/props-transformer.ts` - aggiornare mapping per nuova struttura `styles`
- [ ] `src/utils/props-transformer.ts` - supportare fallback legacy `styles.chat.*`

### Props Manager

- [ ] `src/services/props-manager.ts` - rimuovere `PropsPriority.PRO_BACKEND`
- [ ] `src/services/props-manager.ts` - rimuovere `setProBackendProps()`
- [ ] `src/services/props-manager.ts` - rimuovere `isPro` flag e relativi check
- [ ] `src/services/props-manager.ts` - semplificare a 3 livelli priorità

### Testing

- [ ] Testare con struttura legacy `styles.chat.*`
- [ ] Testare con nuova struttura `styles.toggle.*`, `styles.message.*`
- [ ] Testare fallback automatico
- [ ] Verificare warning per struttura deprecata

## Backend (da fare separatamente)

- [ ] Aggiornare schema database per nuova struttura `styles`
- [ ] Migrare bot esistenti (script migrazione)
- [ ] Aggiornare API endpoints
- [ ] Aggiornare dashboard di configurazione
- [ ] Aggiungere nuove root props (`expandable`, `unclosable`, `toasts`, etc.)

---

# TypeScript Interfaces Finali

```typescript
// === Types ===

type HexColor = `#${string}`
type I18nString = string | { [lang: string]: string }
type I18nArray = string[] | { [lang: string]: string }[]

// === Styles ===

interface ToggleStyles {
  size?: 'sm' | 'md' | 'lg'
  background?: HexColor
  foreground?: HexColor | null
}

interface WindowStyles {
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

interface MessageStyles {
  background?: HexColor
  foreground?: HexColor | null
}

interface BackdropStyles {
  color?: HexColor | null
  opacity?: number
  blur?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
}

interface StylesConfig {
  // Globali
  position?: 'inline' | 'left' | 'center' | 'right'
  margin?: number | [number, number]
  dark?: 'auto' | 'light' | 'dark'
  rounded?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'

  // Per elemento
  toggle?: ToggleStyles
  window?: WindowStyles
  message?: MessageStyles
  backdrop?: BackdropStyles
}

// === Main Interface ===

interface BotProps {
  // Identità
  name: string
  avatar?: string

  // Comportamento
  defaultOpen?: boolean
  expandable?: boolean
  unclosable?: boolean

  // Contenuto
  welcomeMessage?: I18nString
  suggestions?: I18nArray
  toasts?: I18nArray
  messagePlaceholder?: I18nString
  togglePlaceholder?: I18nString

  // i18n
  lang?: string
  locales?: string[]

  // PRO (il backend manda questi campi solo se il bot è PRO)
  icon?: string
  unbranded?: boolean

  // API routing (determina quale backend usare, NON è correlato a PRO)
  isAdk?: boolean

  // Stili
  styles?: StylesConfig
}
```
