import { useEffect, useState } from 'react';
import Telaio from './Telaio.jsx';
import { euro, numero } from '../services/listino.js';
import { leggiOrdine, azzera } from '../services/ordini.js';

/* Passo 5: conferma. Con il backend, qui si mostra lo stato reale letto dal
 * server, non quello che il browser crede: il pagamento potrebbe essere
 * ancora in corso quando questa pagina compare. */
export default function Fatto({ vaiA }) {
  const [ordine, setOrdine] = useState(null);

  useEffect(() => {
    leggiOrdine().then((o) => {
      if (!o || o.stato !== 'pagato') { vaiA('configura'); return; }
      setOrdine(o);
    });
  }, [vaiA]);

  if (!ordine) return null;
  const { prezzo: p, azienda: a } = ordine;

  return (
    <Telaio passo="fatto">
      <div className="co-fatto">
        <p className="co-spunta" aria-hidden="true">&#10003;</p>
        <h1 className="co-h">Tutto fatto.</h1>
        <p className="co-sub">
          {a.ragione} e&#39; attiva su KORE con {numero(p.lead)} lead al mese
          e {p.nMotori} moduli su 4. Il contratto firmato e la prima fattura
          arrivano a {a.emailRef}.
        </p>

        <div className="co-box">
          <div className="co-righe" style={{ borderTop: 0, paddingTop: 0 }}>
            <p className="co-riga"><span>Riferimento</span><b>{ordine.id}</b></p>
            <p className="co-riga"><span>Metodo</span><b>{ordine.pagamento.metodo}</b></p>
            <p className="co-riga"><span>Canone</span><b>{euro(p.totale)} / mese</b></p>
          </div>
        </div>

        <div className="co-azioni">
          <button type="button" className="co-ghost"
                  onClick={() => { azzera(); vaiA('configura'); }}>
            Ricomincia la prova
          </button>
        </div>
      </div>
    </Telaio>
  );
}
