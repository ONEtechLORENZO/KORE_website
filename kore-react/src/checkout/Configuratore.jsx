import { useMemo, useState } from 'react';
import Telaio from './Telaio.jsx';
import { MOTORI, LEAD_MIN, LEAD_MAX, calcola, euro, numero } from '../services/listino.js';
import { creaPreventivo } from '../services/ordini.js';

/* Passo 1: quanti lead e quali motori. Da qui parte tutto il resto. */
export default function Configuratore({ vaiA, onIndietro }) {
  /* Se si arriva dal configuratore del sito, volume e livello sono
     nell'indirizzo: la pagina si apre gia' impostata e non si ricomincia
     da capo. Il prezzo NON viaggia nell'indirizzo: si ricalcola qui. */
  const iniziali = (() => {
    try {
      const q = new URLSearchParams(window.location.search);
      const l = parseInt(q.get('lead'), 10);
      const v = parseInt(q.get('livello'), 10);
      return {
        lead: isFinite(l) ? Math.max(LEAD_MIN, Math.min(LEAD_MAX, l)) : 3000,
        livello: isFinite(v) ? Math.max(1, Math.min(4, v)) : 2,
      };
    } catch (e) { return { lead: 3000, livello: 2 }; }
  })();

  const [lead, setLead] = useState(iniziali.lead);
  /* livello cumulativo 1..4: si sceglie fino a che tappa arrivare */
  const [livello, setLivello] = useState(iniziali.livello);
  const [attesa, setAttesa] = useState(false);

  const prezzo = useMemo(() => calcola({ lead, livello }), [lead, livello]);

  async function avanti() {
    setAttesa(true);
    await creaPreventivo({ lead, livello });
    setAttesa(false);
    vaiA('preventivo');
  }

  return (
    <Telaio passo="configura" onIndietro={onIndietro}>
      <h1 className="co-h">Quanti lead vuoi?</h1>

      <div className="co-grid">
        <div>
          <div className="co-box">
            <div className="co-lead-n">
              <input
                type="text" inputMode="numeric" aria-label="Lead al mese"
                value={numero(lead)}
                onChange={(e) => {
                  const n = parseInt(e.target.value.replace(/[^\d]/g, ''), 10);
                  if (isFinite(n)) setLead(Math.max(LEAD_MIN, Math.min(LEAD_MAX, n)));
                }}
              />
              <span>lead / mese</span>
            </div>
            <input
              className="co-range" type="range" aria-label="Lead al mese"
              min={LEAD_MIN} max={LEAD_MAX} step="10"
              value={lead} onChange={(e) => setLead(+e.target.value)}
            />
            <div className="co-limiti">
              <span>{numero(LEAD_MIN)}</span><span>{numero(LEAD_MAX)}</span>
            </div>
            <p className="co-aiuto">
              Tariffa a questo volume: {euro(prezzo.base)} a lead con tutti e quattro
              i motori. Piu&#39; lead, meno costa il singolo lead.
            </p>
          </div>

          <div className="co-box">
            <p className="co-eyebrow">Scegli la tua configurazione</p>
            <div className="co-motori">
              {MOTORI.map((m) => {
                const acceso = m.livello <= livello;
                return (
                  <button
                    key={m.livello} type="button"
                    className={'co-motore' + (acceso ? ' is-on' : '')}
                    aria-pressed={acceso}
                    onClick={() => setLivello(m.livello)}
                  >
                    {m.livello === 1 && <span className="co-fisso">incluso</span>}
                    {m.livello === 4 && livello === 4 && <span className="co-fisso">build completa</span>}
                    <h4>{m.titolo}</h4>
                    <p>{m.desc}</p>
                    <span className="co-prezzo-m">{m.nome}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="co-box co-riepilogo">
          <p className="co-eyebrow">Prezzo</p>
          <p className="co-tot">{euro(prezzo.perLead)}</p>
          <p className="co-tot-sotto">
            per lead &middot; {prezzo.nMotori} motori su 4
          </p>

          <div className="co-righe">
            <p className="co-riga"><span>Lead al mese</span><b>{numero(prezzo.lead)}</b></p>
            <p className="co-riga"><span>Imponibile</span><b>{euro(prezzo.imponibile)}</b></p>
            <p className="co-riga"><span>IVA 22%</span><b>{euro(prezzo.iva)}</b></p>
            <p className="co-riga tot"><span>Totale / mese</span><b>{euro(prezzo.totale)}</b></p>
          </div>

          <div className="co-azioni">
            <button type="button" className="co-cta" onClick={avanti} disabled={attesa}>
              {attesa ? 'Attendi...' : 'Continua'} <span aria-hidden="true">&rarr;</span>
            </button>
          </div>
          <p className="co-aiuto">
            Il prezzo verra&#39; ricalcolato dal server prima del contratto.
          </p>
        </aside>
      </div>
    </Telaio>
  );
}
