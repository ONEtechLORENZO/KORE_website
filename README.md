# KORE — repository dei siti web

Questo repository contiene **due siti separati**, pubblicati su **due domini diversi**.
Non hanno link tra loro e non condividono file: ognuno ha la propria cartella radice.

| Sito | Dominio | Cartella da pubblicare (web root) | Cosa contiene |
|---|---|---|---|
| **1. Sito KORE** | `kore-hub.otech.one` | **la radice del repository** (`/`) | pagina "coming soon", sito completo, richiesta demo, percorso d'acquisto |
| **2. Trust Center** | `trust.kore-hub.otech.one` | **solo la cartella `trust/`** | documenti legali e privacy, sub-responsabili, sicurezza, archivio versioni |

Entrambi sono **siti statici** (solo HTML, CSS, JS, immagini, PDF): nessun server applicativo, nessun database, nessun build da eseguire sul server.

> **Nota sul dominio del Trust Center:** il codice usa `trust.kore-hub.otech.one`
> (costante `SITE` in `trust-src/build.py`, stampata nel riquadro "Indirizzo permanente di questa versione" di ogni documento).
> Se si sceglie un altro sottodominio (es. `trustcenter.kore-hub.otech.one`), va cambiata `SITE` e rigenerato il sito (vedi sotto).

---

## 1. Sito KORE → `kore-hub.otech.one`

Web root = radice del repository. Si pubblicano questi file e cartelle:

| Percorso | URL | Cosa contiene |
|---|---|---|
| `index.html` | `/` | pagina **"coming soon"** (il sito è nascosto dietro questa pagina) con il pulsante "Per saperne di più" |
| `sito.html` | `/sito.html` | il **sito completo** (tutte le pagine, stili e script in un unico file) |
| `richiedi-demo/` | `/richiedi-demo/` | solo il modulo di richiesta demo; carica `/sito.html` in un iframe, quindi `sito.html` deve essere pubblicato |
| `acquista/` | `/acquista/` | percorso d'acquisto (build di `kore-react`) |
| `Public/` | `/Public/...` | immagini, loghi e font usati dal sito |
| `favicon.svg` | `/favicon.svg` | icona del sito |

**Da NON pubblicare su `kore-hub.otech.one`** (sono sorgenti, strumenti o appartengono all'altro sito):

| Percorso | Perché |
|---|---|
| `trust/` | è il Trust Center: va **solo** su `trust.kore-hub.otech.one` |
| `trust-src/` | sorgenti e script del Trust Center, non è un sito |
| `kore-react/` | sorgente React (si pubblica solo la build in `acquista/`) |
| `kore-vtiger-apps-script.gs` | script Google Apps Script per il CRM: vive su Google, non sul web server |
| `README.md`, `.gitignore`, `.git/` | file del repository |
| `kore-k-animation.html`, `funzioni2-page.html` | pagine di prova, non collegate al sito |

### Quando togliere la pagina "coming soon"
Rinominare `sito.html` in `index.html` (sostituendo la pagina coming soon). Il modulo in `richiedi-demo/` punta a `/sito.html`: se il sito torna su `index.html`, aggiornare anche quel percorso.

### Aggiornare `acquista/`

    cd kore-react
    npm install
    npm run build
    # poi copia il contenuto di kore-react/dist/ dentro acquista/

---

## 2. Trust Center → `trust.kore-hub.otech.one`

Web root = **cartella `trust/`** (il suo `index.html` è la home del Trust Center).
Tutto ciò che serve è dentro `trust/`: pagine, CSS, font, loghi e PDF. **Nessuna risorsa esterna** (né font, né script, né cookie): la Cookie policy lo dichiara, quindi non aggiungerne.

| Percorso in `trust/` | URL | Cosa contiene |
|---|---|---|
| `index.html` | `/` | home: panoramica, documenti, sub-responsabili, sicurezza, archivio versioni |
| `<documento>/` | `/<documento>/` | versione corrente del documento |
| `<documento>/v1-0/` | `/<documento>/v1-0/` | **indirizzo permanente** della versione 1.0 (i contratti rimandano a questi URL: non vanno mai eliminati) |
| `uso-ai/`, `registro-modifiche/` | `/uso-ai/` … | pagine informative |
| `assets/` | `/assets/...` | `legal.css`, font, loghi, `pdf/` con i PDF ufficiali dei documenti |

Documenti pubblicati (slug): `termini-e-condizioni`, `service-level-agreement`, `data-processing-agreement`,
`condizioni-uso-utenti`, `privacy-policy`, `informativa-privacy-sito`, `cookie-policy`.

### Come si aggiorna (importante)
I file in `trust/` sono **generati**: non si modificano a mano.

1. si modificano i testi in `trust-src/content/<documento>/` oppure i dati (versioni, sub-responsabili, sicurezza) in `trust-src/build.py`;
2. si rigenera il sito:

        python trust-src/build.py

3. si pubblica di nuovo la cartella `trust/`.

Una nuova versione di un documento = nuovo file di contenuto + nuova riga in cima alle sue `versions` in `build.py`;
la versione precedente resta online al suo indirizzo permanente.

---

## Provare in locale

    python -m http.server 4010 --bind 127.0.0.1

- Sito KORE: http://127.0.0.1:4010/ (sito completo: http://127.0.0.1:4010/sito.html, inglese: `?lang=en`)
- Trust Center: http://127.0.0.1:4010/trust/
