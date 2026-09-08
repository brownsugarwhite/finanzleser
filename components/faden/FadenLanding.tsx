/**
 * Startseite im Faden: Landing-Hero + Kapitel „Heute“ (Leo begrüßt, die Spalten mit
 * allen Rubriken, Themen und Ratgebern, Vorschläge). Alles serverseitig aus den
 * bestehenden Gettern; JSON-LD bleibt wie auf der alten Startseite (app/page.tsx).
 */
import Link from "next/link";
import { getNavItems, getToolCategories } from "@/lib/wordpress";
import { baueSpalten } from "@/lib/faden/spalten";
import { getBeitragsIndex } from "@/lib/faden/titel";
import KapitelKopf from "./KapitelKopf";
import HeroLanding, { type HeroVorschlag, type HeroWerkzeug } from "./hero/HeroLanding";
import Spalten from "./spalten/Spalten";

const VORSCHLAEGE: { slug: string; text: string }[] = [
  { slug: "duesseldorfer-tabelle", text: "Wie viel Unterhalt für zwei Kinder?" },
  { slug: "kindergeld", text: "Wie hoch ist das Kindergeld 2026?" },
  { slug: "rentenbesteuerung", text: "Wie viel Steuer zahle ich auf meine Rente?" },
];

export default async function FadenLanding() {
  // Kein .catch auf WP-Fetches: Fehler müssen werfen, sonst cacht Next eine halbe Startseite (CLAUDE.md, Falle 2).
  const [nav, toolKategorien, index] = await Promise.all([getNavItems(), getToolCategories(), getBeitragsIndex()]);
  const rubriken = await baueSpalten(nav);
  const vorschlaege: HeroVorschlag[] = VORSCHLAEGE.map((v) => ({ text: v.text, href: index.get(v.slug)?.href || `/${v.slug}` }));
  const zahl = (teil: string) => toolKategorien.find((k) => k.href.includes(teil))?.count || 0;
  const werkzeuge: HeroWerkzeug[] = [
    { typ: "rechner", label: "Rechner", zahl: zahl("rechner") || 56, beschreibung: "Unterhalt, Rente, Steuer, Kredit", href: "/finanztools/rechner" },
    { typ: "vergleich", label: "Vergleiche", zahl: zahl("vergleiche") || 43, beschreibung: "Tarife nebeneinander", href: "/finanztools/vergleiche" },
    { typ: "checkliste", label: "Checklisten", zahl: zahl("checklisten") || 207, beschreibung: "Schritt für Schritt, als PDF", href: "/finanztools/checklisten" },
  ];
  return (
    <>
      <HeroLanding vorschlaege={vorschlaege} werkzeuge={werkzeuge} />
      <section className="kapitel kapitel--live" id="kapitel-live" data-key="heute" data-titel="Heute" data-pfad="">
        <KapitelKopf pfad={[]} />
        <div className="kapitel__inhalt">
          <div className="wort wort--leo">
            <img src="/assets/leo.svg" alt="Leo" />
            <div>
              <span className="kicker kicker--gruen">Leo</span>
              <p>Hallo, ich bin Leo, Ihr Finanzagent. Ich habe die Versicherungsbedingungen unserer Partner gelesen und antworte mit Quelle und Seite. Fragen Sie, blättern Sie oben im Register, oder stöbern Sie hier in den vier Rubriken.</p>
            </div>
          </div>
          <Spalten rubriken={rubriken} />
          <div className="chips">
            {vorschlaege.map((v) => <a key={v.href} className="chip" href={v.href}>{v.text}</a>)}
            <Link className="chip chip--still" href="/finanztools">Alle Finanztools</Link>
          </div>
        </div>
      </section>
    </>
  );
}
