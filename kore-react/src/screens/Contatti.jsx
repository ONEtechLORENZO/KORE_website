import { useState } from 'react';
import Screen from '../shared/Screen.jsx';
import { RULES, validate, buildPayload, sendToCrm } from '../shared/crm.js';

const RUOLI = ['Direzione', 'Commerciale', 'Operations', 'IT', 'Altro'];
const VOLUMI = ['meno di 500', '500 - 3.000', '3.000 - 10.000', 'oltre 10.000'];
const MATERIALI = ['Brochure KORE', 'Case study', 'Listino e condizioni'];

const VUOTO = { name: '', company: '', role: '', email: '', phone: '', volume: '', msg: '', hp: '' };

/* Etichette dei campi, nell'ordine del modulo. */
const CAMPI = [
  { id: 'name',    label: 'Nome e cognome', type: 'text' },
  { id: 'company', label: 'Azienda',        type: 'text' },
  { id: 'role',    label: 'Ruolo',          type: 'select', opzioni: RUOLI },
  { id: 'email',   label: 'Email di lavoro', type: 'email' },
  { id: 'phone',   label: 'Telefono',       type: 'tel' },
  { id: 'volume',  label: 'Lead al mese',   type: 'select', opzioni: VOLUMI },
];

export default function Contatti({ onChiudi, apriPrivacy }) {
  const [v, setV] = useState(VUOTO);
  const [materiali, setMateriali] = useState([]);
  const [consenso, setConsenso] = useState(false);
  const [errori, setErrori] = useState({});
  const [invio, setInvio] = useState(false);
  const [fatto, setFatto] = useState(null);

  const set = (id) => (e) => {
    const valore = e.target.value;
    setV((p) => ({ ...p, [id]: valore }));
    /* il messaggio sparisce appena la persona riprende a scrivere */
    setErrori((p) => (p[id] ? { ...p, [id]: undefined } : p));
  };

  const toggleMat = (m) =>
    setMateriali((p) => (p.includes(m) ? p.filter((x) => x !== m) : [...p, m]));

  async function submit(e) {
    e.preventDefault();
    const err = validate(v, consenso);
    if (Object.keys(err).length) {
      setErrori(err);
      const primo = RULES.find((r) => err[r.id]);
      const el = document.getElementById('dm-' + (primo ? primo.id : 'privacy'));
      if (el) el.focus();
      return;
    }
    setInvio(true);
    const payload = buildPayload(v, materiali);
    await sendToCrm(payload);
    setInvio(false);
    setFatto({ nome: payload.nome.split(' ')[0], materiali });
  }

  function ricomincia() {
    setV(VUOTO); setMateriali([]); setConsenso(false);
    setErrori({}); setFatto(null);
  }

  return (
    <Screen id="dm" titolo="Richiedi una demo" onChiudi={onChiudi}>
      <div className="dm-grid">
        <div className="dm-main">
          <p className="dm-kick">// Richiedi demo</p>
          <h2 className="dm-title">Parliamo dei tuoi lead.</h2>

          {fatto ? (
            <div className="dm-done">
              <p className="dm-check" aria-hidden="true">&#10003;</p>
              <h3 id="dm-done-title">Grazie {fatto.nome}.</h3>
              <p id="dm-done-text">
                {fatto.materiali.length
                  ? 'Ti scriviamo entro un giorno lavorativo con due orari possibili, e alleghiamo: ' +
                    fatto.materiali.join(' e ') + '.'
                  : 'Ti scriviamo entro un giorno lavorativo con due orari possibili per la demo.'}
              </p>
              <button type="button" className="cta cta-ghost" onClick={ricomincia}>
                Invia un'altra richiesta
              </button>
            </div>
          ) : (
            <form className="dm-form" onSubmit={submit} noValidate>
              {CAMPI.map((c) => (
                <p className="dm-field" key={c.id}>
                  <label htmlFor={'dm-' + c.id}>{c.label}</label>
                  {c.type === 'select' ? (
                    <select id={'dm-' + c.id} value={v[c.id]} onChange={set(c.id)}
                            aria-invalid={errori[c.id] ? 'true' : 'false'}>
                      <option value="">Scegli...</option>
                      {c.opzioni.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input id={'dm-' + c.id} type={c.type} value={v[c.id]} onChange={set(c.id)}
                           aria-invalid={errori[c.id] ? 'true' : 'false'} />
                  )}
                  <span className={'dm-msg' + (errori[c.id] ? ' is-on' : '')} role="alert">
                    {errori[c.id] || ''}
                  </span>
                </p>
              ))}

              <p className="dm-field dm-wide">
                <label htmlFor="dm-msg">Messaggio (facoltativo)</label>
                <textarea id="dm-msg" rows="3" value={v.msg} onChange={set('msg')} />
              </p>

              <fieldset className="dm-mats">
                <legend>Materiali da ricevere</legend>
                {MATERIALI.map((m) => (
                  <button key={m} type="button"
                          className={'dm-mat' + (materiali.includes(m) ? ' is-on' : '')}
                          aria-pressed={materiali.includes(m)}
                          onClick={() => toggleMat(m)}>{m}</button>
                ))}
                <p className="dm-legal">
                  Seleziona quello che vuoi ricevere: te lo alleghiamo alla risposta.
                </p>
              </fieldset>

              {/* Trappola per i robot: nascosta a chi guarda, mai compilata da una persona.
                  Se arriva piena, lo script Apps Script scarta la richiesta in silenzio. */}
              <div className="dm-hp" aria-hidden="true">
                <label htmlFor="dm-hp2">Non compilare</label>
                <input id="dm-hp2" name="kore_nota" tabIndex="-1" autoComplete="off"
                       value={v.hp} onChange={set('hp')} />
              </div>

              <div className={'dm-cbox' + (errori.privacy ? ' is-bad' : '')}>
                <input type="checkbox" id="dm-privacy" checked={consenso}
                       aria-invalid={errori.privacy ? 'true' : 'false'}
                       onChange={(e) => {
                         setConsenso(e.target.checked);
                         if (e.target.checked) setErrori((p) => ({ ...p, privacy: undefined }));
                       }} />
                <label htmlFor="dm-privacy">
                  Acconsento al trattamento dei dati per essere ricontattato da One Tech,
                  secondo l'
                  <a href="#privacy" onClick={(e) => { e.preventDefault(); apriPrivacy(); }}>
                    informativa privacy
                  </a>.
                </label>
                <span className={'dm-msg' + (errori.privacy ? ' is-on' : '')} role="alert">
                  {errori.privacy || ''}
                </span>
              </div>

              <button type="submit" className="cta cta-purple dm-submit" disabled={invio}>
                {invio ? 'Invio in corso...' : 'Richiedi demo →'}
              </button>
            </form>
          )}
        </div>
      </div>
    </Screen>
  );
}
