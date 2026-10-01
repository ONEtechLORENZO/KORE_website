# KORE — sito in React

Trasloco del sito da `index.html` (un unico file da 1,23 MB) a React + Vite.
Il file originale **resta intatto e funzionante**: questo progetto vive a fianco,
non al posto suo, finche' il trasloco non e' completo.

## Comandi

    npm install
    npm run dev       # sviluppo, porta 4020
    npm run build     # pacchetto di produzione in dist/
    npm run preview   # prova il pacchetto
    node test/crm.test.mjs   # prova che i dati inviati al CRM non siano cambiati

## Come e' organizzato

    src/
      main.jsx            avvio
      App.jsx             intestazione + schermata aperta
      shared/
        routes.js         le 7 schermate vive e i loro indirizzi
        useHashRoute.js   una schermata per volta, decisa dall'hash
        useTheme.js       chiaro / scuro
        useHeaderHeight.js  --top-h: altezza vera dell'intestazione
        useClock.js       orologio di Milano
        Header.jsx        intestazione
        Screen.jsx        contenitore delle schermate sovrapposte
        crm.js            ponte verso il CRM  <-- codice delicato
      screens/            una cartella per schermata
      styles/base.css     colori e fondamenta comuni
    test/crm.test.mjs     confronto con la logica originale

## Il punto delicato: il CRM

`src/shared/crm.js` e' l'unico pezzo che, se cambia, fa sparire i lead.
Regole da non toccare:

- i campi inviati sono **esattamente sei**: `nome`, `azienda`, `email`,
  `telefono`, `problema`, `website`;
- la chiamata va in `no-cors` e **senza Content-Type**, altrimenti parte il
  preflight che Apps Script non gestisce;
- `website` e' la trappola per i robot: deve restare vuota;
- **la chiave dell'HTTP Handler non sta nel sito** e non deve mai entrarci:
  vive nelle proprieta' del progetto Apps Script.

`node test/crm.test.mjs` confronta il modulo con la trascrizione letterale del
codice originale: se qualcuno cambia un nome di campo o il formato del testo,
la prova fallisce.

## Cosa e' stato lasciato fuori, e perche'

In `index.html` restavano **otto schermate superate**: `why`, `why2`, `fn`,
`fn2`, `fn3`, `fl`, `ck`, `pt`. In tutto **866 righe di JavaScript** piu' CSS e
markup. I loro bottoni erano gia' nascosti da due regole CSS e nessun indirizzo
le raggiungeva: non sono state portate.

Le schermate vive sono sette: `why3` (Perche' KORE?), `fn4` (Prodotto),
`fl2` (Come funziona), `ck2` (Con KORE), `ab` (Chi siamo), `dm` (Contatti),
`tc` (Privacy, raggiunta solo dal link nel consenso).

## Stato del trasloco

| pezzo | stato |
|---|---|
| struttura, intestazione, rotte, tema, orologio | fatto |
| Contatti + invio al CRM | fatto e verificato |
| Home: testo e impaginazione | fatto |
| Home: motore della scena su canvas (~370 righe) | da spostare in `src/engines/` |
| Perche' KORE?, Prodotto, Come funziona, Con KORE, Chi siamo, Privacy | da trasferire |
| CSS per schermata (dalle 3.501 righe originali) | da estrarre |

### Come vanno trasferite le schermate

Il sito disegna quasi tutto a mano: canvas, SVG generati come stringhe, classi
aggiunte allo scorrimento. Quel codice **non va riscritto in forma dichiarativa**:
sarebbe una riscrittura, non un trasloco, ed e' li' che nascerebbero i difetti.
Ogni schermata diventa un componente che possiede un nodo e lancia il proprio
codice imperativo dentro `Screen`, tramite `onAperta(nodo)`, restituendo la
funzione di pulizia. React si occupa di rotte, montaggio, tema e moduli.
