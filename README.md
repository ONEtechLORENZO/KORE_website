# KORE — sito web

Sito di KORE (One Tech), in italiano con interruttore IT / EN.

## Struttura

| Percorso | Cosa contiene |
|---|---|
| `index.html` | il sito completo: tutte le pagine, stili e script in un unico file |
| `Public/` | immagini e loghi usati dal sito |
| `acquista/` | percorso d'acquisto (build di `kore-react`, servito su `/acquista/`) |
| `kore-react/` | sorgente React + Vite del percorso d'acquisto e del trasloco in React |
| `kore-vtiger-apps-script.gs` | ponte Google Apps Script verso il CRM vtiger (la chiave sta nelle Script Properties, non nel codice) |
| `kore-k-animation.html` | animazione della K, da sola |
| `favicon.svg` | icona del sito |

## Provarlo in locale

    python -m http.server 4010 --bind 127.0.0.1

poi apri http://127.0.0.1:4010 (inglese: http://127.0.0.1:4010/?lang=en).

## Aggiornare `acquista/`

    cd kore-react
    npm install
    npm run build
    # poi copia il contenuto di kore-react/dist/ dentro acquista/
