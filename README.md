# KORE — repository dei siti web

## In short (for DevOps)

This repository holds **two separate static websites**. They share no files and do not link to each other.
There is **no build step on the server**: you only copy folders.

| # | Domain | Status | What it is | Deploy this folder as web root |
|---|---|---|---|---|
| **1** | **`kore-hub.otech.one`** | live | KORE website: "coming soon" page, full site, demo request, purchase flow | **repository root** — minus the excluded paths below |
| **2** | **`trust.kore-hub.otech.one`** | live | KORE **Trust Center**: legal documents, sub-processors, security, version archive | **`trust/` only** |
| — | `trustcenter.kore.otech.one` | **does not exist** (no DNS record, never live) | mentioned by mistake in early document drafts | **nothing to do — do not create it** |

> ⚠️ **There is no `trustcenter.kore-hub.otech.one`.** The Trust Center is **`trust.kore-hub.otech.one`**: that exact name is printed in
> every legal page and PDF ("Indirizzo permanente…") and in signed contracts. Do not create or use any other name for it.

**Never publish these** (on either domain): `trust-src/` (sources, and `trust-src/archivio/` is a private legal evidence archive),
`kore-react/`, `kore-vtiger-apps-script.gs`, `README.md`, `.gitattributes`, `.gitignore`, `.git/`, `*.zip`, `kore-k-animation.html`, `funzioni2-page.html`.
And `trust/` goes **only** on site 2, never on site 1.

**Never change or delete** the versioned Trust Center URLs (`/<documento>/v1-0/`), the short links (`/sla/`, `/dpa/`, `/<documento>/v1.0/`) and the PDFs in `trust/assets/pdf/`: signed contracts point to them.

**Redirects (site 2):** short links like `/sla` already work through small redirect pages inside `trust/` (no server setup needed). For proper HTTP 301s, apply `trust-src/redirect-s3-routing-rules.json` as the S3 bucket's website routing rules (S3 + CloudFront).

**CloudFront cache (both sites):** responses are cached at the edge for one year (`s-maxage=31536000`). After every deploy, create a CloudFront **invalidation for `/*`**; otherwise new pages, `robots.txt` and `sitemap.xml` are not served. See the SEO section below.

## This release: merging `Pranav` into `main` (21 October 2026)

What changes on each domain. Everything not listed stays exactly as it is.

| Domain | What changes for visitors | Files that change |
|---|---|---|
| **1. `kore-hub.otech.one`** | Demo request page `/richiedi-demo/`: the sentence under the title ("Prenota una demo e scopri…") is removed, and the form is always purple, even if the visitor chose the dark theme on the site. The full site `sito.html` and the coming-soon page do **not** change. | `richiedi-demo/index.html` |
| **2. `trust.kore-hub.otech.one`** | **DPA v1.1 published** (approved by the lawyer): new page `/data-processing-agreement/v1-1/` and PDF `KORE_Data_Processing_Agreement_v1.1.pdf`; **v1.0 stays online unchanged** at `/data-processing-agreement/v1-0/` (now "Superseded", with a link to v1.1); home page DPA card, PDF list, Archivio and Cooabit row updated. Page `/uso-ai/` ("Uso dell'AI in KORE"): new texts in sections 01, 02 and 04. Page `/registro-modifiche/`: new lines dated 25 and 21 ottobre 2026. All other documents, PDFs and URLs do **not** change. | `trust/data-processing-agreement/…` (incl. new `v1-1/`, `v1.1/`), `trust/assets/pdf/KORE_Data_Processing_Agreement_v1.1.pdf`, `trust/index.html`, `trust/uso-ai/index.html`, `trust/registro-modifiche/index.html` |
| — (not published) | Nothing: sources and the private evidence archive (copy of the two Trust Center pages before the change). | `trust-src/build.py`, `trust-src/content/pages/uso-ai.html`, `trust-src/archivio/2026-10-21_prima-di-uso-ai/` |

**DPA:** both versions must stay online: v1.1 is the current one; v1.0 is kept for contracts signed on it (the short link `/dpa` keeps pointing to v1.0). Never delete either.

