/**
 * KORE — form "Richiedi demo" del sito  ->  workflow vtiger "HTTP CREATE LEADS"
 *
 * Riceve il form della pagina Contatti (kore) e crea il Lead passando dal
 * workflow 29 di Workflow Designer, cosi' si applicano le regole del CRM
 * (tabella SORGENTE SITO, pulizia del telefono, assegnazione). Poi manda la
 * notifica interna a sales@otech.one.
 *
 * Perche' passa da qui e non direttamente dal browser: l'URL dell'HTTP Handler
 * contiene la chiave. Nel codice del sito sarebbe pubblica e chiunque potrebbe
 * avviare il workflow. Qui resta nelle Proprieta script, lato server.
 *
 * CONFIGURAZIONE (una volta sola)
 *   1. vtiger -> Workflow Designer -> Settings HTTP Handler -> nuova Permission
 *      Entry dedicata a KORE (non riusare la chiave del sito One Tech):
 *        Title: Sito Kore
 *        IP's for this permission: *          <- un solo asterisco, niente altro
 *        Trigger: vuoto
 *        Workflow this IP could execute: 29 - HTTP CREATE LEADS
 *      Salva, riapri con la matita e copia la Target URL: la chiave e' la parte
 *      dopo id=. vtiger stampa una doppia barra dopo il dominio: usane una sola.
 *   2. Impostazioni progetto -> Proprieta script -> aggiungi:
 *        VTIGER_HANDLER_URL
 *        https://crm.otech.one/shorturl.php?id=LA_TUA_CHIAVE&direct=1&record_id=0&workflow_id=29
 *      Nessuna parentesi angolare, nessun testo segnaposto: e' l'errore piu'
 *      comune e produce "Link you have used is invalid or has expired".
 *   3. Esegui testWorkflow() dall'editor: deve creare un lead di prova.
 *      Controlla che il lead abbia Lead Source = "Web site Kore" e Mobile Phone
 *      pieni: un lead che compare non basta, sono quei due campi a restare vuoti
 *      quando qualcosa non va. Poi cancella il lead di prova.
 *   4. Distribuisci -> Nuova distribuzione -> App web, Esegui come: Me,
 *      Chi ha accesso: Chiunque. Copia l'URL /exec e incollalo nel sito, in
 *      window.KORE_CRM_ENDPOINT (index.html, primo <script> del body).
 *
 * DEPLOY — importante: NON creare una nuova distribuzione, o cambia l'URL.
 *   Distribuisci -> Gestisci distribuzioni -> matita sulla distribuzione
 *   attuale -> Versione: "Nuova versione" -> Distribuisci.
 *   L'URL /exec resta lo stesso che usa il sito. Aprendolo deve comparire: OK
 */

var NOTIFY = 'sales@otech.one';          // notifica interna; '' per disattivarla
var SENDER_NAME = 'KORE Sito';
var LEAD_SOURCE = 'Web site Kore';       // valore esatto letto dalla tabella SORGENTE SITO
var FORM_NAME = 'SITO KORE';

// Difese contro abusi: il form e' pubblico, l'indirizzo di questo script anche.
var DUPLICATE_WINDOW_SEC = 600;          // stessa email entro 10 minuti: non ricreare il lead
var FLOOD_WINDOW_SEC = 600;              // finestra del limite globale
var FLOOD_MAX = 20;                      // piu' lead di cosi' in 10 minuti = ondata anomala

var MAX_LEN = { nome: 120, azienda: 160, email: 254, telefono: 30, problema: 5000 };

/* ============================================================
   ENDPOINT
   ============================================================ */

function doGet() {
  return ContentService.createTextOutput('OK');
}

