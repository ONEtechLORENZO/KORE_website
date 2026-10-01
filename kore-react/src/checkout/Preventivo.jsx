import { useEffect, useState } from 'react';
import Telaio from './Telaio.jsx';
import { euro, numero } from '../services/listino.js';
import { leggiOrdine, salvaDatiFatturazione } from '../services/ordini.js';

/* Passo 2: i dati con cui si intesta il contratto e si emette la fattura.
 * Senza P.IVA e senza Codice Destinatario SDI (o PEC) in Italia non si
 * fattura: vanno raccolti PRIMA del contratto, altrimenti il contratto
 * va rigenerato e rifirmato. */

const CAMPI = [
  { id: 'ragione',  label: 'Ragione sociale', largo: true, req: 'Serve la ragione sociale.' },
  { id: 'piva',     label: 'Partita IVA', req: 'Serve la partita IVA.',
    ok: (v) => /^(IT)?\d{11}$/i.test(v.replace(/\s/g, '')), bad: 'Partita IVA non valida: 11 cifre.' },
  { id: 'cf',       label: 'Codice fiscale', req: 'Serve il codice fiscale.' },
  { id: 'indirizzo',label: 'Indirizzo sede legale', largo: true, req: "Serve l'indirizzo." },
  { id: 'cap',      label: 'CAP', req: 'Serve il CAP.',
    ok: (v) => /^\d{5}$/.test(v), bad: 'Il CAP è di 5 cifre.' },
  { id: 'citta',    label: 'Città', req: 'Serve la città.' },
  { id: 'sdi',      label: 'Codice destinatario SDI o PEC', largo: true,
    req: 'Serve il codice SDI (7 caratteri) oppure una PEC.',
    ok: (v) => /^[A-Z0-9]{6,7}$/i.test(v.trim()) || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
    bad: 'Inserisci un codice SDI di 6-7 caratteri oppure un indirizzo PEC.' },
  { id: 'referente',label: 'Referente per la firma', req: 'Serve il nome di chi firma.' },
  { id: 'emailRef', label: 'Email del referente',
    req: "Serve l'email del referente.",
    ok: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v), bad: 'Indirizzo non valido.' },
];

const VUOTO = Object.fromEntries(CAMPI.map((c) => [c.id, '']));

export default function Preventivo({ vaiA, onIndietro }) {
  const [ordine, setOrdine] = useState(null);
  const [v, setV] = useState(VUOTO);
  const [errori, setErrori] = useState({});
  const [attesa, setAttesa] = useState(false);

  useEffect(() => {
    leggiOrdine().then((o) => {
      if (!o) { vaiA('configura'); return; }
      setOrdine(o);
      if (o.azienda) setV({ ...VUOTO, ...o.azienda });
    });
  }, [vaiA]);

  const set = (id) => (e) => {
    const val = e.target.value;
    setV((p) => ({ ...p, [id]: val }));
    setErrori((p) => (p[id] ? { ...p, [id]: undefined } : p));
  };

  async function avanti(e) {
    e.preventDefault();
    const err = {};
    for (const c of CAMPI) {
      const val = (v[c.id] || '').trim();
      if (!val) err[c.id] = c.req;
      else if (c.ok && !c.ok(val)) err[c.id] = c.bad;
    }
    if (Object.keys(err).length) {
      setErrori(err);
      const primo = CAMPI.find((c) => err[c.id]);
      document.getElementById('co-' + primo.id)?.focus();
      return;
    }
    setAttesa(true);
    await salvaDatiFatturazione(v);
    setAttesa(false);
    vaiA('contratto');
  }

  if (!ordine) return null;
  const p = ordine.prezzo;

  return (
    <Telaio passo="preventivo" onIndietro={onIndietro}>
      <h1 className="co-h">A chi intestiamo?</h1>
      <p className="co-sub">
        Sono i dati con cui prepariamo il contratto e la fattura elettronica.
      </p>

      <div className="co-grid">
        <form className="co-box" onSubmit={avanti} noValidate>
          <div className="co-form">
            {CAMPI.map((c) => (
              <p className={'co-campo' + (c.largo ? ' co-largo' : '')} key={c.id}>
                <label htmlFor={'co-' + c.id}>{c.label}</label>
                <input
                  id={'co-' + c.id} value={v[c.id]} onChange={set(c.id)}
                  aria-invalid={errori[c.id] ? 'true' : 'false'}
                />
                <span className={'co-err' + (errori[c.id] ? ' is-on' : '')} role="alert">
                  {errori[c.id] || ''}
                </span>
              </p>
            ))}
          </div>
          <div className="co-azioni">
            <button type="submit" className="co-cta" disabled={attesa}>
              {attesa ? 'Salvo...' : 'Vai al contratto'} <span aria-hidden="true">&rarr;</span>
            </button>
          </div>
        </form>

        <aside className="co-box co-riepilogo">
          <p className="co-eyebrow">Riepilogo</p>
          <div className="co-righe" style={{ borderTop: 0, paddingTop: 0 }}>
            <p className="co-riga"><span>Lead al mese</span><b>{numero(p.lead)}</b></p>
            <p className="co-riga"><span>Motori attivi</span><b>{p.nMotori} su 4</b></p>
            <p className="co-riga"><span>Prezzo a lead</span><b>{euro(p.perLead)}</b></p>
            <p className="co-riga"><span>Imponibile</span><b>{euro(p.imponibile)}</b></p>
            <p className="co-riga"><span>IVA 22%</span><b>{euro(p.iva)}</b></p>
            <p className="co-riga tot"><span>Totale / mese</span><b>{euro(p.totale)}</b></p>
          </div>
        </aside>
      </div>
    </Telaio>
  );
}
