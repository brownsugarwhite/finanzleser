/**
 * Anteilsband — „So verteilt sich Ihre Zahlung“: Tilgung gegen Zinsen.
 *
 * Vorlage: „Finanzleser Vergleich & Rechner - Kursblatt.dc.html“:312-316.
 * Ein 18 px hoher Streifen mit 2 px Lücke, darunter die Legende mit Prozenten.
 */
export default function Anteilsband({
  titel, teile,
}: {
  titel: string;
  teile: { label: string; anteil: number; ton: "ink" | "magenta" }[];
}) {
  const prozent = (a: number) => `${Math.round(a * 100)}%`;
  return (
    <div className="kb-anteil">
      <span className="kb__kicker">{titel}</span>
      <div className="kb-anteil__band" aria-hidden="true">
        {teile.map((t, i) => (
          <i
            key={t.label}
            data-ton={t.ton}
            /* Der letzte Teil füllt den Rest — sonst klafft bei krummen Anteilen eine Lücke. */
            style={i === teile.length - 1 ? { flex: 1 } : { width: prozent(t.anteil) }}
          />
        ))}
      </div>
      <div className="kb-anteil__legende">
        {teile.map((t) => (
          <span key={t.label}>
            <i data-ton={t.ton} aria-hidden="true" />
            {t.label} {prozent(t.anteil)}
          </span>
        ))}
      </div>
    </div>
  );
}
