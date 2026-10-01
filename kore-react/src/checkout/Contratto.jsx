import { useEffect, useState } from 'react';
import Telaio from './Telaio.jsx';
import { MOTORI, euro, numero } from '../services/listino.js';
import { leggiOrdine, generaContratto, firmaContratto } from '../services/ordini.js';

/* Passo 3: il contratto e la firma.
 *
 * Qui il testo viene composto nel browser solo per farlo vedere. Il documento
 * vero lo genera il server dai dati salvati: se lo componesse il client, il
 * contratto direbbe quello che dice il client.
 *
 * La firma qui e' finta. Con il backend si passa a un fornitore (Yousign,
 * Namirial, Dropbox Sign): e' lui a produrre la traccia - IP, orario, OTP a
 * un numero verificato - che serve se il cliente contesta. */
export default function Contratto({ vaiA, onIndietro }) {
  const [ordine, setOrdine] = useState(null);
  const [accetta, setAccetta] = useState(false);
  const [mandato, setMandato] = useState(false);
  const [otp, setOtp] = useState('');
  const [errore, setErrore] = useState('');
  const [attesa, setAttesa] = useState(false);

  useEffect(() => {
    leggiOrdine().then(async (o) => {
      if (!o) { vaiA('configura'); return; }
      if (!o.azienda) { vaiA('preventivo'); return; }
      setOrdine(o.contratto ? o : await generaContratto());
    });
  }, [vaiA]);

  async function firma(e) {
    e.preventDefault();
    if (!accetta) { setErrore('Serve accettare le condizioni per firmare.'); return; }
    if (!/^\d{6}$/.test(otp)) { setErrore('Inserisci il codice a 6 cifre che hai ricevuto.'); return; }
    setErrore('');
    setAttesa(true);
    await firmaContratto({ tipo: 'otp-finto', mandatoSepa: mandato });
    setAttesa(false);
    vaiA('pagamento');
  }

  if (!ordine) return null;
  const { azienda: a, prezzo: p } = ordine;
  const nomi = MOTORI.filter((m) => m.livello <= p.livello).map((m) => m.nome);

  return (
    <Telaio passo="contratto" onIndietro={onIndietro}>
      <h1 className="co-h">Il contratto.</h1>
      <p className="co-sub">
        Leggilo, poi firma con il codice che arriva al referente indicato.
      </p>

      <div className="co-grid">
        <div className="co-box">
          <article className="co-doc">
            <h3>Contratto di abbonamento alla piattaforma KORE</h3>
            <dl>
              <dt>Tra</dt><dd>One Tech S.r.l. &mdash; fornitore</dd>
              <dt>E</dt><dd>{a.ragione} &mdash; cliente</dd>
              <dt>P.IVA</dt><dd>{a.piva}</dd>
              <dt>Sede</dt><dd>{a.indirizzo}, {a.cap} {a.citta}</dd>
              <dt>Fatturazione</dt><dd>{a.sdi}</dd>
              <dt>Riferimento</dt><dd>{ordine.id}</dd>
            </dl>

            <h3>1. Oggetto</h3>
            <p>
              One Tech concede al cliente l&#39;uso della piattaforma KORE per la
              qualifica dei lead nel credito al consumo, nei moduli indicati
              all&#39;articolo 2.
            </p>

            <h3>2. Configurazione e corrispettivo</h3>
            <dl>
              <dt>Volume</dt><dd>{numero(p.lead)} lead / mese</dd>
              <dt>Moduli</dt><dd>{nomi.join(', ')}</dd>
              <dt>Prezzo a lead</dt><dd>{euro(p.perLead)}</dd>
              <dt>Imponibile</dt><dd>{euro(p.imponibile)} / mese</dd>
              <dt>IVA 22%</dt><dd>{euro(p.iva)}</dd>
              <dt>Totale</dt><dd>{euro(p.totale)} / mese</dd>
            </dl>
            <p>
              I corrispettivi si intendono al netto di IVA, fatturati mensilmente
              in via anticipata.
            </p>

            <h3>3. Durata</h3>
            <p>
              Dodici mesi dalla data di attivazione, rinnovabili tacitamente salvo
              disdetta con sessanta giorni di preavviso.
            </p>

            <h3>4. Trattamento dei dati &mdash; allegato</h3>
            <p>
              Per l&#39;esecuzione del servizio One Tech tratta dati personali per
              conto del cliente ed e&#39; nominata responsabile del trattamento ai
              sensi dell&#39;art. 28 GDPR. L&#39;atto di nomina costituisce allegato
              al presente contratto e si firma con esso.
            </p>

            <p style={{ marginTop: 22, color: '#8a7ba0' }}>
              Testo di esempio a scopo di prova: il contratto definitivo va
              redatto e validato legalmente.
            </p>
          </article>

          <form className="co-firma" onSubmit={firma}>
            <label className="co-consenso">
              <input type="checkbox" checked={accetta}
                     onChange={(e) => { setAccetta(e.target.checked); setErrore(''); }} />
              <span>
                Accetto le condizioni del contratto e l&#39;allegato sul
                trattamento dei dati, e dichiaro di avere i poteri per firmare
                in nome di {a.ragione}.
              </span>
            </label>

            <label className="co-consenso">
              <input type="checkbox" checked={mandato}
                     onChange={(e) => setMandato(e.target.checked)} />
              <span>
                Autorizzo l&#39;addebito mensile su conto corrente (mandato SEPA),
                da confermare al passo successivo.
              </span>
            </label>

            <div className="co-otp">
              <input
                aria-label="Codice di firma" inputMode="numeric" maxLength={6}
                placeholder="000000" value={otp}
                onChange={(e) => { setOtp(e.target.value.replace(/[^\d]/g, '')); setErrore(''); }}
              />
              <span className="co-aiuto">
                In anteprima va bene un codice qualsiasi di 6 cifre.
              </span>
            </div>

            <span className={'co-err' + (errore ? ' is-on' : '')} role="alert">{errore}</span>

            <div className="co-azioni">
              <button type="submit" className="co-cta" disabled={attesa}>
                {attesa ? 'Firmo...' : 'Firma il contratto'} <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </form>
        </div>

        <aside className="co-box co-riepilogo">
          <p className="co-eyebrow">Da firmare</p>
          <p className="co-tot">{euro(p.totale)}</p>
          <p className="co-tot-sotto">al mese, IVA inclusa</p>
          <div className="co-righe">
            <p className="co-riga"><span>{numero(p.lead)} lead</span><b>{euro(p.perLead)} cad.</b></p>
            <p className="co-riga"><span>Moduli</span><b>{p.nMotori} su 4</b></p>
            <p className="co-riga"><span>Durata</span><b>12 mesi</b></p>
          </div>
        </aside>
      </div>
    </Telaio>
  );
}
