"use client";

/**
 * Die Bausteine, aus denen ein Rechner-Ergebnis besteht — nebeneinander, mit erfundenen
 * Zahlen, nur zum Anschauen (app/schaukasten).
 *
 * 🚨 Warum es diese Datei gibt: der Schaukasten zeigte bis zum 16.09.2026 vom Rechner nur
 * die EINGABEN (Setzkasten) und einen ganzen Rechner. Die sieben Darstellungsformen des
 * ERGEBNISSES — Ring, Säulen, Messlatte, Anteilsband, Verlaufskurve, Kennzahlentabelle,
 * Jahresübersicht — kamen darin nicht einzeln vor. Wer eine davon ändert, sah nicht, was
 * er anfasst.
 *
 * 🚨 Und sie sind die ECHTEN Bauteile, nicht Nachbauten: was hier steht, ist dasselbe,
 * was `components/kursblatt/rechner/Ergebnis.tsx` aus einem `ErgebnisBlock` macht.
 * Ändert sich dort etwas, ändert sich diese Tafel mit.
 */
import Zeiger from "@/components/kursblatt/teile/Zeiger";
import Messlatte from "@/components/kursblatt/teile/Messlatte";
import Anteilsband from "@/components/kursblatt/teile/Anteilsband";
import Verlaufskurve from "@/components/kursblatt/teile/Verlaufskurve";
import Kennzahlen from "@/components/kursblatt/teile/Kennzahlen";
import { fmtEuro } from "@/lib/kursblatt/zahl";

/** Eine Restschuld über fünf Jahre, wie sie der Kreditrechner zeichnet. */
const RESTSCHULD = Array.from({ length: 61 }, (_, i) => Math.round(21500 * (1 - i / 60)));

function Teil({ name, erklaerung, children }: { name: string; erklaerung: string; children: React.ReactNode }) {
  return (
    <section className="schau-teil">
      <div className="satzkopf satzkopf--abschluss">
        <span className="kicker">{name}</span>
      </div>
      <p className="quelle">{erklaerung}</p>
      <div className="kb kb--rechner">{children}</div>
    </section>
  );
}

export default function Ergebnisteile() {
  return (
    <div className="schau-teile">
      <Teil
        name="Ring · art: zeiger"
        erklaerung="Eine Quote als Kreis: Spur in Grau, Bogen in der Werkzeugfarbe, in der Mitte die Zahl und ihr Name. Ersetzt die alte Tachonadel in dreizehn Rechnern."
      >
        <Zeiger label="Zinsanteil" wert={13} max={100} einheit=" %" zeichnen="fl-zeichnen" aktiv />
      </Teil>

      <Teil
        name="Messlatte · art: messlatte"
        erklaerung="Der eigene Wert neben dem Durchschnitt — zwei Balken, gleiche Skala. In fünf Rechnern der Ersatz für den alten Benchmark-Block."
      >
        <Messlatte
          titel="Ihre Rate im Marktvergleich"
          wert={411} wertLabel="Ihre Rate"
          weitere={[{ label: "Bestes Angebot im Autokredit-Vergleich", wert: 365, ton: "tuerkis" }]}
          schnitt={385} schnittLabel="Ø der 12 Angebote"
          einheit=" €"
        />
      </Teil>

      <Teil
        name="Anteilsband · art: anteilsband"
        erklaerung="Wie sich eine Summe aufteilt: ein Band, zwei bis vier Stücke, Beschriftung darunter. Tinte für den größeren Teil, Werkzeugfarbe für den, um den es geht."
      >
        <Anteilsband
          titel="So verteilt sich Ihre Zahlung"
          teile={[{ label: "Tilgung", anteil: 0.87, ton: "ink" }, { label: "Zinsen", anteil: 0.13, ton: "magenta" }]}
        />
      </Teil>

      <Teil
        name="Verlaufskurve · art: kurve"
        erklaerung="Ein Wert über die Laufzeit, mit Fläche darunter und einer Fahne, die beim Überfahren mitläuft. Die Linie zeichnet sich bei jedem neuen Ergebnis neu."
      >
        <Verlaufskurve
          titel="Restschuld über die Laufzeit"
          werte={RESTSCHULD}
          takt={12}
          xText={(i) => (i === 12 ? "1 Jahr" : `${i / 12} J.`)}
          yText={(v) => fmtEuro(v)}
          scrubText={(i, v) => `Monat ${i} · ${fmtEuro(v)}`}
        />
      </Teil>

      <Teil
        name="Kennzahlen · dreispaltige Zeitungstabelle"
        erklaerung="Drei gleich große Zahlen, getrennt durch Haarlinien, Doppellinie darüber. Der Unterschied steckt in der Farbe, nicht in der Größe — genau das war Runde 2, Punkt 4."
      >
        <Kennzahlen
          werte={[
            { key: "beste", label: "Beste Rate", unter: "im Monat, Santander", art: "geld", ton: "werkzeug", wert: 187 },
            { key: "schnitt", label: "Ø Rate", unter: "im Monat, alle 4 Angebote", art: "geld", ton: "grau", wert: 196 },
            { key: "spar", label: "Ihre Ersparnis", unter: "Bestwert statt Ø über 120 Monate", art: "geld", ton: "gruen", wert: 1102 },
          ]}
        />
      </Teil>
    </div>
  );
}
