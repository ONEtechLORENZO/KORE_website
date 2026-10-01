/* Ponte verso il CRM vtiger, attraverso lo script Apps Script.
 *
 * REGOLE DA NON TOCCARE (il CRM smette di ricevere i lead se cambiano):
 *  - i nomi dei campi sono esattamente questi sei: nome, azienda, email,
 *    telefono, problema, website. Lo script Apps Script li rimappa sui campi
 *    vtiger, che sono sensibili alle maiuscole.
 *  - `website` e' la trappola per i robot: un campo che una persona non vede
 *    e non compila. Se arriva pieno, lo script scarta la richiesta.
 *  - la chiamata va in no-cors e SENZA Content-Type: cosi' resta una richiesta
 *    semplice e non parte il preflight, che Apps Script non sa gestire.
 *  - la chiave dell HTTP Handler non sta qui e non deve mai finire nel sito:
 *    vive nelle proprieta' dello script Apps Script.
 */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PHONE_RE = /^(?:\+39|0039)?\d{9,11}$/;

export const emailOk = (v) => EMAIL_RE.test(v);
export const phoneOk = (v) => PHONE_RE.test(String(v).replace(/[\s.\-()]/g, ''));

/** L'indirizzo del ponte: unico punto da configurare, mai la chiave del CRM. */
export function endpoint() {
  return String(
    (typeof window !== 'undefined' && window.KORE_CRM_ENDPOINT) || ''
  ).trim();
}

/** Le regole dei campi obbligatori, nell'ordine in cui compaiono nel modulo. */
export const RULES = [
  { id: 'name',    req: 'Serve il tuo nome.' },
  { id: 'company', req: "Serve il nome dell'azienda." },
  { id: 'role',    req: 'Scegli il tuo ruolo.' },
  { id: 'email',   req: "Serve un'email di lavoro.", bad: "Indirizzo non valido: manca la chiocciola o il dominio.", ok: emailOk },
  { id: 'phone',   req: 'Serve un numero di telefono.', bad: 'Numero non valido: 9-11 cifre, con o senza +39.', ok: phoneOk },
  { id: 'volume',  req: 'Scegli il volume di lead.' },
];

/** Restituisce { campo: messaggio } per ogni campo non valido. Vuoto = tutto a posto. */
export function validate(values, consenso) {
  const errors = {};
  for (const r of RULES) {
    const v = String(values[r.id] || '').trim();
    if (!v) errors[r.id] = r.req;
    else if (r.ok && !r.ok(v)) errors[r.id] = r.bad;
  }
  if (!consenso) errors.privacy = 'Serve il consenso per poterti ricontattare.';
  return errors;
}

/** Il blocco di testo che finisce nella descrizione del lead. */
export function buildProblema(values, materiali, adesso = new Date()) {
  const v = (k) => String(values[k] || '').trim();
  const consenso =
    'Consenso privacy: accettato il ' + adesso.toLocaleString('it-IT');
  return [
    'Ruolo: ' + (v('role') || '-'),
    'Volume mensile di lead gestiti: ' + (v('volume') || '-'),
    'Materiali richiesti: ' + (materiali.length ? materiali.join(', ') : '-'),
    consenso,
    '',
    'Messaggio:',
    v('msg') || '-',
  ].join('\n');
}

/** I sei campi, esattamente come li aspetta lo script Apps Script. */
export function buildPayload(values, materiali, adesso = new Date()) {
  const v = (k) => String(values[k] || '').trim();
  return {
    nome: v('name'),
    azienda: v('company'),
    email: v('email').toLowerCase(),
    telefono: v('phone'),
    problema: buildProblema(values, materiali, adesso),
    website: v('hp'), // trappola: deve restare vuoto
  };
}

/** Invia. La risposta non e' leggibile (no-cors): se il CRM fallisce,
 *  lo script avvisa comunque il commerciale via email. */
export function sendToCrm(payload) {
  const url = endpoint();
  if (!url) {
    console.warn(
      'KORE: window.KORE_CRM_ENDPOINT non impostato, il lead non e stato inviato al CRM.'
    );
    return Promise.resolve();
  }
  return fetch(url, {
    method: 'POST',
    mode: 'no-cors',
    body: JSON.stringify(payload),
  }).catch(() => {});
}
