/**
 * Startseite im Faden wie im Prototyp: Landing-Hero, dann der Strom mit Anzeigenplatz,
 * Kapitel „Heute“ (Leo begrüßt, Meldung zum Finanzwort des Tages, die Spalten mit allen
 * Rubriken, Themen und Ratgebern)
 * und die Vorschläge als Chips unter der Eingabe. Alles serverseitig aus den
 * bestehenden Gettern; JSON-LD bleibt wie auf der alten Startseite (app/page.tsx).
 */
import { getNavItems, getLatestPosts } from "@/lib/wordpress";
import { baueSpalten } from "@/lib/faden/spalten";
import { buildGlossarUrl } from "@/lib/urls";
import { DOKUMENTE } from "@/lib/faden/bestand";
import KapitelKopf from "./KapitelKopf";
import Spalten from "./spalten/Spalten";
import NeuesteAusgabe from "./spalten/NeuesteAusgabe";
import FinanzwortKarte from "./spiele/FinanzwortKarte";
import Kassensturz from "./kassensturz/Kassensturz";
import { zieleAufloesen } from "@/lib/faden/kassensturzZiele";
import { getFadenOptionen } from "@/lib/faden/optionen";
import Begruessung from "./Begruessung";
import { spielUrl } from "./spiele/spielUrl";
import { spielAm } from "@/lib/faden/spiele";
import Insel from "@/components/faden/kette/Insel";
import { LeoRede } from "@/components/faden/leo/Blase";
import GlossarDaten from "@/components/faden/glossar/GlossarDaten";
import BegriffWink from "@/components/faden/glossar/BegriffWink";
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
  // Jüngster Beitrag für „Neueste Ausgabe" über den vier Rubriken.
  const neueste = (await getLatestPosts(1))[0] || null;
  // Kassensturz im Kapitel „Heute": dieselben Daten und Ziele wie auf /kassensturz.
  const { kassensturz } = await getFadenOptionen();
  const ksZiele = kassensturz ? await zieleAufloesen(kassensturz) : {};
  const finanzwort = await spielAm("finanzwort");
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
      <section className="kapitel kapitel--live" id="kapitel-live" data-key="heute" data-titel="Heute" data-pfad="">
        <KapitelKopf pfad={[]} />
        <div className="kapitel__inhalt">
          {/* Inszenierung wie im Prototyp: Leo schreibt erst, wenn der Leser den Faden
              erreicht; danach die Spalten leise, zuletzt das Finanzwort. Ohne JS steht
              alles sofort da (SSR unverändert). */}
          <Begruessung>
          <div className="wort wort--leo" id="leo-gruss">
            <span className="kicker kicker--gruen">Leo</span>
            <LeoRede>
              <p>Hallo, ich bin Leo, Ihr KI-Finanzagent. Ich habe {DOKUMENTE.toLocaleString("de-DE")} <a className="begriff" href={buildGlossarUrl("avb")} data-b="avb">Versicherungsbedingungen</a> gelesen und antworte mit Quelle und Seite. Fragen Sie, blättern Sie oben im Register, oder stöbern Sie hier in unseren Ratgebern. Grüne Begriffe erklären sich auf Tipp.</p>
            </LeoRede>
            <BegriffWink ziel="#leo-gruss" />
          </div>
          {/* Reihenfolge wie im Prototyp: erst die Rubrikenspalten, dann das Finanzwort
              (begruessung(): anhaengen(spaltenwahl, leise) vor meldung('Finanzwort…')). */}
          <NeuesteAusgabe post={neueste} />
          <Insel typ="spalten" werte={rubriken}><Spalten rubriken={rubriken} /></Insel>
          {kassensturz && <Kassensturz daten={kassensturz} ziele={ksZiele} />}
          <FinanzwortKarte />
          </Begruessung>
        </div>
        <GlossarDaten daten={begriffe} />
        <script type="application/json" data-eingabe-chips="" dangerouslySetInnerHTML={{ __html: JSON.stringify(chips).replace(/</g, "\\u003c") }} />
      </section>
    </>
  );
}
