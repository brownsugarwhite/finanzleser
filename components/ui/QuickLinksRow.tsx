import Link from "next/link";

/**
 * Schnellzugriff-Textlinks unter der Dotline (TopNav). Open Sans 15 medium,
 * dark, hover → brand-secondary. Best-Guess-Slugs für die Themen-Links —
 * bei Bedarf hier anpassen.
 */
const QUICK_LINKS: { label: string; href: string }[] = [
  { label: "Dokumente", href: "/dokumente" },
  { label: "Anbieter", href: "/anbieter" },
  { label: "Rechner", href: "/finanztools/rechner" },
  { label: "Vergleiche", href: "/finanztools/vergleiche" },
  // ⬇ Best-Guess-Ziele — Slugs ggf. anpassen
  { label: "Energiekosten", href: "/finanzen/energiekosten" },
  { label: "Fahrradversicherung", href: "/versicherungen/fahrradversicherung" },
  { label: "Geldanlagen", href: "/finanzen/geldanlagen" },
];

export default function QuickLinksRow({ style }: { style?: React.CSSProperties }) {
  return (
    <nav className="quicklinks-row" aria-label="Schnellzugriff" style={style}>
      {QUICK_LINKS.map((l) => (
        <Link key={l.href} href={l.href} className="quicklinks-link">
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
