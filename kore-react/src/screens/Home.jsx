/* La home: testo di apertura e, a destra, la scena animata su canvas.
 * Il motore di disegno (circa 370 righe) e' ancora in index.html e verra'
 * spostato in src/engines/scena.js senza riscriverlo: e' codice imperativo
 * su canvas, e in React va incapsulato, non tradotto. */
export default function Home({ onPrezzo }) {
  return (
    <main className="hero">
      <div className="copy">
        <p className="eyebrow"><i className="dot" /> Il credito, senza attriti</p>
        <h1>Il credito.<br /><span>Pi&ugrave; intelligente.</span></h1>
        <p>
          Meno passaggi. Pi&ugrave; possibilit&agrave;.<br />
          Clienti, documenti e AI, insieme.<br />
          Con KORE, ogni lead fa strada.
        </p>
        <button type="button" className="cta cta-purple" onClick={onPrezzo}>
          Scopri KORE <span aria-hidden="true">&#8599;</span>
        </button>
      </div>
      <div className="visual">
        <canvas id="scene" role="img"
                aria-label="Funnel automatico KORE: dalla richiesta del cliente alla verifica dei documenti." />
      </div>
    </main>
  );
}
