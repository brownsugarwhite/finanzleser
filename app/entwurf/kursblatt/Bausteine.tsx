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

export default function Bausteine() {
  const [summe, setSumme] = useState(20000);
  const [monate, setMonate] = useState(60);
  const [rsumme, setRsumme] = useState(20000);

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
    </>
  );
}