**Check after deploy (and after the CloudFront invalidation):**
- `https://kore-hub.otech.one/richiedi-demo/`: no sentence under "Vuoi vedere KORE in azione?", purple background.
- `https://trust.kore-hub.otech.one/uso-ai/`: section 01 starts with "KORE utilizza l'intelligenza artificiale nei seguenti ambiti:".
- `https://trust.kore-hub.otech.one/registro-modifiche/`: first line "21 ottobre 2026 – Uso dell'AI in KORE…".
- `https://trust.kore-hub.otech.one/data-processing-agreement/v1-1/`: "Versione 1.1 – 25 ottobre 2026", Active; Annex C, Cooabit row with the new texts.
- `https://trust.kore-hub.otech.one/data-processing-agreement/v1-0/`: still online, "Superseded", notice "Questa versione è stata sostituita dalla versione 1.1".
- `https://trust.kore-hub.otech.one/assets/pdf/KORE_Data_Processing_Agreement_v1.1.pdf` downloads; the v1.0 PDF is still available.

---

Questo repository contiene **due siti separati**, pubblicati su **due domini diversi**.
Non hanno link tra loro e non condividono file: ognuno ha la propria cartella radice.

| Sito | Dominio | Cartella da pubblicare (web root) | Cosa contiene |
|---|---|---|---|
| **1. Sito KORE** | `kore-hub.otech.one` | **la radice del repository** (`/`) | pagina "coming soon", sito completo, richiesta demo, percorso d'acquisto |
| **2. Trust Center** | `trust.kore-hub.otech.one` | **solo la cartella `trust/`** | documenti legali e privacy, sub-responsabili, sicurezza, archivio versioni |
| (inesistente) | `trustcenter.kore.otech.one` | nessuna: il dominio non esiste e non va creato | citato per errore nelle prime bozze dei documenti |

Entrambi sono **siti statici** (solo HTML, CSS, JS, immagini, PDF): nessun server applicativo, nessun database, nessun build da eseguire sul server.

> **Dominio del Trust Center:** è `trust.kore-hub.otech.one` (costante `SITE` in `trust-src/build.py`, stampata nel riquadro
> "Indirizzo permanente di questa versione" di ogni documento e nei PDF). Non esiste `trustcenter.kore-hub.otech.one`.

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
| `favicon.svg`, `favicon.ico`, `favicon-48.png`, `apple-touch-icon.png` | `/favicon.*`, `/apple-touch-icon.png` | icone del sito (scheda del browser, risultati di ricerca, iPhone) |
| `robots.txt`, `sitemap.xml` | `/robots.txt`, `/sitemap.xml` | indicazioni per i motori di ricerca (vedi sezione SEO) |

