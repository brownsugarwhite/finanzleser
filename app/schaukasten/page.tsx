/**
 * Schaukasten: jedes Bauteil des Fadens einmal, zum Anschauen und Prüfen.
 *
 * Zweck ist die Abnahme, nicht die Seite. Deshalb hängt die Route an SCHAUKASTEN_AKTIV
 * (lib/faden/flag.ts) — in der Entwicklung immer da, in einem Produktions-Build nur mit
 * NEXT_PUBLIC_SCHAUKASTEN=1 — und trägt zusätzlich noindex.
 *
 * Die Abschnitte tragen `data-toc-titel`, damit auch das Inhaltsverzeichnis in der
 * linken Randspalte und die Marken auf dem Fortschritts-Gleis mitgeprüft werden können.
 * Der Ratgeber mit allen Tabellen, Statistiken, Werkzeugen und Dokumenten hängt als
 * eigenes Kapitel daran (app/schaukasten/ratgeber).
 *
 * Die Links stehen bewusst als <a> und nicht als <Link>: im Faden fängt der Provider
 * jeden internen Klick ab und navigiert selbst (lib/faden/ziel.ts). Ein <Link> würde
 * zusätzlich seinen eigenen router.push auslösen — zweimal navigieren für einen Klick.
 * Der ganze übrige Faden macht es genauso; nur fällt es hier auf, weil die Adressen
 * wörtlich dastehen und die Regel sie deshalb erkennt.
 */
/* eslint-disable @next/next/no-html-link-for-pages */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SCHAUKASTEN_AKTIV } from "@/lib/faden/flag";
import { schaukastenWerkzeuge, STATISTIKEN } from "@/lib/faden/schaukasten";
import { getArticleToolData } from "@/lib/articleToolData";
import KartenKapitel from "@/components/faden/KartenKapitel";
import Insel from "@/components/faden/kette/Insel";
import WerkzeugKarte from "@/components/faden/kette/WerkzeugKarte";
import StatistikKarte from "@/components/statistik/StatistikKarte";
import { LeoRede, FrageBlase } from "@/components/faden/leo/Blase";
import Weiterlesen from "@/components/faden/kette/Weiterlesen";
import SucheLeo from "@/components/faden/karten/SucheLeo";
import ListenKarte from "@/components/faden/karten/ListenKarte";
import KassensturzTeaser from "@/components/faden/kassensturz/KassensturzTeaser";
import MeinBereich from "@/components/faden/karten/MeinBereich";
import WaechterKarte from "@/components/faden/karten/WaechterKarte";
import AktenkofferKarte from "@/components/faden/karten/AktenkofferKarte";
import LeoFragt from "@/components/faden/leo/LeoFragt";
import FadenSpiel from "@/components/faden/spiele/FadenSpiel";
import Schlange from "@/components/faden/spiele/Schlange";
import Finanzwort from "@/components/faden/spiele/Finanzwort";
import SolitaerKarte from "@/components/faden/spiele/SolitaerKarte";
import SchaukastenModus from "@/components/faden/SchaukastenModus";
import { getWerkzeugIndex } from "@/lib/faden/werkzeugIndex";
import Zeitungskopf from "@/components/faden/Zeitungskopf";
import SchaukastenTokens from "@/components/faden/SchaukastenTokens";
import { schriftgrade, harteFarben, knopfformen, abstaende, radien, schatten } from "@/lib/faden/inventur";
import Button from "@/components/ui/Button";
import Einschub from "@/components/faden/Einschub";
import Fortschrittsreihe from "@/components/faden/kassensturz/Fortschrittsreihe";
import KassensturzStart from "@/components/faden/kassensturz/KassensturzStart";
import { getFadenOptionen } from "@/lib/faden/optionen";
import { zieleAufloesen } from "@/lib/faden/kassensturzZiele";
import AusDemNewsletter from "@/components/faden/landing/AusDemNewsletter";
import Adresszeile from "@/components/faden/Adresszeile";
import PlusTeaser from "@/components/faden/landing/PlusTeaser";
import Flugfenster from "@/components/faden/landing/Flugfenster";
import VergleichsTeaser from "@/components/faden/landing/VergleichsTeaser";
import { teaserZeile } from "@/lib/faden/vergleichTeaser";
import WeiterredenChips from "@/components/faden/landing/WeiterredenChips";
import VergleichKoerper from "@/components/vergleich/VergleichKoerper";
import Setzkasten from "@/components/kursblatt/Setzkasten";
import Ergebnisteile from "@/components/kursblatt/Ergebnisteile";
import RechnerEmbed from "@/components/rechner/RechnerEmbed";
import Statistik from "@/components/statistik/Statistik";
import { HANDOFF_BEISPIELE } from "@/lib/statistik/handoffBeispiele";
import { FORM_NAME, pruefeStatistik } from "@/lib/statistik/schema";

export const metadata: Metadata = {
  title: "Schaukasten · Bausteine",
  robots: { index: false, follow: false },
};

function Abschnitt({ titel, nr, von, children }: { titel: string; nr: number; von: number; children: React.ReactNode }) {
  return (
    <section className="abschnitt" id={`schau-${nr}`} data-toc-titel={titel}>
      <span className="kicker">Abschnitt {nr} von {von}</span>
      <h2 className="abschnitt__titel">{titel}</h2>
      <div className="fliess">{children}</div>
    </section>
  );
}

