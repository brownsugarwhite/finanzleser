"use client";

import { useState, useEffect } from "react";
import { useRates } from "@/lib/hooks/useRates";
import {
  berechne,
  type AnnuitaetParams,
  type AnnuitaetResult
} from "@/lib/calculators/annuitaet";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";

export default function AnnuitaetRechner() {
  const [params, setParams] = useState<AnnuitaetParams>({
    darlehensbetrag: 200000,
    zinssatz_jahr: 3.5,
    laufzeit_jahre: 20
  });

  const [result, setResult] = useState<AnnuitaetResult | null>(null);
  const rates = useRates();

  useEffect(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  const handleParamChange = (
    key: keyof AnnuitaetParams,
    value: number
  ) => {
    setParams((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Annuitätenrechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Darlehensbetrag"
          name="darlehensbetrag"
          value={params.darlehensbetrag}
          onChange={(val) => handleParamChange("darlehensbetrag", val)}
          einheit="€"
          min={1000}
          step={1000}
        />

        <RechnerInput
          label="Jahreszinssatz"
          name="zinssatz_jahr"
          value={params.zinssatz_jahr}
          onChange={(val) => handleParamChange("zinssatz_jahr", val)}
          einheit="%"
          min={0}
          step={0.1}
        />

        <RechnerInput
          label="Laufzeit"
          name="laufzeit_jahre"
          value={params.laufzeit_jahre}
          onChange={(val) => handleParamChange("laufzeit_jahre", val)}
          einheit="Jahre"
          min={1}
          max={40}
          step={1}
        />
      </div>

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Monatliche Rate"
              value={euro(result.annuitaet_monatlich)}
              highlight={true}
            />
            <RechnerResultBox
              label="Gesamtzinsen"
              value={euro(result.gesamtzinsen)}
              highlight={false}
            />
          </div>

          <h4 className="rechner-result-section-title">Zusammenfassung</h4>
          <RechnerResultTable
            rows={[
              { label: "Darlehensbetrag", value: euro(result.darlehensbetrag) },
              {
                label: "Jahreszinssatz",
                value: `${result.zinssatz_jahr} %`
              },
              { label: "Laufzeit", value: `${result.laufzeit_jahre} Jahre` },
              {
                label: "Monatliche Rate (Annuität)",
                value: euro(result.annuitaet_monatlich)
              },
              {
                label: "Gesamtbetrag (zahlen)",
                value: euro(result.gesamtbetrag)
              },
              {
                label: "Gesamtzinsen",
                value: euro(result.gesamtzinsen)
              }
            ]}
          />

          <h4 className="rechner-result-section-title">Tilgungsplan</h4>
          <RechnerResultTable
            rows={result.tilgungsplan.map((row) => ({
              label: `Monat ${row.monat}`,
              value: `Zinsen: ${euro(row.zinsen)}, Tilgung: ${euro(row.tilgung)}, Rest: ${euro(row.restschuld)}`
            }))}
          />

          {result.laufzeit_jahre * 12 > 24 && (
            <RechnerHinweis>
              Der Tilgungsplan zeigt Monate 1–24 und den letzten Monat. Annuitätenformel:
              R = K × [i × (1+i)ⁿ] / [(1+i)ⁿ – 1]
            </RechnerHinweis>
          )}
        </div>
      )}
    </div>
  );
}
