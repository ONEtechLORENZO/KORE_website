import { useRef } from 'react';
import { SCREENS } from './routes.js';
import { useHeaderHeight } from './useHeaderHeight.js';
import { useClock } from './useClock.js';

/* L'intestazione: marchio, menu delle schermate, orologio di Milano,
 * bottone del prezzo e interruttore del tema.
 * Su schermi stretti va a capo da sola: l'altezza reale viene misurata
 * e messa in --top-h, cosi' la scena sotto non sborda. */
export default function Header({ attiva, apri, dark, cambiaTema, onPrezzo }) {
  const ref = useRef(null);
  useHeaderHeight(ref);
  const { hhmm, ss } = useClock();

  return (
    <header className="top" ref={ref}>
      <a
        className="brand"
        href="#"
        aria-label="KORE, torna alla home"
        onClick={(e) => { e.preventDefault(); apri(null); }}
      >
        <img src={import.meta.env.BASE_URL + 'kore-mark.svg'} alt="" width="28" height="26" />
      </a>

      <nav className="top-nav">
        {SCREENS.filter((s) => s.menu).map((s) => (
          <button
            key={s.id}
            type="button"
            id={s.id + '-btn'}
            className={'top-link' + (attiva === s.id ? ' is-on' : '')}
            aria-pressed={attiva === s.id}
            onClick={() => apri(attiva === s.id ? null : s.id)}
          >
            {s.label}
          </button>
        ))}
      </nav>

      <button
        type="button"
        className={'top-link' + (attiva === null ? ' is-on' : '')}
        onClick={() => apri(null)}
      >
        Home
      </button>

      <p className="top-clock" aria-hidden="true">
        MILANO, IT {hhmm}<span className="sec">:{ss}</span>
      </p>

      <div className="journey-start">
        <button type="button" className="cta cta-purple" onClick={onPrezzo}>
          Prezzo
        </button>
      </div>

      <button
        type="button"
        id="theme-btn"
        className={'theme-btn' + (dark ? ' is-dark' : '')}
        aria-pressed={dark}
        aria-label={dark ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
        onClick={cambiaTema}
      >
        <i aria-hidden="true" />
      </button>
    </header>
  );
}
