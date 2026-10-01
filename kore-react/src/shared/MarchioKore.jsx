/* Il marchio KORE come SVG dentro la pagina, non come <img>.
 *
 * Serve perche' cosi' eredita il colore del testo: sul fondo viola del
 * percorso d'acquisto va bianco, altrove va del colore che gli si da'.
 * Un <img> disegna l'SVG isolato e currentColor diventerebbe nero,
 * cioe' invisibile sul viola.
 *
 * Le coordinate sono quelle del motore della pagina Partners: stesso segno
 * del sito, non un disegno rifatto. */

const CORPO = 'M1107 1L1824 1L1002 839L1967 1793L1125 1793L591 1262L0 1850L1 1083Z';
const TRIANGOLO = 'M4 0L683 0L4 670Z';

export default function MarchioKore({ size = 28, className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 1967 1850"
      width={size}
      height={Math.round((size * 1850) / 1967)}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d={CORPO} />
      <path d={TRIANGOLO} />
    </svg>
  );
}
