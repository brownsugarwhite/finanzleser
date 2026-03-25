"use client";

import { useState, useEffect } from "react";
import { useRates } from "@/lib/hooks/useRates";
import {
  berechne,
  type AltersteilzeitParams,
  type AltersteilzeitResult
} from "@/lib/calculators/altersteilzeit";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerSelect from "./ui/RechnerSelect";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";

export default function AltersteilzeitRechner() {
  const [params, setParams] = useState<AltersteilzeitParams>({
    vollzeit_brutto: 4000,
    aufstockung_prozent: 80,
    modus: "block"
  });

  const [result, setResult] = useState<AltersteilzeitResult | null>(null);
  const rates = useRates();

  useEffect(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  const handleParamChange = (
    key: keyof AltersteilzeitParams,
    value: string | number
  ) => {
    setParams((prev) => ({
      ...prev,
      [key]: key === "modus" ? value : Number(value)
    }));
  };

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Altersteilzeit-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Monatlicher Vollzeit-Bruttolohn"
          name="vollzeit_brutto"
          value={params.vollzeit_brutto}
          onChange={(val) => handleParamChange("vollzeit_brutto", val)}
          einheit="€"
          min={0}
        />

        <RechnerInput
          label="Aufstockung auf % des Vollzeit-Nettos"
          name="aufstockung_prozent"
          value={params.aufstockung_prozent}
          onChange={(val) => handleParamChange("aufstockung_prozent", val)}
          einheit="%"
          min={0}
          max={100}
          
        />

        <RechnerSelect
          label="Zeitmodell"
          name="modus"
          value={params.modus}
          onChange={(val) => handleParamChange("modus", val)}
          options={[
            { value: "block", label: "Blockmodell (Arbeiten dann Freistellung)" },
            { value: "gleichmaessig", label: "Gleichmäßige Verteilung" }
          ]}
        />
      </div>

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Netto mit Aufstockung"
              value={euro(result.gesamt_netto)}
              highlight={true}
            />
            <RechnerResultBox
              label="Netto-Verlust vs. Vollzeit"
              value={`−${euro(result.netto_verlust)}`}
              highlight={false}
            />
          </div>

          <h4 className="rechner-result-section-title">Gehaltsberechnung</h4>
          <RechnerResultTable
            rows={[
              {
                label: "Vollzeit-Brutto",
                value: euro(result.vollzeit_brutto)
              },
              {
                label: "Altersteilzeit-Brutto (50 %)",
                value: euro(result.atz_brutto)
              },
              {
                label: "ATZ-Netto (ohne Aufstockung)",
                value: euro(result.atz_netto_basis)
              },
              {
                label: `Aufstockung AG (auf ${result.aufstockung_prozent} %)`,
                value: `+${euro(result.aufstockungsbetrag)}`
              }
            ]}
            footer={{
              label: "Gesamt-Netto",
              value: euro(result.gesamt_netto)
            }}
          />

          <h4 className="rechner-result-section-title">Vergleich Vollzeit</h4>
          <RechnerResultTable
            rows={[
              {
                label: "Vollzeit-Netto",
                value: euro(result.vollzeit_netto)
              },
              {
                label: "ATZ-Netto (mit Aufstockung)",
                value: euro(result.gesamt_netto)
              },
              {
                label: "Monatlicher Netto-Verlust",
                value: `−${euro(result.netto_verlust)}`
              }
            ]}
          />

          <RechnerHinweis>
            Die Aufstockungshöhe richtet sich nach Tarif- oder Betriebsvereinbarung
            (keine gesetzliche Mindestaufstockung mehr seit 2010). RV-Aufstockung:
            Der Arbeitgeber zahlt zusätzlich die volle RV auf dem fiktiven Vollzeitgehalt.
            Grundlage: § 2 AltTZG.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