export default async function Schaukasten() {
  if (!SCHAUKASTEN_AKTIV) notFound();
  const { slugs, content } = await schaukastenWerkzeuge();
  const toolData = await getArticleToolData(content, "schaukasten");
  // Dieselben vier Werkzeuge wie im Schaukasten-Ratgeber — die Slugs kommen von dort,
  // nicht aus `toolData.titles`: Dokumente stehen dort in einem eigenen Feld und fehlten
  // sonst als einzige Sorte.
  const embeds = (["rechner", "checkliste", "dokumente"] as const)
    .filter((typ) => slugs[typ])
    .map((typ) => ({ art: "embed" as const, typ, slug: slugs[typ], slugs: typ === "dokumente" ? [slugs[typ]] : undefined }));

  // Die Listenkarte mit echtem Bestand füllen — je Sorte die ersten Einträge aus dem
  // Werkzeug-Index. Erfundene Beispielzeilen sagen über die Gestaltung wenig; echte
  // Titel zeigen sofort, wie lange Namen umbrechen und wo die Punktführung reißt.
  const index = await getWerkzeugIndex();
  /* Die Vergleichs-Teaser mit ECHTEN Zahlen — derselbe Aufruf wie auf der Startseite.
     🚨 Absichtlich nicht erfunden: Der Teaser entscheidet seine Form an der Menge der
     Angebote (`bandform`), und genau das soll hier prüfbar sein. Vier Abrufe, höchstens
     zwei gleichzeitig, danach 24 h im Data-Cache (lib/faden/vergleichTeaser.ts). */
  const teaser = await teaserZeile(index);
  /* Der Kassensturz mit den ECHTEN Fragen aus den Faden-Optionen — dieselben Daten und
     dieselben aufgelösten Ziele wie im Kapitel „Heute" und auf /kassensturz. Mit
     erfundenen Fragen ließe sich weder der Fahrplan noch der Beleg prüfen: beide zählen
     an den Segmenten des echten Katalogs entlang. */
  const { kassensturz } = await getFadenOptionen();
  const ksZiele = kassensturz ? await zieleAufloesen(kassensturz) : {};
  const ausIndex = (typ: "rechner" | "checkliste" | "dokumente", n: number) =>
    [...index.entries()]
      .filter(([k]) => k.startsWith(`${typ}:`))
      .slice(0, n)
      .map(([, v]) => ({ titel: v.titel, href: v.href, dot: typ as "rechner" | "checkliste" | "dokumente" }));
  const listen = [
    { titel: "Rechner", zahl: [...index.keys()].filter((k) => k.startsWith("rechner:")).length, eintraege: ausIndex("rechner", 4).map((e, i) => (i === 0 ? { ...e, untertitel: "Mit Untertitel: die zweite Zeile trägt die Erläuterung.", meta: "3 Min." } : e)) },
    { titel: "Checklisten", zahl: [...index.keys()].filter((k) => k.startsWith("checkliste:")).length, eintraege: ausIndex("checkliste", 3) },
    { titel: "Dokumente", zahl: [...index.keys()].filter((k) => k.startsWith("dokumente:")).length, eintraege: ausIndex("dokumente", 3).map((e, i) => (i === 0 ? { ...e, tools: ["rechner", "checkliste"] as ("rechner" | "checkliste")[] } : e)) },
  ];

  // „Mein Bereich" zeigt Punktestand, Wappen und die aktiven Wächter — die Regeln kommen
  // im Betrieb aus den Faden-Optionen; hier drei erfundene, damit die Karte gefüllt ist.
  // 🚨 Die drei decken die drei Fälle von `wann()` in WaechterKarte.tsx ab: ein freier
  // Termin, ein Stichtag im Format MM-TT, und gar keine Angabe. Sonst sieht man im
  // Schaukasten nur einen davon.
  const WAECHTER = [
    { key: "strompreis", titel: "Strompreis-Wächter", regel: "Meldet, wenn Ihr Versorger eine Preiserhöhung ankündigt." },
    { key: "kuendigungsfrist", titel: "Kündigungsfrist", regel: "Erinnert sechs Wochen vor Ablauf Ihres Vertrags.", termin: "sechs Wochen vorher" },
    { key: "grundfreibetrag", titel: "Grundfreibetrag", regel: "Meldet sich, wenn sich der steuerliche Grundfreibetrag ändert.", stichtag: "01-01" },
  ];
  // Die Auslese des Newsletter-Blocks mit echtem Bestand, damit Umbrüche und
  // Punktführung an wirklichen Titeln geprüft werden können.
  const auslese = [
    ...ausIndex("rechner", 2).map((e) => ({ label: "Rechner", titel: e.titel, href: e.href, dot: "rechner" as const })),
    ...ausIndex("checkliste", 2).map((e) => ({ label: "Checkliste", titel: e.titel, href: e.href, dot: "checkliste" as const })),
    ...ausIndex("dokumente", 2).map((e) => ({ label: "Dokument", titel: e.titel, href: e.href })),
  ];
  // 🚨 Aus den Stylesheets gelesen, nicht gepflegt: siehe lib/faden/inventur.ts.
  const grade = schriftgrade();
  const farben = harteFarben();
  const formen = knopfformen();
  const luft = abstaende();
  const ecken = radien();
  const huelle = schatten();

  /**
   * 🚨 Die Abschnitte stehen als Liste, nicht als Folge von JSX-Blöcken mit
   * handgetippten Nummern. Bis zum 16.09.2026 musste, wer einen Abschnitt einfügte,
   * alle folgenden `nr` und die Konstante `VON` von Hand nachziehen — die einzige
   * Sollbruchstelle dieser Seite.
   */
  const ABSCHNITTE: { titel: string; inhalt: React.ReactNode }[] = [
    { titel: "Tokens", inhalt: (<>
        <p>
          Alle Werte, die mehr als einmal vorkommen. Sie stehen in <code>app/tokens.css</code> und
          gelten für den Faden UND das Kursblatt; hier stehen sie so, wie der Browser sie gerade
          auflöst — nicht abgeschrieben, sondern <strong>gemessen</strong>. Wer im Faden eine Zahl
          direkt in eine Regel schreibt, muss sie begründen können; <code>npm run wache</code>
          schlägt an, sobald eine dazukommt. Die Namen und ihre Aufgaben stehen in
          <code>lib/faden/tokenliste.ts</code> — nur die Namen, nie die Werte.
        </p>
        <SchaukastenTokens />
    </>) },

    { titel: "Schrift und Zeitungssatz", inhalt: (<>
        <div className="chips" style={{ marginBottom: "var(--luft-m)" }}>
          <span className="kicker">Kicker · grau</span>
          <span className="kicker kicker--gruen">Kicker · grün</span>
          <span className="kicker kicker--pink">Kicker · magenta</span>
          <span className="kicker kicker--tool"><i className="dot dot--vergleich" />Kicker · Werkzeug</span>
        </div>
        <h3>Zwischentitel (h3)</h3>
        <p className="vorspann">Vorspann: kursiv, gesetzt in Merriweather, für den Einstieg in einen Beitrag.</p>
        <div className="prose zeitung zeitung--initiale">
          <p>Fließtext im Zeitungssatz mit Initiale. Zwei Spalten ab 1060 px, Spaltenlinie dazwischen, Absätze dürfen über den Knick laufen — so setzt es die Zeitung. Dieser Absatz ist lang genug, damit der Umbruch wirklich zu sehen ist und nicht nur behauptet wird.</p>
          <p>Ein zweiter Absatz mit einem <a href="/schaukasten">Link im Fließtext</a> und einem <strong>fett gesetzten</strong> sowie einem <em>kursiven</em> Stück.</p>
        </div>
        <blockquote><p>Ein Zitat. Es steht kursiv, eingerückt, und trennt den Gedanken vom Rest.</p></blockquote>
        <p className="quelle">Quelle: Schaukasten – Beispieldaten</p>

        <h3 style={{ marginTop: "var(--luft-l)" }}>Aufzählungen</h3>
        <div className="prose">
          <ul>
            <li>Ein Punkt in einer Aufzählung. So sehen Listen im Fließtext eines Ratgebers aus.</li>
            <li>Ein zweiter Punkt, diesmal länger, damit der Umbruch der zweiten Zeile zu sehen ist und wie weit sie einrückt.</li>
            <li>Ein dritter Punkt mit einem <a href="/schaukasten">Link</a> darin.</li>
          </ul>
          <ol>
            <li>Nummeriert, erster Schritt.</li>
            <li>Nummeriert, zweiter Schritt.</li>
            <li>Nummeriert, dritter Schritt.</li>
          </ol>
        </div>

        <h3 style={{ marginTop: "var(--luft-l)" }}>Tabelle</h3>
        <div className="prose">
          <table>
            <thead>
              <tr><th>Haushalt</th><th>Verbrauch</th><th>Grundpreis</th><th>Im Monat</th></tr>
            </thead>
            <tbody>
              <tr><td>Eine Person</td><td>1.500 kWh</td><td>9,00 €</td><td>52 €</td></tr>
              <tr><td>Zwei Personen</td><td>2.500 kWh</td><td>9,00 €</td><td>82 €</td></tr>
              <tr><td>Drei Personen</td><td>3.500 kWh</td><td>11,50 €</td><td>114 €</td></tr>
              <tr><td>Vier Personen und mehr</td><td>4.250 kWh</td><td>11,50 €</td><td>135 €</td></tr>
            </tbody>
          </table>
          <p className="quelle">Quelle: Schaukasten – Beispieldaten, Stand 2026</p>
        </div>

        <h3 style={{ marginTop: "var(--luft-l)" }}>Verschachtelte Liste, Begriffe und Kleinkram</h3>
        <div className="prose">
          <ul>
            <li>
              Erste Ebene, mit einer zweiten darunter:
              <ul>
                <li>Zweite Ebene trägt einen Strich statt eines Quadrats.</li>
                <li>So bleibt der Rang sichtbar, ohne dass eine zweite Form dazukommt.</li>
              </ul>
            </li>
            <li>Ein Punkt mit <mark>Hervorhebung</mark>, einer <abbr title="Abgekürzt geschrieben">Abk.</abbr> und <code>Code im Fließtext</code>.</li>
          </ul>
          <dl>
            <dt>Effektiver Jahreszins</dt>
            <dd>Was ein Kredit im Jahr wirklich kostet — Sollzins plus alle Gebühren, auf die Laufzeit gerechnet.</dd>
            <dt>Tilgung</dt>
            <dd>Der Teil der Rate, der die Schuld verringert. Der Rest sind Zinsen.</dd>
          </dl>
          <hr />
          <figure>
            <div style={{ background: "var(--placeholder)", height: 120 }} />
            <figcaption>Eine Bildunterschrift: klein, grau, mit einer Haarlinie darüber. Quelle steht am Ende.</figcaption>
          </figure>
          <p><small>Kleintext für Fußnoten und Rechtliches.</small></p>
        </div>
    </>) },

    { titel: "Linien und Flächen", inhalt: (<>
        <p>
          <strong>Die Doppellinie ist eine Auszeichnung.</strong> Sie steht an genau zwei Stellen:
          am Anfang des Fadens und im Kiosk. Überall sonst grenzt eine Haarlinie ab.
        </p>
        <i className="doppellinie" />
        <p style={{ marginTop: "var(--luft-l)" }}>Der Zeitungskopf, wie er den Faden anführt:</p>
        <Zeitungskopf />
        <p style={{ marginTop: "var(--luft-l)" }}>
          Wie ein Block auf dem Papier steht, zeigt Abschnitt „Die Blöcke der Startseite“ —
          dort stehen die echten Bausteine, nicht nachgebaute.
        </p>
        <p style={{ marginTop: "var(--luft-l)" }}>Und die Ausnahme, wenn es wirklich ein Kärtchen sein soll:</p>
        <div className="kasten kasten--rahmen kasten--still">
          <span className="kicker">kasten--rahmen</span>
          <p style={{ margin: "6px 0 0" }}>Weißes Papier mit Kante. Braucht eine Begründung.</p>
        </div>
        <p className="hinweis" style={{ marginTop: "var(--luft-m)" }}>Hinweiszeile: gelber Grund, für Warnungen und Nachträge.</p>
    </>) },

    { titel: "Das Kopfsystem: Versalien und Linien", inhalt: (<>
        <p className="vorspann">
          Der Kicker ist das lauteste kleine Element der Seite. Wann er über, wann unter und
          wann in einer Linie steht, ist seit dem 16.09.2026 eine Regel und keine Laune.
        </p>
        <div className="prose">
          <ul>
            <li>Versalien <strong>UNTER</strong> der Linie → die Linie <em>eröffnet</em> einen Block.</li>
            <li>Versalien <strong>ÜBER</strong> der Linie → die Linie <em>schließt ab</em>.</li>
            <li>Versalien <strong>IN</strong> einer Fläche → nur der Tabellenkopf.</li>
            <li>Versalien <strong>OHNE</strong> Linie → Kicker direkt über der Schlagzeile.</li>
          </ul>
        </div>

        <div style={{ display: "grid", gap: "var(--luft-xl)", marginTop: "var(--luft-l)" }}>
          <div>
            <div className="satzkopf satzkopf--einhaenger satzkopf--einhaenger--rechner">
              <span className="kicker kicker--tool"><i className="dot dot--rechner" />Rechner · Einhänger</span>
              <span className="satzkopf__hinweis">3 Min.</span>
            </div>
            <h3 style={{ marginTop: "var(--luft-xs)" }}>Die Linie eröffnet</h3>
            <p>Für alles, was im Fließtext beginnt: Kästen, Werkzeuge, Spiele, Statistiken. Die Farbe der Linie sagt, um welches Werkzeug es geht.</p>
          </div>

          <div>
            <div className="satzkopf satzkopf--abschluss">
              <span className="kicker">Aus dem Bestand · Abschluss</span>
              <span className="satzkopf__hinweis">56 Einträge</span>
            </div>
            <p>Für Verzeichnisse, Listenköpfe, Kennzahlen: erst die Überschrift, dann der Strich, dann der Inhalt. Die Linie sagt „ab hier kommen die Einträge“.</p>
          </div>

          <div>
            <div className="satzkopf--band"><span className="kicker">Bundesland · Förderung · Zielgruppe</span></div>
            <p style={{ marginTop: "var(--luft-s)" }}>Versalien in einer Fläche gibt es nur im Tabellenkopf — grauer Grund, weiße Schrift, etwas engere Laufweite, weil eine Versalienzeile auf Fläche weniger Luft braucht als auf Papier.</p>
          </div>

          <div className="satzkopf--frei">
            <span className="kicker">Frei · ohne Linie</span>
            <h3 style={{ margin: 0 }}>Der Regelfall im Satz</h3>
            <p style={{ marginTop: "var(--luft-xs)" }}>Kicker, darunter die Schlagzeile, sonst nichts.</p>
          </div>

          <div>
            <div className="doppellinie" style={{ height: 6 }} />
            <p style={{ marginTop: "var(--luft-m)" }}>
              Die <strong>Doppellinie</strong> ist abschließend aufgezählt und gehört dem Kopf des Fadens,
              dem Kiosk, dem Tabellenkopf und dem Kennzahlenblock des Kursblatts. Sonst nirgends.
            </p>
          </div>
        </div>
    </>) },

    { titel: "Knöpfe, Chips und Links", inhalt: (<>
        <p>
          <strong>Vier Formen, mehr gibt es nicht.</strong> Die <code>.pille</code> holt den
          Blick (eine je Block), der <code>.knopf</code> trägt die Handlung nebenbei, der{" "}
          <code>.chip</code> die Wahl aus vielen gleichrangigen Möglichkeiten, der{" "}
          <code>.strich-link</code> den Verweis im Text. Alle vier stehen in{" "}
          <code>app/knoepfe.css</code> und gelten auch außerhalb des Fadens —{" "}
          <code>components/ui/Button.tsx</code> setzt dieselbe Pille.
        </p>
        <div className="reihe" style={{ alignItems: "center" }}>
          <Button label="Pille · Pfeil" href="/schaukasten" />
          <Button label="Pille · abwärts" icon="arrow-down" href="/schaukasten" />
          <Button label="Pille · Herunterladen" icon="download" href="/schaukasten" />
        </div>
        <div className="reihe" style={{ alignItems: "center", marginTop: "var(--luft-m)" }}>
          <Button label="Pille · Werkzeugfarbe" href="/schaukasten" farbe="var(--tuerkis)" />
          <Button label="Pille · klein" href="/schaukasten" klein />
          <Button label="Pille · klein" href="/schaukasten" klein />
        </div>
        <div className="chips" style={{ marginTop: "var(--luft-m)" }}>
          <button type="button" className="chip">Chip</button>
          <button type="button" className="chip" aria-pressed>Chip · gewählt</button>
          <button type="button" className="chip chip--still">Chip · still</button>
          <button type="button" className="knopf">Knopf</button>
          <button type="button" className="knopf knopf--primaer">Knopf · primär</button>
          <button type="button" className="knopf knopf--still knopf--klein">Knopf · still, klein</button>
          <a className="strich-link" href="/schaukasten">Strich-Link<i /></a>
          <a className="strich-link strich-link--gross" href="/schaukasten">Strich-Link · groß<i /></a>
          <a className="strich-link strich-link--still" href="/schaukasten">Strich-Link · still<i /></a>
        </div>
        <h3 style={{ marginTop: "var(--luft-xl)" }}>Jede Knopf- und Linkform, die es gibt</h3>
        <p>
          Nicht ausgesucht, sondern <strong>aus den Stylesheets gelesen</strong>: jede Klasse mit
          einer eigenen Regel, gerendert mit genau dieser Klasse. Wer eine Regel ändert, ändert
          diese Tafel mit. So ist zu sehen, was doppelt ist.
        </p>
        <ul className="inv inv__formen">
          {formen.map((f) => (
            <li key={f.klasse}>
              <button type="button" className={f.klasse}>{f.klasse}</button>
              <code>.{f.klasse}</code>
              <span>{f.datei}</span>
            </li>
          ))}
        </ul>
    </>) },

    { titel: "Leo und die Frage des Lesers", inhalt: (<>
        <div className="wort wort--leo">
          <span className="kicker kicker--gruen">Leo · Ihr Finanzagent</span>
          <LeoRede text="So spricht Leo: ohne Sprechblase, Kopf links in der Gasse, Text kursiv in Merriweather. Grüne Begriffe erklären sich auf Tipp.">
            <p>So spricht Leo: ohne Sprechblase, Kopf links in der Gasse, Text kursiv in Merriweather. Grüne Begriffe erklären sich auf Tipp.</p>
            <div className="quellen"><b>Quellen</b><span>› Schaukasten – Beispieldaten · S. 1</span></div>
          </LeoRede>
        </div>
        <div className="wort wort--frage" style={{ marginTop: 18 }}>
          <FrageBlase text="So steht die Frage des Lesers: dunkle Blase, weißer Text, ohne inneren Rahmen."><p>So steht die Frage des Lesers: dunkle Blase, weißer Text, ohne inneren Rahmen.</p></FrageBlase>
        </div>
        <div className="wort wort--leo" style={{ marginTop: 18 }}>
          <span className="kicker kicker--gruen">Leo schreibt</span>
          <LeoRede><div className="tippt" aria-label="Leo schreibt"><i /><i /><i /></div></LeoRede>
        </div>
        <div className="wort wort--leo wort--fehler" style={{ marginTop: 18 }}>
          <span className="kicker kicker--pink">Leo · gerade nicht erreichbar</span>
          <LeoRede fehler><p>So sieht die Störung aus.</p></LeoRede>
        </div>
        <div style={{ marginTop: 18 }}><SucheLeo q="Wie viel Strom verbraucht ein Haushalt?" /></div>
    </>) },

    { titel: "Ein Gespräch mit Leo", inhalt: (<>
        <p>Zwei Runden Frage und Antwort, so wie sie im Faden untereinander stehen.</p>
        <div className="wort wort--frage"><FrageBlase text="Was kostet mich Strom im Monat, wenn ich allein wohne?"><p>Was kostet mich Strom im Monat, wenn ich allein wohne?</p></FrageBlase></div>
        <div className="wort wort--leo">
          <span className="kicker kicker--gruen">Leo antwortet · mit Quelle und Seite</span>
          <LeoRede text="Ein Einpersonenhaushalt verbraucht rund 1.500 kWh im Jahr. Bei 34,8 ct/kWh und 9 € Grundpreis sind das etwa 52 € im Monat.">
            <p>Ein Einpersonenhaushalt verbraucht rund 1.500 kWh im Jahr. Bei 34,8 ct/kWh und 9 € Grundpreis sind das etwa 52 € im Monat.</p>
            <div className="quellen"><b>Quellen</b><span>› Schaukasten – Beispieldaten · S. 3</span></div>
          </LeoRede>
        </div>
        <div className="wort wort--frage" style={{ marginTop: 18 }}><FrageBlase text="Und wenn ich elektrisch Warmwasser mache?"><p>Und wenn ich elektrisch Warmwasser mache?</p></FrageBlase></div>
        <div className="wort wort--leo">
          <span className="kicker kicker--gruen">Leo antwortet · mit Quelle und Seite</span>
          <LeoRede text="Dann kommen etwa 800 kWh dazu — rund 25 € mehr im Monat. Ein Durchlauferhitzer ist der größte einzelne Posten in kleinen Haushalten.">
            <p>Dann kommen etwa 800 kWh dazu — rund 25 € mehr im Monat. Ein Durchlauferhitzer ist der größte einzelne Posten in kleinen Haushalten.</p>
            <div className="quellen"><b>Quellen</b><span>› Schaukasten – Beispieldaten · S. 4</span></div>
          </LeoRede>
        </div>
        {/* Echter Baustein statt Attrappe: die Chips morphen zur Frage, Leo schreibt darunter. */}
        <div style={{ marginTop: 22 }}>
          <Weiterlesen fragen={[
            { abschnitt: "heading-1", frage: "Wie senke ich den Verbrauch?", antwort: "Die drei größten Hebel sind Warmwasser, Kühlgeräte und Stand-by. Ein alter Kühlschrank zieht 300 kWh im Jahr, ein neuer 100 — das sind rund 70 Euro Unterschied.", quellen: ["Schaukasten – Beispieldaten · S. 5"] },
            { abschnitt: "heading-1", frage: "Lohnt ein anderer Tarif?", antwort: "Bei 1.500 kWh im Jahr liegen Grundversorgung und günstigster Tarif etwa 180 Euro auseinander. Der Wechsel dauert zehn Minuten, die Versorgung läuft ohne Unterbrechung weiter.", quellen: ["Schaukasten – Beispieldaten · S. 6"] },
            { abschnitt: "heading-1", frage: "Was kostet mich der Trockner?", antwort: "Rund 45 Euro im Jahr bei zweimal Trocknen pro Woche — ein Wärmepumpentrockner kommt auf etwa die Hälfte.", quellen: ["Schaukasten – Beispieldaten · S. 7"] },
          ]} />
        </div>
    </>) },

    { titel: "Leos Zwischenfrage", inhalt: (<>
        <p>Leo fragt von sich aus — einmal mit Chips, einmal mit Regler. Im Betrieb kommen die Fragen aus dem CMS und erscheinen in der rechten Randspalte.</p>
        <LeoFragt vorgabe={{
          key: "schaukasten-chips",
          ausloeser: { art: "lebenslage", wert: "schaukasten" },
          text: "Damit ich besser rechnen kann: Wie viele Menschen leben in Ihrem Haushalt?",
          art: "chips",
          chips: [{ text: "Ich allein" }, { text: "Zwei" }, { text: "Drei oder mehr" }],
        }} />
        <div style={{ marginTop: 18 }}>
          <LeoFragt vorgabe={{
            key: "schaukasten-regler",
            ausloeser: { art: "lebenslage", wert: "schaukasten" },
            text: "Wie viele Kilowattstunden standen auf Ihrer letzten Jahresrechnung?",
            art: "regler",
            regler: { min: 500, max: 6000, wert: 2500, schritt: 100, einheit: " kWh" },
          }} />
        </div>
    </>) },

    { titel: "Statistiken: alle dreizehn Formen", inhalt: (<>
        <p className="vorspann">
          Die dreizehn Formen aus Design A v2, jede mit ihrem Namen und ihrem Schlüssel — und
          zwar <strong>so, wie sie im Ratgeber wirklich stehen</strong>: in einer Insel, in einer
          Statistikkarte, im Satzspiegel des Fadens. Die eigene Route{" "}
          <a href="/schaukasten/statistiken">/schaukasten/statistiken</a> zeigt sie daneben ohne
          Hülle, für den A/B-Vergleich gegen die gerenderte Vorlage.
        </p>
        <p className="quelle">Alle Zahlen sind der Blindtext des Design-Handoffs, keine recherchierten Werte.</p>
        {HANDOFF_BEISPIELE.map((st, i) => {
          const befunde = pruefeStatistik(st);
          return (
            <div key={`${st.art}-${i}`} style={{ marginTop: "var(--luft-xl)" }}>
              <div className="satzkopf satzkopf--abschluss">
                <span className="kicker">{i + 1} · {FORM_NAME[st.art]}</span>
                <code className="satzkopf__hinweis">{st.art}</code>
              </div>
              <Insel typ="statistik-block" werte={st}><Statistik st={st} /></Insel>
              {befunde.length > 0 && (
                <p className="hinweis">🚨 {befunde.join(" · ")}</p>
              )}
            </div>
          );
        })}
    </>) },

    { titel: "Statistiken im Fließtext", inhalt: (<>
        <p>Drei Formen mit den Blinddaten des Schaukastens, so wie sie zwischen zwei Absätzen eines Ratgebers stehen.</p>
        {STATISTIKEN.map((st, i) => (
          <Insel key={i} typ="statistik" werte={st}><StatistikKarte st={st} /></Insel>
        ))}
    </>) },

    { titel: "Werkzeuge", inhalt: (<>
        <p>Rechner, Checkliste und Dokumente als Karten — mit echten Daten aus dem Bestand. Vergleiche fehlen hier bewusst.</p>
        {embeds.map((teil, i) => <WerkzeugKarte key={i} teil={teil} toolData={toolData} imInhalt />)}
    </>) },

    { titel: "Die fünf Eingabe-Bausteine", inhalt: (<>
        <p className="vorspann">
          Lineal, Drehring, Zählwerk, Setzzeile und Register ersetzen Feld und Auswahlliste in
          allen 56 Rechnern und in jedem Vergleich. Sie teilen seit Runde 2 des Kursblatt-Handoffs
          EINE Anatomie: Kicker-Label links, Bereich rechts, Wertzeile 40 px, Wert 26 px in
          Antiqua, Linie, Hinweiszeile. Die Farbe folgt dem Werkzeug — Türkis im Vergleich,
          Magenta im Rechner. Die Zahl selbst bleibt immer Tinte.
        </p>
        {/* 🚨 Der Setzkasten braucht den `.kb`-Rahmen. Er trägt ihn nicht selbst — die
            Entwurfsroute setzt ihn um ihn herum. Ohne ihn greift keine einzige
            `.kb .kb-*`-Regel, und die fünf Bausteine stehen als nackter Text da.
            🚨 Und KEINE Insel: der Vertrag einer Insel ist Typ + Slug, beim Aufklappen
            ersetzt InselnBeleben ihre Kinder durch die Komponente zu diesem Typ. Für den
            Setzkasten gibt es keinen. */}
        <div className="kb kb--rechner">
          <Setzkasten />
        </div>

        <h3 style={{ marginTop: "var(--luft-xxl)" }}>Ein ganzer Rechner</h3>
        <p>
          Derselbe <code>KursblattRechner</code>, den alle 56 Rechner benutzen — hier mit dem
          Schema <code>brutto-netto</code>. Er rechnet: Werte ändern, „Ausrechnen“ drücken.
          Die Felder kommen aus <code>lib/rechner/schemata/</code>, nicht aus dieser Seite.
        </p>
        <Insel typ="rechner" arg="brutto-netto"><RechnerEmbed slug="brutto-netto" /></Insel>

        <h3 style={{ marginTop: "var(--luft-xxl)" }}>Die Bausteine des Ergebnisses</h3>
        <p>
          Ein Rechner setzt sein Ergebnis aus benannten Blöcken zusammen (<code>ErgebnisBlock</code>
          {" "}in <code>lib/rechner/schema.ts</code>). Bis zum 16.09.2026 standen sie hier nicht
          einzeln — man sah sie nur, wenn man einen Rechner fand, der sie gerade benutzt.
          Hier ist jede Form einmal, mit erfundenen Zahlen.
        </p>
        <Ergebnisteile />
    </>) },

    { titel: "Vergleichsrechner", inhalt: (<>
        <p className="vorspann">Der eigene Vergleich aus der financeads-API, im Kursblatt-Satz: Zeitungskopf, „Ihre Angaben“ mit Lineal, Setzzeile und Register, der Marktüberblick in seiner jeweiligen Form (Zinskurve, Säulenfeld oder Punkte-Streuband), drei Kennzahlen, Podest und Angebotsliste mit Balken und Details. Klasse-B-Kategorien (Versicherungen, für die der Partner keine Beiträge liefert) zeigen stattdessen die Anbieterliste — ohne Band, ohne Kennzahlen, ohne Gewinner.</p>
        {/* 🚨 Vier, und zwar je EINER pro Marktüberblick — das ist der Zweck dieser
            Auswahl, nicht die Themenvielfalt:

              Festgeld    ZINSKURVE   (Laufzeit-Kategorie; die Spalte „Land" gibt es
                                       auch nur hier)
              Ratenkredit SÄULENBAND  (14 Angebote, also unter der Grenze von 16)
              Zahnzusatz  STREUBAND   (32 Tarife, also darüber)
              Haftpflicht KLASSE B    (keine Beiträge vom Partner: Anbieterliste ohne
                                       Band, ohne Kennzahlen, ohne Gewinner)

            🚨 Hier stand bis eben Tagesgeld statt Ratenkredit und Zahnzusatz, mit dem
            Kommentar „Tagesgeld zeigt das Streuband". Das stimmte am 16.09.2026 und war
            am 17.09. falsch: Tagesgeld hat seitdem `band: "kurve"` in der Registry und
            zeigt dieselbe Kurve wie Festgeld. Der Schaukasten führte damit zweimal die
            Kurve vor und Säulen wie Punkte überhaupt nicht — geprüft werden konnte also
            gerade das nicht, was die Regel `bandform()` entscheidet. */}
        <VergleichKoerper slug="festgeldvergleich" skin="faden" />
        <VergleichKoerper slug="ratenkredit-vergleich" skin="faden" />
        <VergleichKoerper slug="zahnzusatzversicherung-vergleich" skin="faden" />
        <VergleichKoerper slug="private-haftpflichtversicherung-vergleich" skin="faden" />
    </>) },
    { titel: "Spiele", inhalt: (<>
        <p className="vorspann">
          Die schlichte Fassung des Fadens: <strong>kein Kasten, kein Rahmen, kein Schatten</strong> —
          eine Kopfzeile mit Tintenlinie und der Inhalt darunter. Das alte Chassis mit Teal-Rahmen
          und 38 px Innenabstand (<code>GamificationEmbed</code>) lebt nur noch auf der alten
          Beitragsseite weiter; im Faden setzt <code>FadenSpiel</code>. Die Karteikarte
          gibt es nicht mehr; das Rubbellos schon.
        </p>
        <Insel typ="spiel" werte={{ typ: "quiz", felder: {
          frage: "Welcher Block ist im Beispiel der zweitgrößte am Strompreis?",
          a: "Steuern und Abgaben", b: "Netzentgelte", c: "Messstellenbetrieb", d: "Konzessionsabgabe",
          richtig: "B",
          erklaerung: "Die Netzentgelte machen im Beispiel 31 Prozent aus — nach Beschaffung und Vertrieb mit 44 Prozent der zweitgrößte Posten.",
        } }}>
          <FadenSpiel typ="quiz" felder={{
            frage: "Welcher Block ist im Beispiel der zweitgrößte am Strompreis?",
            a: "Steuern und Abgaben", b: "Netzentgelte", c: "Messstellenbetrieb", d: "Konzessionsabgabe",
            richtig: "B",
            erklaerung: "Die Netzentgelte machen im Beispiel 31 Prozent aus — nach Beschaffung und Vertrieb mit 44 Prozent der zweitgrößte Posten.",
          }} />
        </Insel>

        <Insel typ="spiel" werte={{ typ: "mythos", felder: {
          aussage: "Wer den Stromanbieter wechselt, sitzt beim Wechsel kurz im Dunkeln.",
          stimmt: "nein",
          aufloesung: "Die Versorgung läuft ununterbrochen weiter. Der Netzbetreiber bleibt derselbe, es wechselt nur, wer Ihnen die Kilowattstunde in Rechnung stellt.",
        } }}>
          <FadenSpiel typ="mythos" felder={{
            aussage: "Wer den Stromanbieter wechselt, sitzt beim Wechsel kurz im Dunkeln.",
            stimmt: "nein",
            aufloesung: "Die Versorgung läuft ununterbrochen weiter. Der Netzbetreiber bleibt derselbe, es wechselt nur, wer Ihnen die Kilowattstunde in Rechnung stellt.",
          }} />
        </Insel>

        <Insel typ="spiel" werte={{ typ: "schaetzen", felder: {
          frage: "Wie viele Kilowattstunden verbraucht ein Zwei-Personen-Haushalt im Jahr?",
          antwort: "2500", einheit: " kWh", min: "1000", max: "6000",
          aufloesung: "Rund 2.500 kWh sind der übliche Wert — mit elektrischer Warmwasserbereitung eher 3.500 kWh.",
        } }}>
          <FadenSpiel typ="schaetzen" felder={{
            frage: "Wie viele Kilowattstunden verbraucht ein Zwei-Personen-Haushalt im Jahr?",
            antwort: "2500", einheit: " kWh", min: "1000", max: "6000",
            aufloesung: "Rund 2.500 kWh sind der übliche Wert — mit elektrischer Warmwasserbereitung eher 3.500 kWh.",
          }} />
        </Insel>

        <h3 style={{ marginTop: "var(--luft-xl)" }}>Das Rubbellos</h3>
        <p>
          Die Fläche wird freigerubbelt — ziehen oder wischen. Sie heißt im Code{" "}
          <code>gewusst</code>; gestrichen ist die alte Karteikarte, nicht das Rubbellos.
        </p>
        <Insel typ="spiel" werte={{ typ: "gewusst", felder: {
          text: "Der Grundpreis fällt auch dann an, wenn Sie ein Jahr lang keine einzige Kilowattstunde verbrauchen. Bei einem Zweitwohnsitz ist er oft der größere Teil der Rechnung.",
        } }}>
          <FadenSpiel typ="gewusst" felder={{
            text: "Der Grundpreis fällt auch dann an, wenn Sie ein Jahr lang keine einzige Kilowattstunde verbrauchen. Bei einem Zweitwohnsitz ist er oft der größere Teil der Rechnung.",
          }} />
        </Insel>

        <h3 style={{ marginTop: "var(--luft-xl)" }}>Das Finanzwort</h3>
        <Insel typ="finanzwort" arg="schaukasten-finanzwort">
          <Finanzwort
            slug="schaukasten-finanzwort"
            wort="TARIF"
            begriff="tarif"
            begriffName="Tarif"
            hinweis1="Steht auf Ihrer Jahresrechnung ganz oben."
            hinweis2="Fünf Buchstaben, beginnt mit T."
            erklaerung="Der Tarif ist die Preisvereinbarung zwischen Ihnen und dem Versorger: Arbeitspreis je Kilowattstunde, Grundpreis im Monat, Laufzeit und Preisgarantie."
            nr={1}
            datum={null}
            punkte={10}
            wappen="wortmeister"
          />
        </Insel>

        <h3 style={{ marginTop: "var(--luft-xl)" }}>Die Schlange</h3>
        <p>
          Die Belohnung am Artikelende. 🚨 Ihre Form ist aus einer Bildvorlage gemessen und
          steht als Regelwerk in <code>lib/faden/schlange.ts</code> — das Feldmaß darf sich
          ändern, die Schlangenform nicht.
        </p>
        <div className="spiel-satz spiel-satz--schlange">
          <div className="spiel-satz__koerper">
            <Insel typ="schlange"><Schlange /></Insel>
          </div>
          <div className="spiel-satz__rand">
            <p className="spiel-satz__notiz">Steht am Ende eines Kapitels, wenn der Faden etwas zu feiern hat.</p>
          </div>
        </div>

        <h3 style={{ marginTop: "var(--luft-xl)" }}>Solitär</h3>
        <p>
          🚨 Das einzige Spiel OHNE Anzeige daneben: die Vorlage
          (<code>docs/design_handoff_finanzleser_solitaer</code>) bringt ihren eigenen
          zweispaltigen Satz mit — Brett links, Kennzahlen und Schale rechts. In einer
          halben Satzbreite fiele der auf eine Spalte zusammen. Die Murmel ist ein
          Glaskörper aus dem Tokenverzeichnis (<code>--glas-*</code>, <code>--katzenauge</code>),
          kein Bauteil-Verlauf; dieselben Token tragen Liegen, Zeigen, In-der-Hand und Flug.
        </p>
        <SolitaerKarte />
    </>) },

    { titel: "Listen, Karten und Mein Bereich", inhalt: (<>
        <ListenKarte kicker="Aus dem Bestand" gruppen={listen} />
        <div style={{ marginTop: 18 }}>
          <span className="kicker kicker--gruen">Mein Bereich</span>
          <MeinBereich regeln={WAECHTER} />
        </div>
    </>) },

    { titel: "Der Wächter und der Aktenkoffer", inhalt: (<>
        <p>
          Die zwei Bauteile von Finanzleser Plus, die auch ohne Konto arbeiten: beide
          merken sich ihren Stand in diesem Browser. Sie stehen hier als die echten
          Komponenten der Routen <a href="/plus/waechter">/plus/waechter</a> und{" "}
          <a href="/plus/aktenkoffer">/plus/aktenkoffer</a> — was hier zu sehen ist, ist
          das, was dort steht.
        </p>

        <div className="kasten kasten--lila" style={{ marginTop: "var(--luft-l)" }}>
          <span className="kicker kicker--tool kicker--gruen"><i className="dot dot--checkliste" />Der Wächter</span>
          <h3>Wecker auf Zahlen und Fristen</h3>
          <WaechterKarte regeln={WAECHTER} />
        </div>
        <p className="quelle">
          Jede Regel eine Zeile: Glocke · Titel mit Erläuterung · Termin · Kippschalter.
          Der Schalter ist ein Gerät, kein Kasten — er behält seine Kapselform, während
          im Satz sonst die Kante von 2 px gilt. Die drei Zeilen zeigen die drei
          Terminformen: freier Text, Stichtag und keine Angabe.
        </p>

        <div className="kasten kasten--lila" style={{ marginTop: "var(--luft-xl)" }}>
          <span className="kicker kicker--tool kicker--gruen"><i className="dot dot--checkliste" />Mein Aktenkoffer</span>
          <h3>Ergebnisse · Checklisten · Vergleiche · Gespräche</h3>
          <AktenkofferKarte />
        </div>
        <p className="quelle">
          Der Koffer zeigt, was in diesem Browser liegt. Ist nichts abgelegt, steht hier
          der leere Zustand mit seiner Erklärung — genau der ist der Regelfall beim ersten
          Besuch und deshalb der wichtigere der beiden.
        </p>
    </>) },

    { titel: "Anzeigenplätze", inhalt: (<>
        <p>
          Sechs Formate, adblocker-neutral benannt. Im Schaukasten sind Anzeigen sonst aus —
          sie laden nach und schieben den Satz; hier sind sie der Gegenstand und deshalb
          ausdrücklich eingeschaltet.
        </p>
        <div className="schau-anzeigen">
          <span className="kicker">Band · volle Satzbreite, 90 px</span>
          <Einschub format="band" />
          <span className="kicker">Rectangle · 300 × 250</span>
          <Einschub format="rectangle" />
          <span className="kicker">Halfpage · 300 × 600</span>
          <Einschub format="halfpage" />
          <span className="kicker">Skyscraper · 160 × 600</span>
          <Einschub format="skyscraper" />
          <span className="kicker">Square · 200 × 200</span>
          <Einschub format="square" />
          <span className="kicker">Mobile · 320 × 100</span>
          <Einschub format="mobile" />
        </div>
    </>) },

    { titel: "Der Kassensturz", inhalt: (<>
        <p className="vorspann">
          Der ganze Ablauf, nicht nur sein Anriss: <strong>Deckblatt mit Fahrplan</strong>,
          die Antwortkarten als Kassentasten, die <strong>Schätzfrage am Lineal</strong>,
          der Punkte-Flug, der <strong>Beleg</strong> in der rechten Spalte, Tacho, Ampel
          und der Stempel am Ende. Klicken Sie sich durch — der Stand liegt in diesem
          Browser, „Von vorn" setzt ihn zurück.
        </p>
        <p>
          🚨 Die Fragen sind die <strong>echten</strong> aus den Faden-Optionen, nicht
          erfundene. Fahrplan und Beleg zählen an den Segmenten des Katalogs entlang; mit
          Beispielfragen stünde hier eine Mechanik, die es so nicht gibt.
        </p>
        <p>
          🚨 Und eine bewusste Abweichung von der Übergabe: <strong>der Beleg zählt
          abwärts von 100.</strong> Die Vorlage gibt jeder Antwort feste Punkte (12/6/0);
          unser Katalog kommt aus dem CMS und kennt keine. Gezeigt wird deshalb, was jede
          Antwort an demselben Score bewegt, den auch der Tacho zeigt
          (<code>belegZeilen</code> in <code>components/faden/kassensturz/logik.ts</code>).
          Sobald das CMS Punkte je Antwort führt, zählt der Bon aufwärts — dafür ändert
          sich nur diese eine Funktion.
        </p>
        {kassensturz
          ? <Insel typ="kassensturz" werte={{ daten: kassensturz, ziele: ksZiele }}><KassensturzStart daten={kassensturz} ziele={ksZiele} /></Insel>
          : <p className="quelle">Kein Kassensturz in den Faden-Optionen — das CMS liefert gerade keinen Katalog.</p>}

        <h3 style={{ marginTop: "var(--luft-xl)" }}>Die Fortschrittsreihe</h3>
        <p className="quelle">Erledigt, laufend, offen — sie steht im Deckblatt und über den Fragen:</p>
        <Fortschrittsreihe nr={3} gesamt={5} />

        <h3 style={{ marginTop: "var(--luft-xl)" }}>Der Anriss im Fließtext</h3>
        <p className="quelle">Was an anderer Stelle im Faden auf den Kassensturz zeigt:</p>
        <KassensturzTeaser />
    </>) },

    { titel: "Die Blöcke der Startseite", inhalt: (<>
        <p>
          Dieselben Bausteine, die das Kapitel „Heute" tragen. Alle stehen auf dem Papier,
          alle tragen denselben Blockkopf und denselben Abstand.
        </p>
        <p className="quelle">FL Adresszeile — die Linie wächst in vier Stufen mit, der Knoten poppt bei einer vollständigen Adresse:</p>
        <div style={{ maxWidth: 430 }}>
          <Adresszeile label="Ihre E-Mail · donnerstags" knopf="Eintragen" hinweis="Abmelden mit einem Klick in jeder Ausgabe." hinweisFertig="Fast geschafft: bitte den Link in der Bestätigungsmail anklicken." />
        </div>
        <div className="kapitel__satz" style={{ marginTop: "var(--luft-xl)" }}>
          <AusDemNewsletter eintraege={auslese} />
          {/* Der Flug ZUM Newsletter, mit dem Eintragen darin (Übergabe Baustein 4).
              🚨 In einer Insel, sonst steht im eingefrorenen Kapitel ein Foto statt der
              Animation — dieselbe Falle wie bei den Spielen. */}
          <Insel typ="flugfenster"><Flugfenster /></Insel>
          <PlusTeaser />
          <WeiterredenChips />
        </div>

        <h3 style={{ marginTop: "var(--luft-xl)" }}>Die Vergleichs-Teaser · alle drei Bandformen</h3>
        <p>
          Echte Zahlen aus dem Vergleichs-Schnappschuss, nicht erfunden — nur so lässt
          sich prüfen, was hier zu prüfen ist: <strong>die Form entscheidet die Menge.</strong>{" "}
          Wo eine Kategorie eine Laufzeit hat, zeigt der Teaser die <em>Zinskurve</em>
          (Festgeld, sieben Anlagedauern). Bis 16 Angebote steht das <em>Säulenband</em>,
          darüber das <em>Streuband</em> aus Punkten — dieselbe Grenze wie im Kursblatt,
          entschieden von derselben Funktion (<code>bandform</code>). Zahnzusatz mit
          32 Tarifen fällt darüber, Ratenkredit mit 14 und Tierkranken mit 12 nicht.
        </p>
        <div className="wort wort--leo">
          <VergleichsTeaser teaser={teaser} />
        </div>
    </>) },

    { titel: "Inventur: was es wirklich gibt", inhalt: (<>
        <p>
          Schriftgrade, Abstände, Radien, Schatten und Farben, gezählt über die fünfzehn
          Stylesheets des Fadens und des Kursblatts. Kein gepflegtes Verzeichnis — die Zahlen
          kommen beim Bauen aus denselben Dateien, die die Seite lädt. Dieselbe Rechnung als
          Befehl: <code>npm run wache:bericht</code>; <code>npm run wache</code> schlägt an,
          sobald ein Wert dazukommt.
        </p>
        <p>
          <strong>Was hier stehen bleiben DARF.</strong> Nicht jede Zahl gehört auf eine Leiter.
          Die Abstandsleiter regelt den <em>Satz</em> — was zwischen und in Textblöcken steht.
          Die <em>Chrome</em> des Fadens (Kopf, Navigation, Megamenü-Blatt, Randspalten,
          Eingabepille, klebende Leisten) ist Layout und trägt eigene Maße: dort stehen 155 der
          verbliebenen Abstände, und zwar mit Absicht. Am 16.09.2026 waren sie kurzzeitig auf
          der Leiter — danach saß die Eingabepille schief, und die Navigation lief ineinander.
          Ebenso bleiben: das Schwarz in Maskenverläufen (eine Maske braucht Deckung, keine
          Farbe), die sechs Autoren-Verläufe (Personenbilder), die Zustandsringe
          (<code>0 0 0 Npx</code> ist keine Höhe) und die vier Verläufe der Siegelfolie.
        </p>

        <h3>Schriftgrade · {grade.length} verschiedene</h3>
        <ul className="inv inv__grade">
          {grade.map((g) => (
            <li key={g.wert} data-token={g.wert.startsWith("var(") || undefined}>
              <b>{g.stellen.length}×</b>
              <code>{g.wert}</code>
              <span className="inv__probe" style={{ fontSize: g.wert.startsWith("var(") ? undefined : g.wert, font: g.wert.startsWith("var(") ? g.wert : undefined }}>
                Finanzleser · 0123
              </span>
              <span className="inv__wo">{g.stellen.slice(0, 4).map((x) => x.sel.replace(".faden-shell ", "")).join(" · ")}{g.stellen.length > 4 ? ` · +${g.stellen.length - 4}` : ""}</span>
            </li>
          ))}
        </ul>

        <h3 style={{ marginTop: "var(--luft-xl)" }}>Abstände außerhalb der Leiter · {luft.length} verschiedene</h3>
        <p className="quelle">
          Was in <code>calc</code>, <code>clamp</code>, <code>min</code> oder <code>max</code> steht,
          ist ein Layoutmaß und zählt nicht mit — die Leiter regelt den Satz.
        </p>
        <ul className="inv inv__grade">
          {luft.map((f) => (
            <li key={f.wert}>
              <b>{f.stellen.length}×</b>
              <code>{f.wert}</code>
              <span className="inv__probe"><i style={{ display: "inline-block", height: 12, width: f.wert, background: "var(--green)" }} /></span>
              <span className="inv__wo">{f.stellen.slice(0, 4).map((x) => x.sel.replace(".faden-shell ", "")).join(" · ")}{f.stellen.length > 4 ? ` · +${f.stellen.length - 4}` : ""}</span>
            </li>
          ))}
        </ul>

        <h3 style={{ marginTop: "var(--luft-xl)" }}>Radien und Schatten ohne Token · {ecken.length + huelle.length} verschiedene</h3>
        <p className="quelle">
          Zustandsringe (<code>0 0 0 Npx</code>) zählen mit: sie sind keine Höhe, sondern ein Zustand,
          und stehen deshalb bewusst neben den drei Schattenstufen.
        </p>
        <ul className="inv inv__grade">
          {[...ecken, ...huelle].map((f) => (
            <li key={f.wert}>
              <b>{f.stellen.length}×</b>
              <code>{f.wert}</code>
              <span className="inv__probe" />
              <span className="inv__wo">{f.stellen.slice(0, 4).map((x) => x.sel.replace(".faden-shell ", "")).join(" · ")}{f.stellen.length > 4 ? ` · +${f.stellen.length - 4}` : ""}</span>
            </li>
          ))}
        </ul>

        <h3 style={{ marginTop: "var(--luft-xl)" }}>Farben ohne Token · {farben.length} verschiedene</h3>
        <p className="quelle">
          Die Tokendefinition selbst ist herausgerechnet. Was hier steht, steht als nackter Wert
          in einer Regel.
        </p>
        <ul className="inv inv__farben">
          {farben.map((f) => (
            <li key={f.wert}>
              <b>{f.stellen.length}×</b>
              <i style={{ background: f.wert }} />
              <code>{f.wert}</code>
              <span className="inv__wo">{f.stellen.slice(0, 4).map((x) => x.sel.replace(".faden-shell ", "")).join(" · ")}{f.stellen.length > 4 ? ` · +${f.stellen.length - 4}` : ""}</span>
            </li>
          ))}
        </ul>
    </>) },

    { titel: "Der Vorlage-Beitrag", inhalt: (<>
        <p>
          Der zweite Teil des Schaukastens ist eine <strong>echte Kopie</strong> aus dem CMS:
          „Vorlage-Test · Photovoltaik Förderung“ mit sieben Abschnitten, Tabelle, Statistiken,
          Werkzeugen, Leo-Fragen, Leo-Einwürfen, häufigen Fragen und Fazit — dieselben Felder,
          dieselbe Verarbeitung wie bei jedem Beitrag.
        </p>
        <p>
          Sie lässt sich im CMS umstellen und durchprobieren, ohne einen redaktionellen Beitrag
          anzufassen. Neu anlegen oder zurücksetzen: <code>node tools/vorlage-test.mjs</code>.
        </p>
        <p className="reihe">
          <a className="knopf knopf--primaer" href="/schaukasten/ratgeber">Vorlage-Beitrag als Kapitel anhängen ↓</a>
        </p>
    </>) },
  ];

  return (
    <KartenKapitel
      schluessel="schaukasten"
      titel="Schaukasten"
      kicker="Abnahme · Alle Bausteine"
      beschreibung="Jedes Element des Fadens einmal, in Ruhe nebeneinander. Diese Seite gehört nicht zum Magazin — sie existiert nur, solange der Schaukasten eingeschaltet ist."
      krumen={[{ name: "Abnahme", href: "/schaukasten" }]}
      url="/schaukasten"
    >
      <SchaukastenModus />
      {ABSCHNITTE.map((a, i) => (
        <Abschnitt key={a.titel} titel={a.titel} nr={i + 1} von={ABSCHNITTE.length}>
          {a.inhalt}
        </Abschnitt>
      ))}

    </KartenKapitel>
  );
}
