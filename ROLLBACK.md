# Rollback Instructions

**Data merge**: 2024-12-30
**Branch mergiata**: `2025-12` → `main`
**Commit PRIMA del merge**: `d89e37b`
**Commit DOPO il merge**: `8a61a0c`

---

## Se qualcosa non funziona

Esegui questi comandi per tornare alla versione precedente:

```bash
git checkout main
git reset --hard d89e37b
git push --force origin main
```

---

## Cosa fa questo rollback

1. Riporta `main` al commit `d89e37b` (fix: handle mobile scroll errors)
2. Annulla tutte le modifiche del merge (prop system, PostCSS migration, etc.)

---

## Dopo il rollback

- Elimina questo file
- Investiga il problema sulla branch `2025-12`
- Quando risolto, rifai il merge

---

**Elimina questo file quando non serve più.**
