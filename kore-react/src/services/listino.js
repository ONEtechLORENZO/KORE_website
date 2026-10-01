/* LISTINO — ripreso dal sito, non inventato.
 *
 * Formula originale (index.html, blocco v43 "curva della tariffa"):
 *
 *   pcTariff(lead) = interpolazione lineare fra gli scaglioni
 *   per            = pcTariff(lead) * livello / 4
 *   mese           = per * lead
 *
 * Il prezzo a lead CALA al crescere del volume lungo una curva: non e' una
 * tariffa piatta. Per questo 3.310 lead a 4 motori danno 3,707 EUR a lead
 * (a video 3,71) e 12.270,17 EUR al mese (a video 12.270): i due numeri
 * tornano, purche' il mese si calcoli sulla tariffa esatta e non su quella
 * gia' arrotondata per la visualizzazione.
 *
 * Resta vero che il prezzo definitivo lo deve ricalcolare il server: finche'
 * nasce nel browser puo' essere cambiato da chi apre gli strumenti per
 * sviluppatori, e non puo' quindi finire in un contratto.
 */

export const IVA = 0.22;

export const SCAGLIONI = [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000];
export const TARIFFE   = [6,   5,    4.5,  4.25, 4,    3.8,  3.65, 3.5,  3.4,  3.3];

export const LEAD_MIN = SCAGLIONI[0];
export const LEAD_MAX = SCAGLIONI[SCAGLIONI.length - 1];

/* I quattro motori sono cumulativi: si sceglie fino a che tappa arrivare,
 * e ogni tappa vale un quarto della tariffa. Non sono opzioni indipendenti. */
export const MOTORI = [
  { livello: 1, nome: 'AI Agent',  titolo: 'Conversazione',
    desc: 'Sempre incluso: parla con il lead e lo qualifica in automatico.' },
  { livello: 2, nome: 'ARGO',      titolo: 'Documenti',
    desc: 'Acquisisce i documenti, estrae i dati e li manda al vostro CRM.' },
  { livello: 3, nome: 'ARGO+',     titolo: 'Valutazione',
    desc: 'Idoneità su criteri bancari e assicurativi, secondo le condizioni che imposti tu.' },
  { livello: 4, nome: 'Firma OTP', titolo: 'Firma',
    desc: 'Invia al cliente i documenti da firmare: privacy, delega, precontrattuale.' },
];

/* La curva: stessa interpolazione del sito. */
export function tariffa(lead) {
  if (lead <= SCAGLIONI[0]) return TARIFFE[0];
  if (lead >= SCAGLIONI[SCAGLIONI.length - 1]) return TARIFFE[TARIFFE.length - 1];
  let k = 0;
  while (lead > SCAGLIONI[k + 1]) k++;
  const t = (lead - SCAGLIONI[k]) / (SCAGLIONI[k + 1] - SCAGLIONI[k]);
  return TARIFFE[k] + (TARIFFE[k + 1] - TARIFFE[k]) * t;
}

export function calcola({ lead, livello }) {
  const l = Math.max(LEAD_MIN, Math.min(LEAD_MAX, Number(lead) || LEAD_MIN));
  const liv = Math.max(1, Math.min(4, Number(livello) || 1));
  const base = tariffa(l);
  const perLead = base * liv / 4;
  const imponibile = perLead * l;
  const iva = imponibile * IVA;
  return {
    lead: l,
    livello: liv,
    nMotori: liv,
    base,
    perLead,
    imponibile,
    iva,
    totale: imponibile + iva,
  };
}

/* --- formattazione italiana ---
 * toLocaleString('it-IT') NON mette il punto alle migliaia sotto le cinque
 * cifre: 2375,14 invece di 2.375,14. Le migliaia le mettiamo a mano. */
const migliaia = (intero) => intero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export function euro(n, dec = 2) {
  const neg = n < 0;
  const [i, d] = Math.abs(n).toFixed(dec).split('.');
  return (neg ? '−' : '') + '€' + migliaia(i) + (d ? ',' + d : '');
}

export const numero = (n) => migliaia(String(Math.round(Math.abs(n))));