function doPost(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOut({ ok: false, error: 'Richiesta non valida' });
  }

  // Trappola per i bot: campo nascosto che una persona non vede e non compila.
  // Al bot si risponde "ok", cosi' non capisce di essere stato scartato.
  if (str(data.website)) {
    Logger.log('SCARTATO dalla trappola (campo website pieno): ' + str(data.website).slice(0, 80));
    return jsonOut({ ok: true });
  }

  // Il sito manda queste cinque chiavi. Ruolo, volume mensile e materiali
  // richiesti arrivano dentro "problema", che finisce nella descrizione del Lead.
  var lead = {
    nome: str(data.nome),
    azienda: str(data.azienda),
    email: str(data.email).toLowerCase(),
    telefono: str(data.telefono),
    problema: str(data.problema)
  };

  // Stessi controlli del browser, ripetuti qui perche' quelli si aggirano:
  // chiunque puo' scrivere direttamente a questo indirizzo saltando la pagina.
  var invalid = validate(lead);
  if (invalid) {
    Logger.log('SCARTATO dai controlli: ' + invalid + ' | ' + JSON.stringify(lead));
    return jsonOut({ ok: false, error: invalid });
  }

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return jsonOut({ ok: false, error: 'Servizio occupato, riprova' });
  try {
    var cache = CacheService.getScriptCache();

    // Doppio invio (doppio clic, "indietro" e reinvio): il lead c'e' gia'.
    var dupKey = 'dup:' + lead.email;
    if (cache.get(dupKey)) {
      Logger.log('SCARTATO come doppione (stessa email entro ' + (DUPLICATE_WINDOW_SEC / 60) + ' minuti): ' + lead.email);
      return jsonOut({ ok: true, duplicate: true });
    }

    // Ondata anomala: blocca e avvisa una sola volta per finestra.
    var count = Number(cache.get('flood') || 0) + 1;
    cache.put('flood', String(count), FLOOD_WINDOW_SEC);
    if (count > FLOOD_MAX) {
      if (count === FLOOD_MAX + 1) {
        notify('ALLARME form ' + FORM_NAME + ': troppe richieste',
          'Piu\' di ' + FLOOD_MAX + ' richieste in ' + (FLOOD_WINDOW_SEC / 60) +
          ' minuti. Le successive vengono rifiutate fino alla fine della finestra.\n\n' +
          'Ultima ricevuta:\n' + describe(lead));
      }
      return jsonOut({ ok: false, error: 'Troppe richieste, riprova tra qualche minuto' });
    }

    cache.put(dupKey, '1', DUPLICATE_WINDOW_SEC);
  } finally {
    lock.releaseLock();
  }

  try {
    Logger.log('RICEVUTO dal sito: ' + lead.email + ' / ' + lead.azienda);
    createLeadViaWorkflow(lead);
    notify('[' + FORM_NAME + '] Nuovo lead dal sito: ' + lead.nome + ' — ' + lead.azienda,
      'Nuova richiesta dal form "Richiedi demo" del sito KORE.\n\n' + describe(lead) +
      '\n\nLead creato in vtiger tramite il workflow "HTTP CREATE LEADS".',
      lead.email);
    return jsonOut({ ok: true });
  } catch (err) {
    // Il CRM non ha creato il lead: la richiesta arriva comunque a sales per
    // email, quindi il contatto non si perde e al visitatore si dice "inviata".
    var saved = notify('ERRORE lead dal sito KORE — da inserire a mano in vtiger',
      'Il workflow vtiger non ha creato il lead: ' + String(err) + '\n\n' + describe(lead),
      lead.email);
    if (saved) return jsonOut({ ok: true, crm: false });
    // Ne' CRM ne' email: solo qui il visitatore deve sapere che non e' arrivata.
    CacheService.getScriptCache().remove('dup:' + lead.email);
    return jsonOut({ ok: false, error: 'Invio non riuscito' });
  }
}

/* ============================================================
   VTIGER — workflow 29 "HTTP CREATE LEADS"
   ============================================================ */

function createLeadViaWorkflow(lead) {
  // vtiger vuole nome e cognome separati: prima parola = nome, il resto = cognome
  var parts = lead.nome.split(/\s+/);
  var firstName = parts.length > 1 ? parts.shift() : '';
  var lastName = parts.join(' ') || lead.nome;

  // Chiavi con i nomi esatti letti dal workflow ($env["..."]), maiuscole comprese:
  // un nome sbagliato non da' errore, crea un lead con il campo vuoto.
  // Il workflow legge "telefono", toglie il +39 e scrive "tel", usato dal blocco
  // "create Record": si mandano entrambi, cosi' funziona anche senza quel passaggio.
  var res = UrlFetchApp.fetch(cfg('VTIGER_HANDLER_URL'), {
    method: 'post',
    muteHttpExceptions: true,
    followRedirects: true,
    payload: {
      name: firstName,
      last_name: lastName,
      Email: lead.email,
      telefono: lead.telefono,
      tel: lead.telefono,
      company: lead.azienda,
      description: '>>> RICHIESTA DAL FORM ' + FORM_NAME + ' <<<\n\n' + (lead.problema || '-'),
      source: LEAD_SOURCE
    }
  });

  var code = res.getResponseCode();
  var text = res.getContentText();
  if (code !== 200) throw new Error('HTTP ' + code + ': ' + text.slice(0, 300));

  // Risposta attesa: {"result":"ok",...}. ACCESS_DENIED = chiave o IP non autorizzati:
  // la regola IP deve essere un solo asterisco, non *.*.*.* ne' 0.0.0.0/0.
  var out;
  try { out = JSON.parse(text); } catch (e) { throw new Error('risposta non JSON: ' + text.slice(0, 300)); }
  if (out.result !== 'ok') throw new Error('workflow: ' + text.slice(0, 300));
  return out;
}

/* ============================================================
   UTILITY
   ============================================================ */

