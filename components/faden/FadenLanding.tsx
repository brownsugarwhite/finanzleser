/**
 * Startseite im Faden wie im Prototyp: Landing-Hero, dann der Strom mit Anzeigenplatz,
 * Kapitel „Heute“ (Leo begrüßt, Meldung zum Finanzwort des Tages, die Spalten mit allen
 * Rubriken, Themen und Ratgebern)
 * und die Vorschläge als Chips unter der Eingabe. Alles serverseitig aus den
 * bestehenden Gettern; JSON-LD bleibt wie auf der alten Startseite (app/page.tsx).
 */
import { getNavItems, getLatestPosts } from "@/lib/wordpress";
import { getWerkzeugIndex } from "@/lib/faden/werkzeugIndex";
import { werkzeugeDerWoche, type AusleseEintrag } from "@/lib/faden/landing";
import { teaserZeile } from "@/lib/faden/vergleichTeaser";
import { buildPostUrl } from "@/lib/urls";
import { decodeHtmlEntities } from "@/lib/html-utils";
import { baueSpalten } from "@/lib/faden/spalten";
import { buildGlossarUrl } from "@/lib/urls";
import { DOKUMENTE } from "@/lib/faden/bestand";
import LebendesKapitel from "./LebendesKapitel";
import Spalten from "./spalten/Spalten";
import NeuesteAusgabe from "./spalten/NeuesteAusgabe";
import FinanzwortKarte from "./spiele/FinanzwortKarte";
import SchlangeKarte from "./spiele/SchlangeKarte";
import KassensturzStart from "./kassensturz/KassensturzStart";
import { zieleAufloesen } from "@/lib/faden/kassensturzZiele";
import { getFadenOptionen } from "@/lib/faden/optionen";
import Begruessung from "./Begruessung";
import AusDemNewsletter from "./landing/AusDemNewsletter";
import Flugfenster from "./landing/Flugfenster";
import WochenbriefTeaser from "./landing/WochenbriefTeaser";
import PlusTeaser from "./landing/PlusTeaser";
import LeoEmpfiehlt from "./landing/LeoEmpfiehlt";
import WeiterredenChips from "./landing/WeiterredenChips";
import { spielUrl } from "./spiele/spielUrl";
import { spielAm } from "@/lib/faden/spiele";
import Insel from "@/components/faden/kette/Insel";
import { LeoRede } from "@/components/faden/leo/Blase";
import GlossarDaten from "@/components/faden/glossar/GlossarDaten";
import BegriffWink from "@/components/faden/glossar/BegriffWink";
import { getGlossarIndex, loeseBegriffe } from "@/lib/faden/glossar";

/** Vorschläge unter der Eingabe: Fragen an Leo (Chips wie im Prototyp), dazu ein Sprung in die Werkzeuge. */
/** Vorschläge unter der Eingabe.
 *  🚨 Nur noch SPRÜNGE. Die Gesprächsfragen stehen seit dem 12.09.2026 im eigenen Block
 *  „Weiterreden mit Leo" am Fadenende — beides zusammen ergäbe zweimal dieselben Fragen
 *  direkt übereinander. */
const VORSCHLAEGE: { text: string; slug?: string; frage?: boolean; href?: string }[] = [
  { text: "Kassensturz: Wie gut bin ich aufgestellt?", href: "/kassensturz" },
  { text: "Alle Finanztools", href: "/finanztools" },
];

