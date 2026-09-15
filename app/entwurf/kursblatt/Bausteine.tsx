"use client";

/**
 * Die Bausteine des Setzkastens mit eigenem Zustand — der Teil der Entwurfsroute, der
 * bedient werden will. Die Seite selbst bleibt eine Serverkomponente.
 *
 * Die Maße der drei Lineale stammen 1:1 aus „Finanzleser Vergleich & Rechner -
 * Kursblatt.dc.html“:379-383 (Konstante `L`).
 */
import { useState } from "react";
import Lineal from "@/components/kursblatt/eingabe/Lineal";
import Setzzeile from "@/components/kursblatt/eingabe/Setzzeile";
import Register from "@/components/kursblatt/eingabe/Register";

/** Steuerklassen mit Beizeile — „Finanzleser Festgeld & Eingaben - Kursblatt.dc.html“:218. */
const STEUERKLASSEN = [
  { wert: 1, label: "Klasse I", meta: "ledig, geschieden" },
  { wert: 2, label: "Klasse II", meta: "alleinerziehend" },
  { wert: 3, label: "Klasse III", meta: "verheiratet, höheres Einkommen" },
  { wert: 4, label: "Klasse IV", meta: "verheiratet, ähnlich verdienend" },
  { wert: 5, label: "Klasse V", meta: "verheiratet, geringeres Einkommen" },
  { wert: 6, label: "Klasse VI", meta: "Zweitjob" },
];

/** F:217 + :271 — Kirchensteuersatz als lebende Beizeile. */
const LAENDER = [
  "Baden-Württemberg", "Bayern", "Berlin", "Brandenburg", "Bremen", "Hamburg", "Hessen",
  "Mecklenburg-Vorpommern", "Niedersachsen", "Nordrhein-Westfalen", "Rheinland-Pfalz",
  "Saarland", "Sachsen", "Sachsen-Anhalt", "Schleswig-Holstein", "Thüringen",
].map((l) => ({ wert: l, label: l, meta: ["Bayern", "Baden-Württemberg"].includes(l) ? "KiSt 8 %" : "KiSt 9 %" }));