// Le due espressioni regolari sono le stesse che girano nel browser
// (index.html, EMAIL_RE e PHONE_RE): se ne cambi una, cambia anche l'altra.
// Il telefono accetta solo numeri italiani: 9-11 cifre, +39 o 0039 opzionali.
function validate(lead) {
  if (!lead.nome || !lead.azienda || !lead.email) return 'Dati mancanti: nome, azienda o email';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(lead.email)) return 'Email non valida';
  if (lead.telefono && !/^(?:\+39|0039)?\d{9,11}$/.test(lead.telefono.replace(/[\s.\-()]/g, ''))) {
    return 'Telefono non valido';
  }
  for (var k in MAX_LEN) {
    if (lead[k].length > MAX_LEN[k]) return 'Campo troppo lungo: ' + k;
  }
  return '';
}

// Manda un'email interna. Restituisce true se e' partita.
function notify(subject, body, replyTo) {
  if (!NOTIFY) return false;
  try {
    var msg = { to: NOTIFY, name: SENDER_NAME, subject: subject, body: body };
    if (replyTo) msg.replyTo = replyTo;
    MailApp.sendEmail(msg);
    return true;
  } catch (err) {
    console.error('Email non inviata: ' + err);
    return false;
  }
}

function describe(lead) {
  return [
    'Nome e cognome: ' + lead.nome,
    'Azienda: ' + lead.azienda,
    'Email: ' + lead.email,
    'Telefono: ' + (lead.telefono || '-'),
    '',
    'Dettagli della richiesta:',
    lead.problema || '-'
  ].join('\n');
}

function cfg(key) {
  var v = PropertiesService.getScriptProperties().getProperty(key);
  if (!v) throw new Error('Proprieta script mancante: ' + key);
  return v;
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function str(v) {
  return String(v == null ? '' : v).trim();
}

/* ============================================================
   TEST — eseguili dall'editor dopo aver messo VTIGER_HANDLER_URL
   ============================================================ */

// Crea un lead di prova in vtiger passando dal workflow (poi va cancellato).
// Controlla Lead Source = "Web site Kore" e Mobile Phone pieni.
function testWorkflow() {
  Logger.log(JSON.stringify(createLeadViaWorkflow({
    nome: 'Mario Rossi',
    azienda: 'Azienda di Prova Srl',
    email: 'mario.rossi@esempio.it',
    telefono: '+39 333 1234567',
    problema: 'Prova del workflow dal nuovo script KORE. Cancellare.'
  })));
}

// Percorso completo come dal sito: controlli, lead, email a sales.
// Il campo "problema" e' composto come lo compone la pagina Contatti.
function testLead() {
  CacheService.getScriptCache().remove('dup:mario.rossi@esempio.it');
  var fakeEvent = {
    postData: {
      contents: JSON.stringify({
        nome: 'Mario Rossi',
        azienda: 'Azienda di Prova Srl',
        email: 'mario.rossi@esempio.it',
        telefono: '+39 333 1234567',
        problema: [
          'Ruolo: Mediatore creditizio',
          'Volume mensile di lead gestiti: 500 – 2.000',
          'Materiali richiesti: One-pager KORE, Business case',
          '',
          'Messaggio:',
          'Prova di creazione lead dal sito KORE. Cancellare.'
        ].join('\n'),
        website: ''
      })
    }
  };
  Logger.log(doPost(fakeEvent).getContent());
}

// La trappola deve scartare senza creare nulla.
function testHoneypot() {
  var out = doPost({ postData: { contents: JSON.stringify({ nome: 'Bot', azienda: 'x', email: 'bot@x.io', website: 'http://spam' }) } });
  Logger.log('Honeypot: ' + out.getContent() + '  (nessun lead, nessuna email)');
}

// Controlla la proprieta VTIGER_HANDLER_URL senza stamparne la chiave.
// Da eseguire quando vtiger risponde "Link you have used is invalid or has expired".
function checkConfig() {
  var u = PropertiesService.getScriptProperties().getProperty('VTIGER_HANDLER_URL') || '';
  if (!u) { Logger.log('MANCA la proprieta VTIGER_HANDLER_URL'); return; }
  var id = (u.match(/[?&]id=([^&]*)/) || [])[1] || '';
  Logger.log('inizio             : ' + u.slice(0, 38));
  Logger.log('lunghezza chiave   : ' + id.length + '   (vuota o cortissima = non e una chiave)');
  Logger.log('testo segnaposto   : ' + /CHIAVE|KEY|<|>|tua|your/i.test(u) + '   (deve essere false)');
  Logger.log('doppia barra       : ' + /\.one\/\//.test(u) + '   (deve essere false)');
  Logger.log('spazi o a capo     : ' + /\s/.test(u) + '   (deve essere false)');
  Logger.log('direct=1           : ' + /[?&]direct=1/.test(u));
  Logger.log('record_id=0        : ' + /[?&]record_id=0/.test(u));
  Logger.log('workflow_id=29     : ' + /[?&]workflow_id=29/.test(u));
  Logger.log('https              : ' + u.indexOf('https://crm.otech.one/shorturl.php?') === 0);
}
