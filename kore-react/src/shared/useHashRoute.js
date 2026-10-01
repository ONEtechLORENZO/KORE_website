import { useCallback, useEffect, useState } from 'react';
import { byHash, byId } from './routes.js';

/* Una sola schermata aperta per volta, decisa dall'indirizzo.
 * Tenere lo stato nell'hash significa che il tasto "indietro" del browser
 * e i link condivisi continuano a funzionare come nel sito attuale. */
export function useHashRoute() {
  /* Se l'indirizzo corrisponde a una schermata del sito si torna il suo id;
     altrimenti si lascia passare il nome cosi' com'e', perche' il percorso
     d'acquisto (#configura, #contratto, ...) ha rotte proprie. */
  const read = () => {
    const h = window.location.hash;
    if (!h || h === '#') return null;
    const s = byHash(h);
    return s ? s.id : h.slice(1);
  };
  const [screen, setScreen] = useState(read);

  useEffect(() => {
    const onHash = () => setScreen(read());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  /* open(null) torna alla home togliendo l'hash, senza lasciare un '#' vuoto
     nella cronologia. */
  const open = useCallback((id) => {
    if (!id) {
      const pulito = window.location.pathname + window.location.search;
      window.history.pushState('', document.title, pulito);
      setScreen(null);
      return;
    }
    const s = byId(id);
    if (s) window.location.hash = s.hash;
  }, []);

  return [screen, open];
}