export default function Bausteine() {
  const [summe, setSumme] = useState(20000);
  const [monate, setMonate] = useState(60);
  const [rsumme, setRsumme] = useState(20000);
  const [brutto, setBrutto] = useState<number | null>(3800);
  const [stkl, setStkl] = useState(1);
  const [land, setLand] = useState("Nordrhein-Westfalen");
  const [kinder, setKinder] = useState<number | null>(0);
  const [betrag, setBetrag] = useState<number | null>(20000);
  const [dauer, setDauer] = useState(36);

  return (
    <>
      <div style={{ marginTop: 22 }}>
        <div className="kb__feldkopf">
          <b>Kreditsumme</b>
          <span>1.000 – 100.000 €</span>
        </div>
        <Lineal
          ariaLabel="Kreditsumme"
          wert={summe} onWert={setSumme}
          min={1000} max={100000} schritt={500} px={9} major={20} mittel={10}
          einheit="€" werkzeug="tuerkis"
          marken={[
            { wert: 5000, label: "5.000" },
            { wert: 10000, label: "10.000" },
            { wert: 20000, label: "20.000" },
            { wert: 50000, label: "50.000" },
          ]}
        />
      </div>

      <div style={{ marginTop: 18 }}>
        <div className="kb__feldkopf">
          <b>Laufzeit</b>
          <span>12 – 120 Monate</span>
        </div>
        <Lineal
          ariaLabel="Laufzeit"
          wert={monate} onWert={setMonate}
          min={12} max={120} schritt={6} px={30} major={2} mittel={1}
          einheit="Monate" werkzeug="tuerkis" hinweis={false}
          marken={[
            { wert: 36, label: "3 Jahre" },
            { wert: 60, label: "5 Jahre" },
            { wert: 84, label: "7 Jahre" },
          ]}
        />
      </div>

      <div style={{ marginTop: 18 }}>
        <div className="kb__feldkopf">
          <b>Kreditsumme im Rechner</b>
          <span>500 – 200.000 €</span>
        </div>
        <Lineal
          ariaLabel="Kreditsumme im Rechner"
          wert={rsumme} onWert={setRsumme}
          min={500} max={200000} schritt={500} px={7} major={20} mittel={10}
          einheit="€" werkzeug="magenta"
          marken={[
            { wert: 10000, label: "10.000" },
            { wert: 20000, label: "20.000" },
            { wert: 50000, label: "50.000" },
            { wert: 100000, label: "100.000" },
          ]}
        />
      </div>

      <div style={{ marginTop: 40 }}>
        <span className="kb__kicker kb__kicker--werkzeug">
          <i aria-hidden="true" />
          Setzzeile &amp; Register · Rechner
        </span>
        <div className="kb__zweispalt" style={{ marginTop: 20 }}>
          <Setzzeile
            label="Bruttogehalt im Monat" wert={brutto} onWert={setBrutto} einheit="€"
            min={500} max={50000} schritt={100} werkzeug="magenta"
            platzhalter="z. B. 3.800" vorschlaege={[2500, 3800, 5200]}
            hinweis="Versuchen Sie 999999 – die Zeile meldet sich"
          />
          <Register label="Steuerklasse" wert={stkl} onWert={setStkl} optionen={STEUERKLASSEN} werkzeug="magenta" />
          <Register label="Bundesland" wert={land} onWert={setLand} optionen={LAENDER} werkzeug="magenta" maxHoehe="300px" />
          <Setzzeile
            label="Kinderfreibeträge" wert={kinder} onWert={setKinder}
            min={0} max={10} schritt={0.5} dez={1} werkzeug="magenta"
            stepper vorschlaege={[0, 1, 2]} vorschlaegeImmer
            hinweis="halbe Freibeträge sind möglich"
          />
        </div>
        <p className="kb__vorspann" style={{ marginTop: 26, fontSize: 15.5 }}>
          <i style={{ fontStyle: "italic", color: "var(--kb-grau)" }}>Leo liest mit: </i>
          {(brutto ?? 0).toLocaleString("de-DE")} € brutto,{" "}
          {STEUERKLASSEN.find((s) => s.wert === stkl)?.label} in {land},{" "}
          {kinder ? `${kinder.toLocaleString("de-DE")} Kinderfreibetrag` : "ohne Kinderfreibetrag"}.
        </p>
      </div>

      <div style={{ marginTop: 40 }}>
        <span className="kb__kicker kb__kicker--werkzeug" style={{ "--kb-werkzeug": "var(--kb-tuerkis)" } as React.CSSProperties}>
          <i aria-hidden="true" />
          Dieselben Bausteine im Vergleich
        </span>
        <div className="kb__zweispalt" style={{ marginTop: 20 }}>
          <Setzzeile
            label="Anlagebetrag" wert={betrag} onWert={setBetrag} einheit="€"
            min={500} max={500000} schritt={500} werkzeug="tuerkis"
            platzhalter="z. B. 20.000" vorschlaege={[5000, 10000, 20000, 50000]}
            hinweis="Pfeiltasten oder ‹ › ändern in 500-€-Schritten"
          />
          <Register
            label="Anlagedauer" wert={dauer} onWert={setDauer} werkzeug="tuerkis"
            optionen={[
              { wert: 3, label: "3 Monate", meta: "bis 2,70 %" },
              { wert: 6, label: "6 Monate", meta: "bis 3,00 %" },
              { wert: 12, label: "1 Jahr", meta: "bis 3,30 %" },
              { wert: 24, label: "2 Jahre", meta: "bis 3,45 %" },
              { wert: 36, label: "3 Jahre", meta: "bis 3,55 %" },
              { wert: 48, label: "4 Jahre", meta: "bis 3,50 %" },
              { wert: 60, label: "5 Jahre", meta: "bis 3,45 %" },
            ]}
          />
        </div>
      </div>
    </>
  );
}
