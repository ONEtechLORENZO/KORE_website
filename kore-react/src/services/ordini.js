/* L'ORDINE — finto magazzino, firme vere.
 *
 * Ogni funzione qui dentro ha gia' la forma che avra' quando parlera' con il
 * server: stessi nomi, stessi argomenti, stessa promessa di ritorno.
 * Oggi salvano in sessionStorage; domani il corpo diventa una fetch e
 * NESSUN componente cambia. E' lo stesso schema di crm.js, che ha gia'
 * funzionato: modulo puro, firme vere, interfaccia che non se ne accorge.
 *
 * Cosa NON fa, e non deve sembrare che faccia:
 *  - non manda email, non salva niente fuori da questa scheda del browser;
 *  - la firma non ha valore legale;
 *  - non incassa un euro.
 */

import { calcola } from './listino.js';

const CHIAVE = 'kore-ordine';

/* Un identificativo non indovinabile: gli interi progressivi si tirano a
   indovinare, e un ordine altrui non deve essere raggiungibile. */
function nuovoId() {
  const b = new Uint8Array(9);
  (globalThis.crypto || {}).getRandomValues?.(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}

function leggi() {
  try {
    const g = sessionStorage.getItem(CHIAVE);
    return g ? JSON.parse(g) : null;
  } catch (e) { return null; }
}

function scrivi(o) {
  try { sessionStorage.setItem(CHIAVE, JSON.stringify(o)); } catch (e) {}
  return o;
}

/* Piccolo ritardo: senza, l'interfaccia sembra istantanea e poi con il
   server vero si scoprono tutti gli stati di attesa mancanti. */
const attendi = (ms = 260) => new Promise((r) => setTimeout(r, ms));

/* ---------- le funzioni che domani diventano chiamate al server ---------- */

export async function creaPreventivo(config) {
  await attendi();
  const prezzo = calcola(config);
  return scrivi({
    id: nuovoId(),
    creato: new Date().toISOString(),
    stato: 'bozza',
    config: { lead: prezzo.lead, livello: prezzo.livello },
    prezzo,
    azienda: null,
    contratto: null,
    pagamento: null,
  });
}

export async function leggiOrdine() {
  await attendi(80);
  return leggi();
}

export async function salvaDatiFatturazione(dati) {
  await attendi();
  const o = leggi();
  if (!o) throw new Error('ordine assente');
  o.azienda = dati;
  o.stato = 'dati-completi';
  return scrivi(o);
}

/* Il PDF vero lo generera' il server dai dati salvati, mai da quelli che
   arrivano dal browser: altrimenti il contratto dice quel che dice il client. */
export async function generaContratto() {
  await attendi(420);
  const o = leggi();
  if (!o) throw new Error('ordine assente');
  o.contratto = { generato: new Date().toISOString(), pdfUrl: null };
  o.stato = 'contratto-pronto';
  /* da qui in poi prezzo e configurazione non si toccano piu' */
  o.bloccato = true;
  return scrivi(o);
}

export async function firmaContratto(prova) {
  await attendi(520);
  const o = leggi();
  if (!o) throw new Error('ordine assente');
  o.contratto = { ...(o.contratto || {}), firmatoIl: new Date().toISOString(), prova };
  o.stato = 'firmato';
  return scrivi(o);
}

export async function creaPagamento(metodo) {
  await attendi(520);
  const o = leggi();
  if (!o) throw new Error('ordine assente');
  /* Con il server: qui si torna un redirectUrl verso il fornitore di
     pagamento, e l'esito arriva dal webhook, non da questo ritorno. */
  o.pagamento = { metodo, statoFinto: 'autorizzato-finto', quando: new Date().toISOString() };
  o.stato = 'pagato';
  return scrivi(o);
}

export function azzera() {
  try { sessionStorage.removeItem(CHIAVE); } catch (e) {}
}
