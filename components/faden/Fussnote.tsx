/**
 * Fußnote des Fadens: die rechtlichen Links der alten Fußzeile (Footer.tsx) in einer
 * Zeile. Alles andere aus dem Footer (Rubriken, Werkzeuge, Anbieter, Dokumente) sitzt
 * im Register.
 */
const LINKS = [
  { label: "Impressum", href: "/impressum" },
  { label: "Datenschutz", href: "/datenschutz" },
  { label: "AGB", href: "/agb" },
  { label: "Erstinformationen", href: "/erstinformationen" },
  { label: "Widerrufsrecht", href: "/widerrufsrecht" },
  { label: "Kontakt", href: "/kontakt" },
];

export default function Fussnote() {
  return (
    <p className="fussnote">
      <span>© {new Date().getFullYear()} Finconext GmbH · finanzleser.de</span>
      {LINKS.map((l) => (
        <a key={l.href} href={l.href}>{l.label}</a>
      ))}
    </p>
  );
}
