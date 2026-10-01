import { useEffect, useState } from 'react';
import Telaio from './Telaio.jsx';
import { euro, numero } from '../services/listino.js';
import { leggiOrdine, creaPagamento } from '../services/ordini.js';

/* Passo 4: come si incassa.
 *
 * Con il backend, questo bottone non incassa: chiede al server di aprire una
 * sessione presso il fornitore di pagamento e porta la persona li'. L'esito
 * arriva dal webhook, non da questo ritorno: chi chiude la scheda ha pagato
 * lo stesso, e chi vede la pagina di successo non ha necessariamente pagato. */

const METODI = [
  { id: 'sepa', nome: 'Addebito SEPA', tag: 'consigliato',
    desc: 'Il mandato firmato autorizza il prelievo mensile dal conto. Commissioni molto basse e nessuna carta che scade.' },
  { id: 'carta', nome: 'Carta', tag: 'subito attivo',
    desc: 'Autenticazione con la banca alla prima ricorrenza, poi addebiti automatici. Commissioni più alte sugli importi grandi.' },
  { id: 'bonifico', nome: 'Bonifico su fattura', tag: 'manuale',
    desc: 'Emettiamo fattura a 30 giorni. Nessuna commissione, ma il pagamento va sollecitato a mano.' },
];

export default function Pagamento({ vaiA, onIndietro }) {
  const [ordine, setOrdine] = useState(null);
  const [metodo, setMetodo] = useState('sepa');
  const [attesa, setAttesa] = useState(false);

  useEffect(() => {
    leggiOrdine().then((o) => {
      if (!o) { vaiA('configura'); return; }
      if (o.stato !== 'firmato' && o.stato !== 'pagato') { vaiA('contratto'); return; }
      setOrdine(o);
      if (o.contratto?.prova?.mandatoSepa === false) setMetodo('carta');
    });
  }, [vaiA]);

  async function paga() {
    setAttesa(true);
    await creaPagamento(metodo);
    setAttesa(false);
    vaiA('fatto');
  }

  if (!ordine) return null;
  const p = ordine.prezzo;

  return (
    <Telaio passo="pagamento" onIndietro={onIndietro}>
      <h1 className="co-h">Come preferisci pagare?</h1>
      <p className="co-sub">
        Contratto firmato. Resta da scegliere con che strumento incassiamo
        il canone mensile.
      </p>

      <div className="co-grid">
        <div className="co-box">
          <div className="co-metodi">
            {METODI.map((m) => (
              <button
                key={m.id} type="button"
                className={'co-metodo' + (metodo === m.id ? ' is-on' : '')}
                aria-pressed={metodo === m.id}
                onClick={() => setMetodo(m.id)}
              >
                <em>{m.tag}</em>
                <b>{m.nome}</b>
                <span>{m.desc}</span>
              </button>
            ))}
          </div>

          <div className="co-azioni">
            <button type="button" className="co-cta" onClick={paga} disabled={attesa}>
              {attesa ? 'Attendi...' : 'Conferma e attiva'} <span aria-hidden="true">&rarr;</span>
            </button>
            <button type="button" className="co-ghost" onClick={() => vaiA('contratto')}>
              Rivedi il contratto
            </button>
          </div>

          <p className="co-aiuto">
            In anteprima non parte nessun addebito e non viene salvato
            alcun dato bancario.
          </p>
        </div>

        <aside className="co-box co-riepilogo">
          <p className="co-eyebrow">Primo addebito</p>
          <p className="co-tot">{euro(p.totale)}</p>
          <p className="co-tot-sotto">poi ogni mese, per 12 mesi</p>
          <div className="co-righe">
            <p className="co-riga"><span>Lead al mese</span><b>{numero(p.lead)}</b></p>
            <p className="co-riga"><span>Prezzo a lead</span><b>{euro(p.perLead)}</b></p>
            <p className="co-riga"><span>Imponibile</span><b>{euro(p.imponibile)}</b></p>
            <p className="co-riga"><span>IVA 22%</span><b>{euro(p.iva)}</b></p>
            <p className="co-riga tot"><span>Totale</span><b>{euro(p.totale)}</b></p>
          </div>
        </aside>
      </div>
    </Telaio>
  );
}
