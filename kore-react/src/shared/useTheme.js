import { useCallback, useEffect, useState } from 'react';

/* Chiaro / scuro. La scelta e' gia' stata applicata dallo script in index.html
 * prima del disegno: qui la si legge e la si cambia, senza reintrodurre il lampo. */
const KEY = 'kore-theme';

export function useTheme() {
  const [dark, setDark] = useState(
    () => document.documentElement.classList.contains('theme-dark')
  );

  useEffect(() => {
    document.documentElement.classList.toggle('theme-dark', dark);
    try { localStorage.setItem(KEY, dark ? 'dark' : 'light'); } catch (e) {}
  }, [dark]);

  return [dark, useCallback(() => setDark((v) => !v), [])];
}
