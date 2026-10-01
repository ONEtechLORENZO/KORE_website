/* Le sole schermate vive del sito. Le otto versioni superate che restavano
 * in index.html (why, why2, fn, fn2, fn3, fl, ck, pt) non sono state portate:
 * i loro bottoni erano gia' nascosti da CSS e nessuna rotta le raggiungeva. */
export const SCREENS = [
  { id: 'why3', hash: '#perche',    label: 'Perch\u00e9 KORE?', menu: true },
  { id: 'fn4',  hash: '#funzioni',  label: 'Prodotto',          menu: true },
  { id: 'fl2',  hash: '#funnel',    label: 'Come funziona',     menu: true },
  { id: 'ck2',  hash: '#conkore',   label: 'Con KORE',          menu: true },
  { id: 'ab',   hash: '#chi-siamo', label: 'Chi siamo',         menu: true },
  { id: 'dm',   hash: '#contatti',  label: 'Contatti',          menu: true },
  /* raggiungibile solo dal link nel consenso del modulo, mai dal menu */
  { id: 'tc',   hash: '#privacy',   label: 'Privacy',           menu: false },
];

export const byHash = (h) => SCREENS.find((s) => s.hash === h) || null;
export const byId = (id) => SCREENS.find((s) => s.id === id) || null;