**Da NON pubblicare su `kore-hub.otech.one`** (sono sorgenti, strumenti o appartengono all'altro sito):

| Percorso | Perché |
|---|---|
| `trust/` | è il Trust Center: va **solo** su `trust.kore-hub.otech.one` |
| `trust-src/` | sorgenti e script del Trust Center, non è un sito; `trust-src/archivio/` è l'archivio legale di prova (copie delle pagine prima delle modifiche): **privato** |
| `kore-react/` | sorgente React (si pubblica solo la build in `acquista/`) |
| `kore-vtiger-apps-script.gs` | script Google Apps Script per il CRM: vive su Google, non sul web server |
| `README.md`, `.gitattributes`, `.gitignore`, `.git/`, `*.zip` | file del repository |
| `kore-k-animation.html`, `funzioni2-page.html` | pagine di prova, non collegate al sito |

### Quando togliere la pagina "coming soon"
Rinominare `sito.html` in `index.html` (sostituendo la pagina coming soon). Il modulo in `richiedi-demo/` punta a `/sito.html`: se il sito torna su `index.html`, aggiornare anche quel percorso.
I tag SEO di `sito.html` sono già scritti per l'indirizzo finale (`https://kore-hub.otech.one/`): dopo il rinomino **non va cambiato nessun tag**. Il resto è nella checklist della sezione SEO qui sotto.

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

### Link brevi e redirect (sul sito 2)

I contratti possono citare link brevi. Ognuno porta alla pagina della **versione esatta** (mai alla pagina generica, che mostra
la versione corrente e cambia quando esce una nuova versione):

| Link | Porta a |
|---|---|
| `/sla` | `/service-level-agreement/v1-0/` |
| `/dpa` | `/data-processing-agreement/v1-0/` |
| `/<documento>/v1.0/` (col punto) | `/<documento>/v1-0/` |

- **Funzionano già senza configurare il server:** `build.py` genera in `trust/` piccole pagine di reindirizzamento (es. `trust/sla/index.html`).
- **301 veri (consigliato):** applicare `trust-src/redirect-s3-routing-rules.json` come *Redirection rules* del sito statico S3
  (S3 → bucket → Properties → Static website hosting). Il file è generato da `build.py`; non va pubblicato.
- **Aggiungere un link breve:** una riga in `SHORT_LINKS` in `trust-src/build.py`, rigenerare, ripubblicare `trust/` e riapplicare le regole S3.
- `trustcenter.kore.otech.one` **non esiste**: non c'è nulla da reindirizzare da quel dominio.

---

## SEO (sito 1, `kore-hub.otech.one`)

Dominio e indirizzo definitivo della home: `https://kore-hub.otech.one/`. Tutti gli indirizzi nei tag sono assoluti.

| Cosa | Dove | Note |
|---|---|---|
| Titolo, descrizione, robots, canonical, Open Graph, Twitter, hreflang, dati strutturati (Organization, WebSite, Service, WebPage) | `<head>` di `sito.html` | Scritti per `https://kore-hub.otech.one/`, cioè per quando `sito.html` diventa `index.html`. Nel `<head>` c'è anche un piccolo script che, con `?lang=en`, porta titolo, descrizione, canonical e anteprime social in inglese (il testo della pagina viene tradotto nel DOM, il `<head>` no). |
| Stessi tag per la fase "coming soon" | `<head>` di `index.html` | Verranno sostituiti dal rinomino. |
| Immagine di anteprima social 1200×630 | `Public/og-image.png` | Usata da LinkedIn, WhatsApp, Slack, X. |
| Pagine **non** indicizzate (`noindex`) | `richiedi-demo/`, `acquista/` | Sono passi del percorso, non pagine da trovare su Google. Per `acquista/` il tag sta in `kore-react/index.html` (sorgente) **e** in `acquista/index.html` (build): se si rigenera la build resta. Per indicizzare `acquista/` basta togliere la riga `<meta name="robots" content="noindex,follow">`. |
| Trust Center | dominio separato | Resta `noindex` (documenti contrattuali con indirizzi permanenti). |

**`robots.txt` e `sitemap.xml`:** non bloccare in `robots.txt` le pagine `noindex`, altrimenti Google non legge il `noindex`.
La sitemap elenca solo la home; aggiornare `<lastmod>` quando cambia in modo importante.

### Checklist il giorno del lancio (20 novembre 2026)

1. Rinominare `sito.html` in `index.html` (la coming soon viene sostituita) e aggiornare l'iframe di `richiedi-demo/` (vedi sopra).
2. Aggiornare `<lastmod>` in `sitemap.xml`.
3. Deploy, poi **invalidazione CloudFront su `/*`** (la cache è di un anno).
4. Controllare `https://kore-hub.otech.one/robots.txt` e `/sitemap.xml` (devono rispondere 200).
5. Search Console: aggiungere la proprietà del dominio `otech.one` (o `kore-hub.otech.one`), inviare `sitemap.xml`, "Controllo URL" sulla home e su `/?lang=en`, poi "Richiedi indicizzazione". Stessa cosa su Bing Webmaster Tools.
6. Provare l'anteprima social: incollare `https://kore-hub.otech.one/` in LinkedIn Post Inspector e in un messaggio WhatsApp.
7. Se `sito.html` era già stato indicizzato prima del lancio, dopo il rinomino risponde 404 e Google lo toglie da solo; la canonical della nuova home punta già a `/`.

### Da sapere
- La pagina è **un solo indirizzo**: le sezioni (`#funzioni`, `#pricing`…) sono schermate dentro la stessa pagina, non pagine separate, quindi Google le vede come un'unica pagina. Per posizionarsi anche su ricerche specifiche (es. "cessione del quinto lead", "automazione prestito personale") servono pagine dedicate con testo proprio: è un lavoro di contenuto, non solo tecnico.
- Il titolo principale (`<h1>`) è "Non serve nascere fintech. Basta KORE.": non contiene parole chiave. Le parole chiave stanno in titolo, descrizione e nel testo delle sezioni.

---

## Provare in locale

    python -m http.server 4010 --bind 127.0.0.1

Senza Python (serve Node): `npx http-server . -p 4010 -a 127.0.0.1 -c-1`

- Sito KORE: http://127.0.0.1:4010/ (sito completo: http://127.0.0.1:4010/sito.html, inglese: `?lang=en`)
- Trust Center: http://127.0.0.1:4010/trust/
