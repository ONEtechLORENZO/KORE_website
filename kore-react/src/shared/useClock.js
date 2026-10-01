import { useEffect, useState } from 'react';

/* Ora di Milano nell'intestazione, aggiornata ogni secondo.
 * I secondi vanno in viola: e' il dettaglio chiesto sul sito attuale. */
export function useClock() {
  const [ora, setOra] = useState('');
  useEffect(() => {
    let fmt;
    try {
      fmt = new Intl.DateTimeFormat('it-IT', {
        timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit',
        second: '2-digit', hour12: false,
      });
    } catch (e) { fmt = null; }
    const tick = () => {
      const d = new Date();
      setOra(fmt ? fmt.format(d).replace(/\./g, ':') : d.toTimeString().slice(0, 8));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  const i = ora.lastIndexOf(':');
  return i < 0 ? { hhmm: ora, ss: '' } : { hhmm: ora.slice(0, i), ss: ora.slice(i + 1) };
}
