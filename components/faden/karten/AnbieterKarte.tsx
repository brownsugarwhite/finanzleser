/**
 * Anbieter als Karte: die wichtigsten Wege (Website, E-Mail, Telefon, Adresse) oben,
 * darunter der vollständige Inhalt der alten Seite (Absätze, Kontakttabellen) mit den
 * bekannten Abschnitts-Icons und der bestehenden .anbieter-content-Gestaltung.
 */
import { zerlegeAnbieter } from "@/lib/faden/anbieter";
import { injectSectionIcons } from "@/lib/anbieter-utils";

export default function AnbieterKarte({ content }: { content: string }) {
  const d = zerlegeAnbieter(content);
  const wege = [
    d.website ? { label: "Website", wert: d.website.replace(/^https?:\/\//, "").replace(/\/$/, ""), href: d.website } : null,
    d.email ? { label: "E-Mail", wert: d.email, href: `mailto:${d.email}` } : null,
    d.telefon ? { label: "Telefon", wert: d.telefon, href: `tel:${d.telefon.replace(/[^\d+]/g, "")}` } : null,
    d.adresse ? { label: "Adresse", wert: d.adresse } : null,
  ].filter(Boolean) as { label: string; wert: string; href?: string }[];

  return (
    <div className="kasten kasten--still kasten--anbieter">
      <span className="kicker kicker--gruen">Anbieter · Kontakt, Kündigung, Schaden</span>
      {wege.length > 0 && (
        <div className="anbieter-k__spalten">
          {wege.map((w) => (
            <div key={w.label}>
              <span className="kicker">{w.label}</span>
              <p>{w.href ? <a href={w.href} target={w.href.startsWith("http") ? "_blank" : undefined} rel={w.href.startsWith("http") ? "noopener noreferrer" : undefined} data-faden-aus="">{w.wert}</a> : w.wert}</p>
            </div>
          ))}
        </div>
      )}
      <div className="anbieter-content prose" dangerouslySetInnerHTML={{ __html: injectSectionIcons(content) }} />
      <p className="quelle">Die Kontaktdaten wurden zum Zeitpunkt der Recherche von den Webseiten des Anbieters übernommen und können sich zwischenzeitlich geändert haben.</p>
    </div>
  );
}
