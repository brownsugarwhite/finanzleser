/**
 * Startseite im Faden wie im Prototyp: Landing-Hero, dann der Strom mit Anzeigenplatz,
 * Kapitel „Heute“ (Leo begrüßt, die Spalten mit allen Rubriken, Themen und Ratgebern)
 * und die Vorschläge als Chips unter der Eingabe. Alles serverseitig aus den
 * bestehenden Gettern; JSON-LD bleibt wie auf der alten Startseite (app/page.tsx).
 */
import { getNavItems } from "@/lib/wordpress";
import { baueSpalten } from "@/lib/faden/spalten";
import { getBeitragsIndex } from "@/lib/faden/titel";
import { buildGlossarUrl } from "@/lib/urls";
import KapitelKopf from "./KapitelKopf";
import HeroLanding from "./hero/HeroLanding";
import Spalten from "./spalten/Spalten";
import Einschub from "./Einschub";
import Vorlesen from "./Vorlesen";

/** Vorschläge unter der Eingabe: Fragen an Leo (Chips wie im Prototyp), dazu ein Sprung in die Werkzeuge. */
const VORSCHLAEGE: { text: string; slug?: string; frage?: boolean; href?: string }[] = [
  { text: "Wie viel Unterhalt für zwei Kinder?", frage: true },
  { text: "Wie hoch ist das Kindergeld 2026?", frage: true },
  { text: "Wie viel Steuer zahle ich auf meine Rente?", frage: true },
  { text: "Alle Finanztools", href: "/finanztools" },
];

export default async function FadenLanding() {
  // Kein .catch auf WP-Fetches: Fehler müssen werfen, sonst cacht Next eine halbe Startseite (CLAUDE.md, Falle 2).
  const nav = await getNavItems();
  await getBeitragsIndex();
  const rubriken = await baueSpalten(nav);
  const chips = VORSCHLAEGE.map((v) => (v.frage ? { text: v.text, frage: v.text } : { text: v.text, href: v.href }));
  return (
    <>
      <HeroLanding />
      <Einschub format="leaderboard" variante="top" nr={0} />
      <section className="kapitel kapitel--live" id="kapitel-live" data-key="heute" data-titel="Heute" data-pfad="">
        <KapitelKopf pfad={[]} />
        <div className="kapitel__inhalt">
          <div className="wort wort--leo" id="leo-gruss">
            <img src="/assets/leo.svg" alt="Leo" />
            <div>
              <span className="kicker kicker--gruen">Leo</span>
              <p>Hallo, ich bin Leo, Ihr Finanzagent. Ich habe die <a className="begriff" href={buildGlossarUrl("avb")} data-b="avb">Versicherungsbedingungen</a> unserer Partner gelesen und antworte mit Quelle und Seite. Fragen Sie, blättern Sie oben im Register, oder stöbern Sie hier in den Rubriken. Grüne Begriffe erklären sich auf Tipp.</p>
              <div className="werkzeuge"><Vorlesen zielId="leo-gruss" /></div>
            </div>
          </div>
          <Spalten rubriken={rubriken} />
        </div>
        <script type="application/json" data-eingabe-chips="" dangerouslySetInnerHTML={{ __html: JSON.stringify(chips).replace(/</g, "\\u003c") }} />
      </section>
    </>
  );
}
