import MarchioKore from '../shared/MarchioKore.jsx';
import '../styles/checkout.css';

/* La home del sito. In produzione il percorso vive in una sottocartella
   (/acquista/), quindi la home e' la radice. */
const CASA = '/';

export const PASSI = [
  { id: 'configura',  breve: 'Configurazione' },
  { id: 'preventivo', breve: 'Dati azienda' },
  { id: 'contratto',  breve: 'Contratto' },
  { id: 'pagamento',  breve: 'Pagamento' },
  { id: 'fatto',      breve: 'Conferma' },
];

/* Il telaio comune: avviso, ritorno, passi.
 * L'avviso resta finche' non c'e' il backend: queste schermate sembrano
 * vere, e una schermata di firma che sembra vera prima o poi viene mostrata
 * a un cliente. Quando si collega il server, si toglie questa riga sola. */
export default function Telaio({ passo, onIndietro, children }) {
  const i = PASSI.findIndex((p) => p.id === passo);

  /* "Torna indietro" torna al passo precedente; dal primo passo esce dal
     percorso e torna alla home del sito, come il marchio in alto.
     Dalla Conferma non si torna indietro: un ordine concluso non si annulla
     camminando all'indietro. */
  const primo = i <= 0;
  const ultimo = passo === 'fatto';
  const indietro = () => {
    if (!primo) { window.location.hash = '#' + PASSI[i - 1].id; return; }
    window.location.href = CASA;
  };

  return (
    <div className="co">
      {/* Solo il marchio: durante l'acquisto il menu del sito distrae e
          offre vie di uscita a meta' percorso. Il marchio riporta alla home. */}
      <a className="co-marchio" href="/" aria-label="KORE, vai alla home">
        <MarchioKore size={30} />
      </a>

      <p className="co-avviso">
        <b>ANTEPRIMA</b>
        <span>
          Nessun valore legale e nessun addebito: la firma non impegna,
          il pagamento non viene eseguito e i dati restano in questa scheda
          del browser.
        </span>
      </p>

      {!ultimo ? (
        <button type="button" className="co-back" onClick={indietro}>
          <span aria-hidden="true">&larr;</span> Torna indietro
        </button>
      ) : null}

      <ol className="co-passi" aria-label="Avanzamento">
        {PASSI.map((p, k) => (
          <li
            key={p.id}
            className={'co-passo' + (k === i ? ' is-on' : k < i ? ' is-done' : '')}
            aria-current={k === i ? 'step' : undefined}
          >
            <i aria-hidden="true">{k < i ? '✓' : k + 1}</i>
            {p.breve}
          </li>
        ))}
      </ol>

      {children}
    </div>
  );
}
