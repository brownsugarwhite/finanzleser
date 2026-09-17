import Link from "next/link";

/**
 * Die Reiterzeile unter dem Zeitungskopf — „Seite 1 · Vergleich“, „Seite 2 · Rechner“.
 *
 * Vorlage: „Finanzleser Vergleich & Rechner - Kursblatt.dc.html“:50-53.
 * Aktiv = Tinte statt Grau plus eine grüne 2-px-Unterlinie, die von links wächst.
 *
 * Im Prototyp folgen die Reiter dem Scroll, weil dort alle Seiten in einem Dokument
 * liegen. Im Produkt hat jede Seite ihre eigene URL; der Reiter ist dann ein Link auf
 * das Nachbarwerkzeug. Das `aktiv`-Blatt bleibt ein `<span>` — ein Link auf die Seite,
 * auf der man steht, ist keiner.
 */
export interface ReiterBlatt {
  label: string;
  href?: string;
  aktiv?: boolean;
}

export default function Seitenreiter({ blaetter }: { blaetter: ReiterBlatt[] }) {
  if (!blaetter.length) return null;
  return (
    <nav className="kb__reiter" aria-label="Seiten dieser Ausgabe">
      {blaetter.map((b) =>
        b.href && !b.aktiv ? (
          <Link key={b.label} href={b.href} className="kb__reiter-blatt">
            <span>{b.label}</span>
            <i aria-hidden="true" />
          </Link>
        ) : (
          <span
            key={b.label}
            className="kb__reiter-blatt"
            aria-current={b.aktiv ? "true" : undefined}
          >
            <span>{b.label}</span>
            <i aria-hidden="true" />
          </span>
        )
      )}
    </nav>
  );
}
