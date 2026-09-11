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
import LeoFragt from "@/components/faden/leo/LeoFragt";
import GamificationEmbed from "@/components/gamification/GamificationEmbed";
import Finanzwort from "@/components/faden/spiele/Finanzwort";
import SchaukastenModus from "@/components/faden/SchaukastenModus";
import { getWerkzeugIndex } from "@/lib/faden/werkzeugIndex";
import Zeitungskopf from "@/components/faden/Zeitungskopf";

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
  const WAECHTER = [
    { key: "strompreis", titel: "Strompreis-Wächter", regel: "Meldet, wenn Ihr Versorger eine Preiserhöhung ankündigt." },
    { key: "kuendigungsfrist", titel: "Kündigungsfrist", regel: "Erinnert sechs Wochen vor Ablauf Ihres Vertrags." },
    { key: "grundfreibetrag", titel: "Grundfreibetrag", regel: "Meldet sich, wenn sich der steuerliche Grundfreibetrag ändert." },
  ];
  const VON = 11;

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
      <Abschnitt titel="Schrift und Zeitungssatz" nr={1} von={VON}>
        <span className="kicker">Kicker · grau</span>
        <span className="kicker kicker--gruen">Kicker · grün</span>
        <span className="kicker kicker--pink">Kicker · magenta</span>
        <h3>Zwischentitel (h3)</h3>
        <p className="vorspann">Vorspann: kursiv, gesetzt in Merriweather, für den Einstieg in einen Beitrag.</p>
        <div className="prose zeitung zeitung--initiale">
          <p>Fließtext im Zeitungssatz mit Initiale. Zwei Spalten ab 1060 px, Spaltenlinie dazwischen, Absätze dürfen über den Knick laufen — so setzt es die Zeitung. Dieser Absatz ist lang genug, damit der Umbruch wirklich zu sehen ist und nicht nur behauptet wird.</p>
          <p>Ein zweiter Absatz mit einem <a href="/schaukasten">Link im Fließtext</a> und einem <strong>fett gesetzten</strong> sowie einem <em>kursiven</em> Stück.</p>
        </div>
        <blockquote><p>Ein Zitat. Es steht kursiv, eingerückt, und trennt den Gedanken vom Rest.</p></blockquote>
        <p className="quelle">Quelle: Schaukasten – Beispieldaten</p>
      </Abschnitt>

      <Abschnitt titel="Linien und Flächen" nr={2} von={VON}>
        <p>Doppellinie (2 px Tinte · 2 px Luft · 1 px Tinte):</p>
        <i className="doppellinie" />
        <p style={{ marginTop: 18 }}>Der Zeitungskopf, wie er den Faden anführt:</p>
        <Zeitungskopf />
        <div className="kasten kasten--still" style={{ padding: "14px 18px" }}>
          <span className="kicker">Kasten · still</span>
          <p style={{ margin: "6px 0 0" }}>Ein Kasten für Abgesetztes.</p>
        </div>
        <p className="hinweis" style={{ marginTop: 14 }}>Hinweiszeile: gelber Grund, für Warnungen und Nachträge.</p>
      </Abschnitt>

      <Abschnitt titel="Knöpfe, Chips und Links" nr={3} von={VON}>
        <div className="reihe">
          <button type="button" className="btn">Knopf · Standard</button>
          <button type="button" className="btn btn--primary">Knopf · primär</button>
          <button type="button" className="btn btn--klein">Knopf · klein</button>
          <button type="button" className="btn btn--klein btn--still">Knopf · still</button>
        </div>
        <div className="chips" style={{ marginTop: 14 }}>
          <button type="button" className="chip">Chip · Standard</button>
          <button type="button" className="chip chip--still">Chip · still</button>
          <button type="button" className="chip chip--leo">Chip · Leo</button>
          <button type="button" className="chip chip--aktiv">Chip · aktiv</button>
          <button type="button" className="chip"><i className="dot dot--rechner" /> mit Punkt · Rechner</button>
          <button type="button" className="chip"><i className="dot dot--vergleich" /> mit Punkt · Vergleich</button>
          <button type="button" className="chip"><i className="dot dot--checkliste" /> mit Punkt · Checkliste</button>
        </div>
        <div className="reihe" style={{ marginTop: 14 }}>
          <button type="button" className="textlink">Textlink</button>
          <button type="button" className="textlink textlink--still">Textlink · still</button>
          <a className="pfeil-link" href="/schaukasten">Pfeil-Link <i /></a>
        </div>
      </Abschnitt>

      <Abschnitt titel="Leo und die Frage des Lesers" nr={4} von={VON}>
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
      </Abschnitt>

      <Abschnitt titel="Ein Gespräch mit Leo" nr={5} von={VON}>
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
      </Abschnitt>

      <Abschnitt titel="Leos Zwischenfrage" nr={6} von={VON}>
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
      </Abschnitt>

      <Abschnitt titel="Statistiken" nr={7} von={VON}>
        <p>Alle drei Arten, wie sie auch im Ratgeber stehen — Säulen mit Umschalter, Torte mit Legende, Balken.</p>
        {STATISTIKEN.map((st, i) => (
          <Insel key={i} typ="statistik" werte={st}><StatistikKarte st={st} /></Insel>
        ))}
      </Abschnitt>

      <Abschnitt titel="Werkzeuge" nr={8} von={VON}>
        <p>Rechner, Checkliste und Dokumente als Karten — mit echten Daten aus dem Bestand. Vergleiche fehlen hier bewusst.</p>
        {embeds.map((teil, i) => <WerkzeugKarte key={i} teil={teil} toolData={toolData} imInhalt />)}
      </Abschnitt>

      <Abschnitt titel="Spiele" nr={9} von={VON}>
        <p>Jede Spielform mit echtem Inhalt, damit sich auch die Auflösung anschauen lässt.</p>
        <div className="spiel-inline"><GamificationEmbed gamType="quiz" fields={{
          frage: "Welcher Block ist im Beispiel der zweitgrößte am Strompreis?",
          a: "Steuern und Abgaben", b: "Netzentgelte", c: "Messstellenbetrieb", d: "Konzessionsabgabe",
          richtig: "B",
          erklaerung: "Die Netzentgelte machen im Beispiel 31 Prozent aus — nach Beschaffung und Vertrieb mit 44 Prozent der zweitgrößte Posten.",
        }} /></div>
        <div className="spiel-inline"><GamificationEmbed gamType="mythos" fields={{
          aussage: "Wer den Stromanbieter wechselt, sitzt beim Wechsel kurz im Dunkeln.",
          stimmt: "nein",
          aufloesung: "Die Versorgung läuft ununterbrochen weiter. Der Netzbetreiber bleibt derselbe, es wechselt nur, wer Ihnen die Kilowattstunde in Rechnung stellt.",
        }} /></div>
        <div className="spiel-inline"><GamificationEmbed gamType="schaetzen" fields={{
          frage: "Wie viele Kilowattstunden verbraucht ein Zwei-Personen-Haushalt im Jahr?",
          antwort: "2500", einheit: " kWh", min: "1000", max: "6000",
          aufloesung: "Rund 2.500 kWh sind der übliche Wert — mit elektrischer Warmwasserbereitung eher 3.500 kWh.",
        }} /></div>
        <div className="spiel-inline"><GamificationEmbed gamType="gewusst" fields={{
          text: "Der Grundpreis fällt auch dann an, wenn Sie ein Jahr lang keine einzige Kilowattstunde verbrauchen. Bei einem Zweitwohnsitz ist er oft der größere Teil der Rechnung.",
        }} /></div>
        <div className="spiel-inline"><GamificationEmbed gamType="test" fields={{
          frage: "Was steht auf Ihrer Jahresrechnung ganz oben?",
          antwort: "Der Tarifname. Enthält er „Grundversorgung“, zahlen Sie fast immer zu viel.",
        }} /></div>
        <div style={{ marginTop: 18 }}>
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
        </div>
      </Abschnitt>

      <Abschnitt titel="Listen, Karten und Mein Bereich" nr={10} von={VON}>
        <ListenKarte kicker="Aus dem Bestand" gruppen={listen} />
        <div style={{ marginTop: 18 }}><KassensturzTeaser /></div>
        <div style={{ marginTop: 18 }}>
          <span className="kicker kicker--gruen">Mein Bereich</span>
          <MeinBereich regeln={WAECHTER} />
        </div>
      </Abschnitt>

      <Abschnitt titel="Der Vorlage-Beitrag" nr={11} von={VON}>
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
          <a className="btn btn--primary" href="/schaukasten/ratgeber">Vorlage-Beitrag als Kapitel anhängen ↓</a>
        </p>
      </Abschnitt>

    </KartenKapitel>
  );
}
