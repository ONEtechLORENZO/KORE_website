import { useCallback, useState } from 'react';
import Header from './shared/Header.jsx';
import { useHashRoute } from './shared/useHashRoute.js';
import { useTheme } from './shared/useTheme.js';
import Home from './screens/Home.jsx';
import Contatti from './screens/Contatti.jsx';
import DaPortare from './screens/DaPortare.jsx';
import { byId } from './shared/routes.js';

import Configuratore from './checkout/Configuratore.jsx';
import Preventivo from './checkout/Preventivo.jsx';
import Contratto from './checkout/Contratto.jsx';
import Pagamento from './checkout/Pagamento.jsx';
import Fatto from './checkout/Fatto.jsx';

/* Le schermate gia' trasferite dal sito. */
const PRONTE = { dm: Contatti };

/* Il percorso d'acquisto: configurazione, dati, contratto, pagamento, conferma.
 * Sta su rotte proprie perche' e' un percorso, non una schermata sola. */
const ACQUISTO = {
  configura: Configuratore,
  preventivo: Preventivo,
  contratto: Contratto,
  pagamento: Pagamento,
  fatto: Fatto,
};

export default function App() {
  const [attiva, apri] = useHashRoute();
  const [dark, cambiaTema] = useTheme();
  const [prezzoAperto, setPrezzo] = useState(false);

  const chiudi = useCallback(() => apri(null), [apri]);
  const vaiA = useCallback((passo) => { window.location.hash = '#' + passo; }, []);

  /* Il percorso d'acquisto non porta l'intestazione del sito: ha il suo
     marchio in alto e i propri passi, e basta. */
  const Acquisto = ACQUISTO[attiva];
  if (Acquisto) return <Acquisto vaiA={vaiA} onIndietro={chiudi} />;

  const Schermata = attiva ? PRONTE[attiva] : null;
  const info = attiva ? byId(attiva) : null;

  return (
    <>
      <Header attiva={attiva} apri={apri} dark={dark} cambiaTema={cambiaTema}
              onPrezzo={() => vaiA('configura')} />
      <Home prezzoAperto={prezzoAperto} onPrezzo={() => setPrezzo((v) => !v)} />
      {Schermata ? (
        <Schermata onChiudi={chiudi} apriPrivacy={() => apri('tc')} />
      ) : info ? (
        <DaPortare id={info.id} titolo={info.label} onChiudi={chiudi} />
      ) : null}
    </>
  );
}