export default async function FadenLanding() {
  // Kein .catch auf WP-Fetches: Fehler müssen werfen, sonst cacht Next eine halbe Startseite (CLAUDE.md, Falle 2).
  const nav = await getNavItems();
  // 🚨 `baueSpalten` fährt INTERN schon drei Verbindungen parallel (lib/faden/spalten.ts).
  // Es bekommt seine drei Slots allein — mehr als drei gleichzeitig verträgt das
  // WordPress nicht (CLAUDE.md, Falle 1).
  const rubriken = await baueSpalten(nav);
  // Danach drei unabhängige Abrufe in einem Zug. Ein Zug für die Beiträge: [0] ist das
  // Kopfblatt „Neueste Ausgabe", [1..3] die drei Ratgeber der Auslese — so steht kein
  // Titel zweimal auf der Seite. Kein .catch: Fehler müssen werfen, sonst cacht Next eine
  // halbe Startseite (CLAUDE.md, Falle 2); Promise.all wirft beim ersten davon.
  const [juengste, optionen, finanzwort] = await Promise.all([
    getLatestPosts(4),
    getFadenOptionen(),
    spielAm("finanzwort"),
  ]);
  const neueste = juengste[0] || null;
  // Kassensturz im Kapitel „Heute": dieselben Daten und Ziele wie auf /kassensturz.
  const { kassensturz } = optionen;
  const ksZiele = kassensturz ? await zieleAufloesen(kassensturz) : {};
  // Standard-Chips wie im Prototyp (STANDARD_CHIPS): zuletzt „Finanzwort des Tages“ auf die Spielseite des Tages.
  const chips = [
    ...VORSCHLAEGE.map((v) => (v.frage ? { text: v.text, frage: v.text } : { text: v.text, href: v.href })),
    ...(finanzwort ? [{ text: "Finanzwort des Tages", href: spielUrl(finanzwort.slug) }] : []),
  ];
  // Leos Begrüßung verlinkt „Versicherungsbedingungen". Ohne Nutzlast holt das Klickmenü
  // den Begriff beim Antippen über /api/faden/glossar/<slug> — eine CMS-Abfrage mitten in
  // der Geste. Auf einer vorgerenderten Seite kostet das Mitschicken nichts.
  // Der Werkzeugindex ist über getWerkzeugZahlen() im Layout und über zieleAufloesen
  // ohnehin warm — die Auslese und Leos Empfehlungen kosten deshalb keine einzige
  // zusätzliche WP-Abfrage.
  const [glossar, werkzeuge] = await Promise.all([getGlossarIndex(), getWerkzeugIndex()]);
  const avb = glossar.get("avb");
  const begriffe = avb ? await loeseBegriffe([avb]) : [];
  const auslese: AusleseEintrag[] = [
    ...juengste.slice(1, 4).map((p) => ({ label: "Ratgeber", titel: decodeHtmlEntities(p.title), href: buildPostUrl(p) })),
    ...werkzeugeDerWoche(werkzeuge),
  ];
  // Baustein 2 der Übergabe: vier Vergleichs-Teaser mit Säulen-Marktband. Die Zahlen
  // kommen aus dem Vergleichs-Schnappschuss in WordPress — höchstens zwei Abrufe
  // gleichzeitig, danach liegen sie 24 h im Data-Cache (lib/faden/vergleichTeaser.ts).
  const teaser = await teaserZeile(werkzeuge);

  return (
    <>
      {/* Leo steht in jedem Leo-Block und ist das erste Bild des Kapitels. */}
      <link rel="preload" as="image" href="/assets/leo.svg" fetchPriority="high" />
      <section className="kapitel kapitel--live" id="kapitel-live" data-key="heute" data-titel="Heute" data-pfad="">
        <LebendesKapitel pfad={[]}>
          {/* Leo schreibt, sobald der Leser den Faden erreicht — die einzige Inszenierung,
              die geblieben ist. Alles andere steht ab dem ersten Paint da (Begruessung.tsx). */}
          <Begruessung>
          <div className="wort wort--leo" id="leo-gruss">
            <span className="kicker kicker--gruen">Leo</span>
            <LeoRede>
              <p>Hallo, ich bin Leo, Ihr KI-Finanzagent. Ich habe {DOKUMENTE.toLocaleString("de-DE")} <a className="begriff" href={buildGlossarUrl("avb")} data-b="avb">Versicherungsbedingungen</a> gelesen und antworte mit Quelle und Seite. Fragen Sie, blättern Sie oben im Register, oder stöbern Sie hier in unseren Ratgebern. Grüne Begriffe erklären sich auf Tipp.</p>
            </LeoRede>
            <BegriffWink ziel="#leo-gruss" />
          </div>
          {/* Reihenfolge der Zeitungsseite (12.09.2026): Kopfblatt, Kiosk, Kassensturz,
              Wort des Tages — danach kommen Wochenbrief, Spiel, Plus und Leo. */}
          <NeuesteAusgabe post={neueste} rubriken={rubriken.reduce((a, r) => a + r.zahl, 0)} />
          <Insel typ="spalten" werte={rubriken}><Spalten rubriken={rubriken} /></Insel>
          {kassensturz && <Insel typ="kassensturz" werte={{ daten: kassensturz, ziele: ksZiele }}><KassensturzStart daten={kassensturz} ziele={ksZiele} /></Insel>}
          <FinanzwortKarte />
          <AusDemNewsletter eintraege={auslese} />
          {/* Der Flug zum Newsletter: reines Bild, kein Text — er leitet vom Inhalt der
              Auslese zum Eintragen darunter über. */}
          <Insel typ="flugfenster"><Flugfenster /></Insel>
          <WochenbriefTeaser />
          <SchlangeKarte />
          <PlusTeaser />
          <Insel typ="leo-empfiehlt" werte={{ teaser, daten: kassensturz }}><LeoEmpfiehlt teaser={teaser} daten={kassensturz} /></Insel>
          <Insel typ="weiterreden"><WeiterredenChips /></Insel>

          </Begruessung>
        </LebendesKapitel>
        <GlossarDaten daten={begriffe} />
        <script type="application/json" data-eingabe-chips="" dangerouslySetInnerHTML={{ __html: JSON.stringify(chips).replace(/</g, "\\u003c") }} />
      </section>
    </>
  );
}
