import Screen from '../shared/Screen.jsx';

/* Segnaposto onesto: la rotta, l'intestazione e la chiusura funzionano gia',
 * il contenuto della schermata e' ancora quello di index.html e va trasferito. */
export default function DaPortare({ id, titolo, onChiudi }) {
  return (
    <Screen id={id} titolo={titolo} onChiudi={onChiudi}>
      <div className="dp">
        <p className="dm-kick">// {id}</p>
        <h2 className="dm-title">{titolo}</h2>
        <p className="dp-nota">
          Schermata non ancora trasferita: il contenuto vive in
          <code> index.html</code>. Rotta, intestazione, tema e chiusura
          funzionano gia&#39;.
        </p>
      </div>
    </Screen>
  );
}
