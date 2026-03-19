# Documentazione Attributi `<tolki-chat>`

Guida completa a tutti gli attributi HTML disponibili per il componente `<tolki-chat>`.

> **Nota:** Gli attributi HTML usano il formato kebab-case (es. `default-open`), che internamente viene convertito in camelCase (es. `defaultOpen`). Gli attributi impostati via HTML hanno **priorità massima** e sovrascrivono i valori provenienti dal backend.

---

## Indice

- [bot](#bot) - Identificativo del bot
- [position](#position) - Posizionamento del widget
- [window-size](#window-size) - Dimensione della finestra di chat
- [toggle-size](#toggle-size) - Dimensione del pulsante di apertura
- [margin](#margin) - Margine del widget
- [default-open](#default-open) - Apertura automatica
- [expandable](#expandable) - Espandibilità della finestra
- [unclosable](#unclosable) - Impedisce la chiusura
- [dark](#dark) - Modalità scura
- [rounded](#rounded) - Arrotondamento dei bordi
- [avatar](#avatar) - Immagine avatar del bot
- [backdrop-color](#backdrop-color) - Colore dello sfondo overlay
- [backdrop-opacity](#backdrop-opacity) - Opacità dello sfondo overlay
- [backdrop-blur](#backdrop-blur) - Sfocatura dello sfondo overlay
- [toggle-background](#toggle-background) - Colore di sfondo del pulsante
- [toggle-content](#toggle-content) - Colore del contenuto del pulsante
- [message-background](#message-background) - Colore di sfondo dei messaggi utente
- [message-content](#message-content) - Colore del testo dei messaggi utente
- [icon](#icon) - Icona personalizzata (PRO)
- [unbranded](#unbranded) - Rimuovi il branding Tolki (PRO)
- [name](#name) - Nome del bot
- [message-placeholder](#message-placeholder) - Placeholder dell'area di testo
- [toggle-placeholder](#toggle-placeholder) - Testo sul pulsante di apertura
- [welcome-message](#welcome-message) - Messaggio di benvenuto
- [suggestions](#suggestions) - Suggerimenti rapidi
- [toasts](#toasts) - Messaggi toast
- [lang](#lang) - Lingua dell'interfaccia
- [locales](#locales) - Lingue disponibili
- [inline](#inline) - Modalità inline (deprecato)

---

## `bot`

Identificativo UUID del bot. **Attributo obbligatorio** per l'inizializzazione del componente. Quando viene impostato, il componente si connette al backend Tolki per recuperare la configurazione del bot.

| Proprietà | Valore |
|-----------|--------|
| **Tipo** | `string` (UUID) |
| **Obbligatorio** | Si |
| **Default** | — |

```html
<tolki-chat bot="550e8400-e29b-41d4-a716-446655440000"></tolki-chat>
```

---

## `position`

Posizionamento del widget nella pagina. Determina dove viene visualizzato il pulsante di apertura e la finestra di chat.

| Proprietà | Valore |
|-----------|--------|
| **Tipo** | `'inline'` \| `'left'` \| `'center'` \| `'right'` |
| **Default** | `'right'` |

- `right` — Angolo in basso a destra (posizione classica per i widget di chat)
- `left` — Angolo in basso a sinistra
- `center` — Centrato in basso
- `inline` — Incorporato direttamente nel flusso della pagina (senza pulsante di apertura)

```html
<!-- Widget in basso a destra (default) -->
<tolki-chat bot="..." position="right"></tolki-chat>

<!-- Widget in basso a sinistra -->
<tolki-chat bot="..." position="left"></tolki-chat>

<!-- Widget centrato -->
<tolki-chat bot="..." position="center"></tolki-chat>

<!-- Incorporato nella pagina, senza toggle -->
<tolki-chat bot="..." position="inline"></tolki-chat>
```

---

## `window-size`

Dimensione della finestra di chat quando è aperta.

| Proprietà | Valore |
|-----------|--------|
| **Tipo** | `'sm'` \| `'md'` \| `'lg'` \| `'xl'` |
| **Default** | `'sm'` |

```html
<!-- Finestra piccola -->
<tolki-chat bot="..." window-size="sm"></tolki-chat>

<!-- Finestra media -->
<tolki-chat bot="..." window-size="md"></tolki-chat>

<!-- Finestra grande -->
<tolki-chat bot="..." window-size="lg"></tolki-chat>

<!-- Finestra molto grande -->
<tolki-chat bot="..." window-size="xl"></tolki-chat>
```

---

## `toggle-size`

Dimensione del pulsante circolare che apre/chiude la chat.

| Proprietà | Valore |
|-----------|--------|
| **Tipo** | `'sm'` \| `'md'` \| `'lg'` |
| **Default** | `'md'` |

```html
<!-- Pulsante piccolo -->
<tolki-chat bot="..." toggle-size="sm"></tolki-chat>

<!-- Pulsante medio (default) -->
<tolki-chat bot="..." toggle-size="md"></tolki-chat>

<!-- Pulsante grande -->
<tolki-chat bot="..." toggle-size="lg"></tolki-chat>
```

---

## `margin`

Margine del widget rispetto ai bordi della pagina, espresso in pixel. Supporta un valore singolo (applicato a tutti i lati) oppure due valori separati per asse X e Y.

| Proprietà | Valore |
|-----------|--------|
| **Tipo** | `number` \| `[number, number]` |
| **Default** | `20` |

**Formati supportati:**
- Numero singolo: `"20"` — margine uguale su tutti i lati
- Due valori separati da virgola: `"20,30"` — margine X=20px, Y=30px
- Array JSON: `"[20,30]"` — margine X=20px, Y=30px

```html
<!-- Margine di 20px su tutti i lati -->
<tolki-chat bot="..." margin="20"></tolki-chat>

<!-- Margine X=10px, Y=30px -->
<tolki-chat bot="..." margin="10,30"></tolki-chat>

<!-- Margine con formato JSON -->
<tolki-chat bot="..." margin="[15,25]"></tolki-chat>

<!-- Nessun margine -->
<tolki-chat bot="..." margin="0"></tolki-chat>
```

---

## `default-open`

Se impostato, la finestra di chat si apre automaticamente al caricamento della pagina.

| Proprietà | Valore |
|-----------|--------|
| **Tipo** | `boolean` |
| **Default** | `true` |

```html
<!-- Chat aperta al caricamento -->
<tolki-chat bot="..." default-open></tolki-chat>
<tolki-chat bot="..." default-open="true"></tolki-chat>

<!-- Chat chiusa al caricamento -->
<tolki-chat bot="..." default-open="false"></tolki-chat>
```

---

## `expandable`

Permette all'utente di espandere la finestra di chat a schermo intero.

| Proprietà | Valore |
|-----------|--------|
| **Tipo** | `boolean` |
| **Default** | `true` |

```html
<!-- Espansione abilitata (default) -->
<tolki-chat bot="..." expandable></tolki-chat>

<!-- Espansione disabilitata -->
<tolki-chat bot="..." expandable="false"></tolki-chat>
```

---

## `unclosable`

Se attivato, l'utente non può chiudere la finestra di chat. Utile per widget inline o quando la chat deve rimanere sempre visibile.

| Proprietà | Valore |
|-----------|--------|
| **Tipo** | `boolean` |
| **Default** | `false` |

```html
<!-- La chat non può essere chiusa -->
<tolki-chat bot="..." unclosable></tolki-chat>

<!-- Comportamento standard (chiudibile) -->
<tolki-chat bot="..." unclosable="false"></tolki-chat>
```

---

## `dark`

Controlla la modalità scura del widget.

| Proprietà | Valore |
|-----------|--------|
| **Tipo** | `'auto'` \| `'light'` \| `'dark'` |
| **Default** | `'auto'` |

- `auto` — Segue le preferenze del sistema operativo (`prefers-color-scheme`)
- `light` — Forza la modalità chiara
- `dark` — Forza la modalità scura

```html
<!-- Segue le impostazioni di sistema (default) -->
<tolki-chat bot="..." dark="auto"></tolki-chat>

<!-- Sempre in modalità chiara -->
<tolki-chat bot="..." dark="light"></tolki-chat>

<!-- Sempre in modalità scura -->
<tolki-chat bot="..." dark="dark"></tolki-chat>
```

---

## `rounded`

Controlla l'arrotondamento dei bordi del widget.

| Proprietà | Valore |
|-----------|--------|
| **Tipo** | `'none'` \| `'xs'` \| `'sm'` \| `'md'` \| `'lg'` \| `'xl'` |
| **Default** | `'xl'` |

| Valore | Pixel |
|--------|-------|
| `none` | 0px |
| `xs` | 5px |
| `sm` | 10px |
| `md` | 15px |
| `lg` | 20px |
| `xl` | 25px |

```html
<!-- Bordi molto arrotondati (default) -->
<tolki-chat bot="..." rounded="xl"></tolki-chat>

<!-- Bordi squadrati -->
<tolki-chat bot="..." rounded="none"></tolki-chat>

<!-- Bordi leggermente arrotondati -->
<tolki-chat bot="..." rounded="sm"></tolki-chat>
```

---

## `avatar`

URL dell'immagine avatar mostrata accanto al nome del bot nell'header della chat.

| Proprietà | Valore |
|-----------|--------|
| **Tipo** | `string` (URL) |
| **Default** | `null` |

```html
<tolki-chat bot="..." avatar="https://example.com/bot-avatar.png"></tolki-chat>
```

---

## `backdrop-color`

Colore dello sfondo overlay che appare dietro la finestra di chat quando è aperta (solo su mobile o in modalità fullscreen). Formato colore esadecimale.

| Proprietà | Valore |
|-----------|--------|
| **Tipo** | `HexColor` |
| **Default** | `null` (usa il colore di sistema) |

```html
<!-- Overlay nero -->
<tolki-chat bot="..." backdrop-color="#000000"></tolki-chat>

<!-- Overlay blu scuro -->
<tolki-chat bot="..." backdrop-color="#1a1a2e"></tolki-chat>
```

---

## `backdrop-opacity`

Opacità dello sfondo overlay, da 0 (trasparente) a 1 (opaco).

| Proprietà | Valore |
|-----------|--------|
| **Tipo** | `number` (0-1) |
| **Default** | `0.5` |

```html
<!-- Overlay semi-trasparente (default) -->
<tolki-chat bot="..." backdrop-opacity="0.5"></tolki-chat>

<!-- Overlay quasi trasparente -->
<tolki-chat bot="..." backdrop-opacity="0.2"></tolki-chat>

<!-- Overlay opaco -->
<tolki-chat bot="..." backdrop-opacity="0.9"></tolki-chat>
```

---

## `backdrop-blur`

Intensità dell'effetto sfocatura (blur) dello sfondo overlay.

| Proprietà | Valore |
|-----------|--------|
| **Tipo** | `'none'` \| `'sm'` \| `'md'` \| `'lg'` \| `'xl'` |
| **Default** | `'md'` |

```html
<!-- Nessuna sfocatura -->
<tolki-chat bot="..." backdrop-blur="none"></tolki-chat>

<!-- Sfocatura media (default) -->
<tolki-chat bot="..." backdrop-blur="md"></tolki-chat>

<!-- Sfocatura intensa -->
<tolki-chat bot="..." backdrop-blur="xl"></tolki-chat>
```

---

## `toggle-background`

Colore di sfondo del pulsante circolare (toggle) che apre la chat. Formato colore esadecimale.

| Proprietà | Valore |
|-----------|--------|
| **Tipo** | `HexColor` |
| **Default** | `'#001ccb'` |

> **Nota:** Il colore hover viene generato automaticamente (scurendo o schiarendo del 8% circa il colore base).

```html
<!-- Pulsante rosso -->
<tolki-chat bot="..." toggle-background="#e74c3c"></tolki-chat>

<!-- Pulsante verde -->
<tolki-chat bot="..." toggle-background="#27ae60"></tolki-chat>

<!-- Pulsante nero -->
<tolki-chat bot="..." toggle-background="#000000"></tolki-chat>
```

---

## `toggle-content`

Colore del contenuto (icona/testo) all'interno del pulsante toggle. Se non specificato, viene generato automaticamente in base alla luminosità di `toggle-background` (bianco per sfondi scuri, nero per sfondi chiari).

| Proprietà | Valore |
|-----------|--------|
| **Tipo** | `HexColor` |
| **Default** | auto-generato da `toggle-background` |

```html
<!-- Icona bianca su sfondo rosso -->
<tolki-chat bot="..." toggle-background="#e74c3c" toggle-content="#ffffff"></tolki-chat>

<!-- Icona personalizzata -->
<tolki-chat bot="..." toggle-background="#f1c40f" toggle-content="#2c3e50"></tolki-chat>
```

---

## `message-background`

Colore di sfondo delle bolle dei messaggi inviati dall'utente. Formato colore esadecimale.

| Proprietà | Valore |
|-----------|--------|
| **Tipo** | `HexColor` |
| **Default** | `'#001ccb'` |

```html
<!-- Messaggi utente verdi -->
<tolki-chat bot="..." message-background="#27ae60"></tolki-chat>

<!-- Messaggi utente viola -->
<tolki-chat bot="..." message-background="#8e44ad"></tolki-chat>
```

---

## `message-content`

Colore del testo dei messaggi inviati dall'utente. Se non specificato, viene generato automaticamente in base alla luminosità di `message-background`.

| Proprietà | Valore |
|-----------|--------|
| **Tipo** | `HexColor` |
| **Default** | auto-generato da `message-background` |

```html
<!-- Testo nero su sfondo chiaro -->
<tolki-chat bot="..." message-background="#ecf0f1" message-content="#2c3e50"></tolki-chat>

<!-- Testo personalizzato -->
<tolki-chat bot="..." message-background="#2c3e50" message-content="#1abc9c"></tolki-chat>
```

---

## `icon`

URL di un'icona personalizzata da mostrare nel pulsante toggle al posto dell'icona predefinita. **Funzionalità PRO** — il backend invia questo valore solo per i bot con piano PRO attivo.

| Proprietà | Valore |
|-----------|--------|
| **Tipo** | `string` (URL) |
| **Default** | `null` |

```html
<tolki-chat bot="..." icon="https://example.com/custom-icon.svg"></tolki-chat>
```

---

## `unbranded`

Rimuove il branding "Powered by Tolki" dal fondo della chat. **Funzionalità PRO** — il backend invia questo valore solo per i bot con piano PRO attivo.

| Proprietà | Valore |
|-----------|--------|
| **Tipo** | `boolean` |
| **Default** | `false` |

```html
<!-- Rimuovi il branding Tolki -->
<tolki-chat bot="..." unbranded></tolki-chat>
<tolki-chat bot="..." unbranded="true"></tolki-chat>
```

---

## `name`

Nome del bot visualizzato nell'header della finestra di chat. Supporta l'internazionalizzazione (i18n) per mostrare nomi diversi in base alla lingua.

| Proprietà | Valore |
|-----------|--------|
| **Tipo** | `string` \| `I18nString` |
| **Default** | `''` |

**Formati supportati:**
- Stringa semplice: `"Assistente"`
- Oggetto JSON con chiavi lingua: `'{"en":"Assistant","it":"Assistente"}'`
- Formato pipe: `"en:Assistant|it:Assistente|es:Asistente"`

```html
<!-- Nome semplice -->
<tolki-chat bot="..." name="Assistente Tolki"></tolki-chat>

<!-- Nome multilingua (formato JSON) -->
<tolki-chat bot="..." name='{"en":"Assistant","it":"Assistente","es":"Asistente"}'></tolki-chat>

<!-- Nome multilingua (formato pipe) -->
<tolki-chat bot="..." name="en:Assistant|it:Assistente|es:Asistente"></tolki-chat>
```

---

## `message-placeholder`

Testo placeholder mostrato nell'area di input quando è vuota. Supporta i18n.

| Proprietà | Valore |
|-----------|--------|
| **Tipo** | `string` \| `I18nString` |
| **Default** | Multilingua: "Ask anything" / "Chiedi qualsiasi cosa" / etc. |

```html
<!-- Placeholder semplice -->
<tolki-chat bot="..." message-placeholder="Scrivi un messaggio..."></tolki-chat>

<!-- Placeholder multilingua (formato JSON) -->
<tolki-chat bot="..." message-placeholder='{"en":"Type a message...","it":"Scrivi un messaggio..."}'></tolki-chat>

<!-- Placeholder multilingua (formato pipe) -->
<tolki-chat bot="..." message-placeholder="en:Type a message...|it:Scrivi un messaggio..."></tolki-chat>
```

---

## `toggle-placeholder`

Testo mostrato accanto al pulsante toggle (utile per aggiungere un'etichetta al pulsante di apertura). Supporta i18n.

| Proprietà | Valore |
|-----------|--------|
| **Tipo** | `string` \| `I18nString` |
| **Default** | `''` (nessun testo) |

```html
<!-- Testo semplice -->
<tolki-chat bot="..." toggle-placeholder="Hai bisogno di aiuto?"></tolki-chat>

<!-- Testo multilingua -->
<tolki-chat bot="..." toggle-placeholder="en:Need help?|it:Hai bisogno di aiuto?"></tolki-chat>
```

---

## `welcome-message`

Messaggio di benvenuto mostrato all'apertura della chat, prima che l'utente scriva qualcosa. Supporta i18n.

| Proprietà | Valore |
|-----------|--------|
| **Tipo** | `string` \| `I18nString` |
| **Default** | `null` (nessun messaggio) |

```html
<!-- Messaggio semplice -->
<tolki-chat bot="..." welcome-message="Ciao! Come posso aiutarti?"></tolki-chat>

<!-- Messaggio multilingua (formato JSON) -->
<tolki-chat bot="..." welcome-message='{"en":"Hi! How can I help?","it":"Ciao! Come posso aiutarti?"}'></tolki-chat>

<!-- Messaggio multilingua (formato pipe) -->
<tolki-chat bot="..." welcome-message="en:Hi! How can I help?|it:Ciao! Come posso aiutarti?"></tolki-chat>
```

---

## `suggestions`

Lista di suggerimenti rapidi mostrati sotto il messaggio di benvenuto. L'utente può cliccarli per inviare velocemente un messaggio predefinito. Supporta i18n per array.

| Proprietà | Valore |
|-----------|--------|
| **Tipo** | `string[]` \| `I18nArray` |
| **Default** | `[]` (nessun suggerimento) |

**Formati supportati:**
- Lista separata da virgole: `"Prezzi,Assistenza,Contatti"`
- Array JSON: `'["Prezzi","Assistenza","Contatti"]'`
- Array JSON con i18n: `'[{"en":"Prices","it":"Prezzi"},{"en":"Support","it":"Assistenza"}]'`
- Formato pipe separato da virgole: `"en:Prices|it:Prezzi,en:Support|it:Assistenza"`

```html
<!-- Suggerimenti semplici -->
<tolki-chat bot="..." suggestions="Prezzi,Assistenza,Contatti"></tolki-chat>

<!-- Suggerimenti come array JSON -->
<tolki-chat bot="..." suggestions='["Quanto costa?","Come funziona?","Contattaci"]'></tolki-chat>

<!-- Suggerimenti multilingua (formato JSON) -->
<tolki-chat bot="..." suggestions='[{"en":"Pricing","it":"Prezzi"},{"en":"How it works","it":"Come funziona"}]'></tolki-chat>

<!-- Suggerimenti multilingua (formato pipe) -->
<tolki-chat bot="..." suggestions="en:Pricing|it:Prezzi,en:How it works|it:Come funziona"></tolki-chat>
```

---

## `toasts`

Lista di messaggi toast che vengono mostrati come notifiche temporanee. Supporta i18n per array.

| Proprietà | Valore |
|-----------|--------|
| **Tipo** | `string[]` \| `I18nArray` |
| **Default** | `[]` (nessun toast) |

I formati supportati sono gli stessi di [`suggestions`](#suggestions).

```html
<!-- Toast semplici -->
<tolki-chat bot="..." toasts="Benvenuto!,Hai bisogno di aiuto?"></tolki-chat>

<!-- Toast multilingua -->
<tolki-chat bot="..." toasts='[{"en":"Welcome!","it":"Benvenuto!"},{"en":"Need help?","it":"Hai bisogno di aiuto?"}]'></tolki-chat>
```

---

## `lang`

Lingua dell'interfaccia del widget. Questo attributo è **bidirezionale**: può essere impostato via HTML e viene aggiornato automaticamente quando l'utente cambia lingua dalla chat.

| Proprietà | Valore |
|-----------|--------|
| **Tipo** | `string` (codice lingua ISO) |
| **Default** | `'en'` |

Lingue supportate di default: `en`, `it`, `es`, `fr`, `de`, `pt`.

```html
<!-- Interfaccia in italiano -->
<tolki-chat bot="..." lang="it"></tolki-chat>

<!-- Interfaccia in spagnolo -->
<tolki-chat bot="..." lang="es"></tolki-chat>

<!-- Interfaccia in francese -->
<tolki-chat bot="..." lang="fr"></tolki-chat>
```

---

## `locales`

Lista delle lingue disponibili per il selettore lingua nella chat. Se il bot supporta solo alcune lingue, è possibile limitare le opzioni mostrate.

| Proprietà | Valore |
|-----------|--------|
| **Tipo** | `string[]` |
| **Default** | `['en', 'it', 'es', 'fr', 'de', 'pt']` |

**Formati supportati:**
- Lista separata da virgole: `"en,it,es"`
- Array JSON: `'["en","it","es"]'`

```html
<!-- Solo italiano e inglese -->
<tolki-chat bot="..." locales="en,it"></tolki-chat>

<!-- Solo italiano -->
<tolki-chat bot="..." locales="it"></tolki-chat>

<!-- Formato JSON -->
<tolki-chat bot="..." locales='["en","it","fr","de"]'></tolki-chat>
```

---

## `inline`

> **Deprecato** — Usa `position="inline"` al suo posto.

Attributo legacy per attivare la modalità inline (chat incorporata direttamente nella pagina).

| Proprietà | Valore |
|-----------|--------|
| **Tipo** | `boolean` |
| **Default** | `false` |

```html
<!-- Deprecato -->
<tolki-chat bot="..." inline></tolki-chat>

<!-- Usa invece -->
<tolki-chat bot="..." position="inline"></tolki-chat>
```

---

## Esempio completo

Ecco un esempio che utilizza molti degli attributi disponibili:

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

## Sistema di priorità

Gli attributi del componente seguono un sistema di priorità a tre livelli:

1. **Attributi HTML** (priorità massima) — Valori impostati direttamente nel tag HTML
2. **Backend** — Valori ricevuti dall'API Tolki in base alla configurazione del bot
3. **Valori default** (priorità minima) — Valori di fallback predefiniti

Questo significa che un attributo impostato via HTML sovrascrive sempre il valore proveniente dal backend, permettendo una personalizzazione completa lato client.
