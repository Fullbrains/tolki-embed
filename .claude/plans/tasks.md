# Piano di implementazione

## Task 1: Refactor show-docs -> show-sources
- [x] `src/types/props.ts` - Rinominare `showDocs` in `showSources`
- [x] `src/services/props-manager.ts` - Aggiornare case `showDocs` -> `showSources`
- [x] `src/services/api.ts` - Rinominare parametro `showDocs` -> `showSources`
- [x] `src/components/tolki-chat/tolki-chat.ts` - Cambiare attributo `show-docs` -> `show-sources` e riferimenti a `showDocs` -> `showSources`

## Task 2: Nuova prop show-queries
- [x] `src/types/props.ts` - Aggiungere `showQueries: boolean` con default `false`
- [x] `src/services/props-manager.ts` - Aggiungere case per `showQueries`
- [x] `src/components/tolki-chat/tolki-chat.ts` - Aggiungere `show-queries` a `observedAttributes`
- [x] `src/components/tolki-chat/templates/sources-overlay.ts` - Mostrare query, search_id (query) e search_id (results) quando `showQueries=true`
- [x] `src/components/tolki-chat/templates/toolbar.ts` - Passare `showQueries` alla funzione di apertura overlay
- [x] Aggiungere stili per le etichette search_id differenziate
- [x] Aggiungere traduzioni per le nuove etichette

## Task 3: Sources overlay come popover/sidebar
- [x] Rifattorizzare `sources-overlay.ts` per renderizzare fuori dal `.tk__window`
- [x] Posizionamento intelligente basato sulla posizione dell'embed (left/center/right)
- [x] Aggiornare gli stili CSS per il nuovo posizionamento
- [x] Gestire la chiusura con click esterno

## Task 4: Nuovo item type=Feedback nella chat
- [x] `src/types/item.ts` - Aggiungere `feedback` a `ItemType` e interfaccia `FeedbackResponse`
- [x] `src/services/item-builder.ts` - Aggiungere metodo `feedback()`
- [x] Creare `src/components/tolki-chat/templates/feedback.ts` - Template con textarea, char counter, pulsanti Submit/Cancel
- [x] `src/components/tolki-chat/templates/item.ts` - Aggiungere routing per tipo feedback
- [x] Aggiungere stili CSS per il feedback widget
- [x] Aggiungere traduzioni in tutte le lingue (placeholder, submit, cancel)

## Task 5: Pulsante Feedback nella toolbar + API

- [x] `src/components/tolki-chat/templates/toolbar-icons.ts` - Aggiungere `feedbackIcon()`
- [x] `src/components/tolki-chat/templates/toolbar.ts` - Aggiungere pulsante Feedback
- [x] `src/services/api.ts` - Estendere `messageFeedback` per includere messaggio di testo
- [x] Collegare il flusso: click Feedback -> mostra item Feedback nella chat -> submit -> API call

## Task 6: Audit dipendenze
- [x] Verificare package.json per aggiornamenti disponibili
- [x] Verificare dipendenze incluse inutilmente
  - Rimosso: `@fntools/crypto`, `feed-view`, `rollup-plugin-string` (non usati)
  - Spostato in devDependencies: `@rollup/plugin-terser`, `@types/tinycolor2`, `@typescript-eslint/*`, `eslint-plugin-*`, `rollup-plugin-html-literals`
  - Aggiornamenti disponibili segnalati (non applicati per evitare breaking changes)

## Task 7: Aggiornare documentazione
- [x] Aggiornare docs in tolki-docs per show-docs -> show-sources
- [x] Aggiungere docs per show-queries
- [x] Aggiornare docs API feedback
