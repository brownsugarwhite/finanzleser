/**
 * Startseite im Faden wie im Prototyp: Landing-Hero, dann der Strom mit Anzeigenplatz,
 * Kapitel „Heute“ (Leo begrüßt, Meldung zum Finanzwort des Tages, die Spalten mit allen
 * Rubriken, Themen und Ratgebern)
 * und die Vorschläge als Chips unter der Eingabe. Alles serverseitig aus den
 * bestehenden Gettern; JSON-LD bleibt wie auf der alten Startseite (app/page.tsx).
 */
import { getNavItems } from "@/lib/wordpress";
import { baueSpalten } from "@/lib/faden/spalten";
import { buildGlossarUrl } from "@/lib/urls";
import KapitelKopf from "./KapitelKopf";
import HeroLanding from "./hero/HeroLanding";
import Spalten from "./spalten/Spalten";
import Einschub from "./Einschub";
import Vorlesen from "./Vorlesen";
import FinanzwortHeute from "./spiele/FinanzwortHeute";
import Begruessung from "./Begruessung";
import { spielUrl } from "./spiele/spielUrl";
import { spielAm } from "@/lib/faden/spiele";
import { getWerkzeugIndex } from "@/lib/faden/werkzeugIndex";
import Insel from "@/components/faden/kette/Insel";
import { LeoBlase } from "@/components/faden/leo/Blase";
import GlossarDaten from "@/components/faden/glossar/GlossarDaten";
import { getGlossarIndex, loeseBegriffe } from "@/lib/faden/glossar";

/** Vorschläge unter der Eingabe: Fragen an Leo (Chips wie im Prototyp), dazu ein Sprung in die Werkzeuge. */
const VORSCHLAEGE: { text: string; slug?: string; frage?: boolean; href?: string }[] = [
  { text: "Wie viel Unterhalt für zwei Kinder?", frage: true },
  { text: "Wie hoch ist das Kindergeld 2026?", frage: true },
  { text: "Wie viel Steuer zahle ich auf meine Rente?", frage: true },
  { text: "Kassensturz: Wie gut bin ich aufgestellt?", href: "/kassensturz" },
  { text: "Alle Finanztools", href: "/finanztools" },
];

export default async function FadenLanding() {
  // Kein .catch auf WP-Fetches: Fehler müssen werfen, sonst cacht Next eine halbe Startseite (CLAUDE.md, Falle 2).
  const nav = await getNavItems();
  const rubriken = await baueSpalten(nav);
  const finanzwort = await spielAm("finanzwort");
  // Echte Bestandszahlen für die Kacheln im Hero (statt der Prototyp-Zahlen).
  const zahlen = { rechner: 0, vergleich: 0, checkliste: 0 };
  for (const key of (await getWerkzeugIndex()).keys()) { const typ = key.split(":")[0] as keyof typeof zahlen; if (typ in zahlen) zahlen[typ]++; }
  // Standard-Chips wie im Prototyp (STANDARD_CHIPS): zuletzt „Finanzwort des Tages“ auf die Spielseite des Tages.
  const chips = [
    ...VORSCHLAEGE.map((v) => (v.frage ? { text: v.text, frage: v.text } : { text: v.text, href: v.href })),
    ...(finanzwort ? [{ text: "Finanzwort des Tages", href: spielUrl(finanzwort.slug) }] : []),
  ];
  // Leos Begrüßung verlinkt „Versicherungsbedingungen". Ohne Nutzlast holt das Klickmenü
  // den Begriff beim Antippen über /api/faden/glossar/<slug> — eine CMS-Abfrage mitten in
  // der Geste. Auf einer vorgerenderten Seite kostet das Mitschicken nichts.
  const glossar = await getGlossarIndex();
  const avb = glossar.get("avb");
  const begriffe = avb ? await loeseBegriffe([avb]) : [];

  return (
    <>
      <HeroLanding zahlen={zahlen} />
      <Einschub format="leaderboard" variante="top" nr={0} />
      <section className="kapitel kapitel--live" id="kapitel-live" data-key="heute" data-titel="Heute" data-pfad="">
        <KapitelKopf pfad={[]} />
        <div className="kapitel__inhalt">
          {/* Inszenierung wie im Prototyp: Leo schreibt erst, wenn der Leser den Faden
              erreicht; danach die Spalten leise, zuletzt das Finanzwort. Ohne JS steht
              alles sofort da (SSR unverändert). */}
          <Begruessung>
          <div className="wort wort--leo" id="leo-gruss">
            <span className="kicker kicker--gruen">Leo</span>
            <LeoBlase>
              <p>Hallo, ich bin Leo, Ihr Finanzagent. Ich habe die <a className="begriff" href={buildGlossarUrl("avb")} data-b="avb">Versicherungsbedingungen</a> unserer Partner gelesen und antworte mit Quelle und Seite. Fragen Sie, blättern Sie oben im Register, oder stöbern Sie hier in den Rubriken. Grüne Begriffe erklären sich auf Tipp.</p>
            </LeoBlase>
            <div className="werkzeuge"><Insel typ="vorlesen" arg="leo-gruss"><Vorlesen zielId="leo-gruss" /></Insel></div>
          </div>
          {/* Reihenfolge wie im Prototyp: erst die Rubrikenspalten, dann das Finanzwort
              (begruessung(): anhaengen(spaltenwahl, leise) vor meldung('Finanzwort…')). */}
          <Insel typ="spalten" werte={rubriken}><Spalten rubriken={rubriken} /></Insel>
          <FinanzwortHeute />
          </Begruessung>
        </div>
        <GlossarDaten daten={begriffe} />
        <script type="application/json" data-eingabe-chips="" dangerouslySetInnerHTML={{ __html: JSON.stringify(chips).replace(/</g, "\\u003c") }} />
      </section>
    </>
  );
}
