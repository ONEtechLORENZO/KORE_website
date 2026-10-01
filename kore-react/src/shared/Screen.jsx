import { useEffect, useRef } from 'react';

/* Il contenitore delle schermate sovrapposte.
 *
 * Nel sito attuale ogni schermata e' una <section> che scorre al proprio
 * interno, non con la pagina. Qui il comportamento e' lo stesso: cambia solo
 * chi decide quando montarla.
 *
 * `onAperta` riceve il nodo: serve alle schermate che disegnano su canvas o
 * generano SVG a mano. Quel codice resta imperativo di proposito - riscriverlo
 * in forma dichiarativa sarebbe una riscrittura, non un trasloco, ed e' li'
 * che nascerebbero i difetti. */
export default function Screen({ id, titolo, onChiudi, onAperta, children }) {
  const ref = useRef(null);

  useEffect(() => {
    document.body.classList.add('screen-open');
    const nodo = ref.current;
    if (nodo) nodo.scrollTop = 0;

    const onKey = (e) => { if (e.key === 'Escape') onChiudi(); };
    document.addEventListener('keydown', onKey);

    let pulisci;
    if (onAperta && nodo) pulisci = onAperta(nodo);

    return () => {
      document.body.classList.remove('screen-open');
      document.removeEventListener('keydown', onKey);
      if (typeof pulisci === 'function') pulisci();
    };
  }, [onChiudi, onAperta]);

  return (
    <section
      className="screen is-open"
      id={id + '-screen'}
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={titolo}
    >
      {children}
      <button type="button" className="screen-back" onClick={onChiudi}>
        &larr; Vista intera
      </button>
    </section>
  );
}
