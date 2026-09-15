/**
 * Der Stempel — „BESTWERT“ über dem Rahmen des Gewinners, „Bestwert“ klein in der Zeile.
 *
 * Vorlage: „Finanzleser Vergleich & Rechner - Kursblatt.dc.html“:123 (groß, rotate −11°,
 * fl-stempel mit .5 s Verzug) und :191 (klein, rotate −6°, nur im breiten Satz).
 */
export default function Stempel({
  text, klein = false, animation,
}: {
  text: string;
  klein?: boolean;
  /** Name der Keyframes aus useLauf — wechselt bei jeder Neuberechnung, damit sie neu läuft. */
  animation?: string;
}) {
  return (
    <span
      className={"kb-stempel" + (klein ? " kb-stempel--klein" : "")}
      style={animation && animation !== "none" ? { animation: `${animation} .7s var(--kb-kurve) .5s both` } : undefined}
    >
      {text}
    </span>
  );
}
