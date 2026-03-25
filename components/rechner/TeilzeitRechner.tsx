"use client";

import { useState, useEffect } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type TeilzeitParams, type TeilzeitResult } from "@/lib/calculators/teilzeit";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";

export default function TeilzeitRechner() {
  const [params, setParams] = useState<TeilzeitParams>({
    vollzeit_brutto: 3000,
    stunden_pro_woche_alt: 40,
    stunden_pro_woche_neu: 30
  });

  const [result, setResult] = useState<TeilzeitResult | null>(null);
  const rates = useRates();

  useEffect(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  const handleParamChange = (key: keyof TeilzeitParams, value: number) => {
    setParams((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Teilzeit-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Vollzeit Brutto-Verdienst"
          name="vollzeit_brutto"
          value={params.vollzeit_brutto}
          onChange={(val) => handleParamChange("vollzeit_brutto", Number(val))}
          einheit="€/Monat"
          min={0}
          step={100}
        />

        <RechnerInput
          label="Stunden pro Woche (aktuell)"
          name="stunden_pro_woche_alt"
          value={params.stunden_pro_woche_alt}
          onChange={(val) => handleParamChange("stunden_pro_woche_alt", Number(val))}
          einheit="Stunden"
          min={1}
          max={60}
          step={0.5}
        />

        <RechnerInput
          label="Stunden pro Woche (neu)"
          name="stunden_pro_woche_neu"
          value={params.stunden_pro_woche_neu}
          onChange={(val) => handleParamChange("stunden_pro_woche_neu", Number(val))}
          einheit="Stunden"
          min={1}
          max={60}
          step={0.5}
        />
      </div>

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Teilzeit Brutto"
              value={euro(result.teilzeit_brutto)}
              highlight={true}
            />
            <RechnerResultBox
              label="Brutto-Differenz"
              value={euro(result.brutto_differenz)}
              highlight={false}
            />
            <RechnerResultBox
              label="Reduktion"
              value={`${result.reduktion_prozent}%`}
              highlight={false}
            />
          </div>

          <h4 className="rechner-result-section-title">Detaillierte Berechnung</h4>
          <RechnerResultTable
            rows={[
              { label: "Vollzeit Brutto monatlich", value: euro(result.vollzeit_brutto) },
              { label: "Stundenreduktion", value: `${result.reduktion_prozent}%` },
              { label: "Teilzeit Brutto monatlich", value: euro(result.teilzeit_brutto) },
              { label: "Brutto-Differenz", value: `−${euro(result.brutto_differenz)}` }
            ]}
          />

          <h4 className="rechner-result-section-title">Vereinfachte Netto-Schätzung</h4>
          <RechnerResultTable
            rows={[
              { label: "Netto monatlich (Vollzeit)", value: euro(result.netto_monatlich_alt) },
              { label: "Netto monatlich (Teilzeit)", value: euro(result.netto_monatlich_neu) },
              { label: "Netto-Differenz", value: `−${euro(result.netto_differenz)}` }
            ]}
          />

          <RechnerHinweis>
            Dies ist eine vereinfachte Berechnung mit pauschal 20% Sozialversicherungsabzug.
            Die tatsächliche Netto-Differenz hängt von Ihrer persönlichen Steuerkasse ab
            (Lohnsteuerklasse, Kirchensteuer, Kinderfreibeträge, etc.).
            Bei Reduktion unter die Midi-Job-Grenze können zusätzliche Effekte entstehen.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
