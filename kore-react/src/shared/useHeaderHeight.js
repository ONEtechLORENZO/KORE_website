import { useEffect } from 'react';

/* L'altezza vera dell'intestazione finisce in una variabile CSS.
 * Su schermi stretti il menu va a capo (due o tre righe): le stime fisse
 * facevano sbordare la scena sotto il bordo dello schermo. */
export function useHeaderHeight(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const misura = () => {
      const h = Math.round(el.getBoundingClientRect().height);
      if (h) document.documentElement.style.setProperty('--top-h', h + 'px');
    };
    misura();
    window.addEventListener('resize', misura);
    let ro;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(misura);
      ro.observe(el);
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(misura).catch(() => {});
    }
    return () => {
      window.removeEventListener('resize', misura);
      if (ro) ro.disconnect();
    };
  }, [ref]);
}
