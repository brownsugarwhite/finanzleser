"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type AbfindungParams, type AbfindungResult } from "@/lib/calculators/abfindung";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerComparisonTable from "./ui/RechnerComparisonTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";
import RechnerResults from "./ui/RechnerResults";

export default function AbfindungRechner() {
  const [params, setParams] = useState<AbfindungParams>({
    monatsBrutto: 3500,
    beschaeftigungsjahre: 10,
    faktor: 0.5,
    jahresBruttoEinkommen: 42000,
  });
  const [result, setResult] = useState<AbfindungResult | null>(null);

  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  // Auto-berechne Jahresbrutto wenn Monatsbrutto geändert wird
  const setMonatsBrutto = (v: number) => {
    setParams((p) => ({ ...p, monatsBrutto: v, jahresBruttoEinkommen: v * 12 }));
  };

  const set = (key: keyof AbfindungParams, val: number) =>
    setParams((p) => ({ ...p, [key]: val }));

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Abfindungsrechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Bruttomonatsgehalt"
          name="monatsBrutto"
          value={params.monatsBrutto}
          onChange={setMonatsBrutto}
          einheit="€"
          step={100}
          min={100}
          max={100000}
        />

        <RechnerInput
          label="Beschäftigungsjahre"
          name="beschaeftigungsjahre"
          value={params.beschaeftigungsjahre}
          onChange={(v) => set("beschaeftigungsjahre", v)}
          einheit="Jahre"
          step={1}
          min={1}
          max={50}
        />

        <RechnerInput
          label="Abfindungsfaktor"
          name="faktor"
          value={params.faktor}
          onChange={(v) => set("faktor", v)}
          step={0.1}
          min={0.1}
          max={2}
          tooltip="Üblich: 0,5 Monatsgehälter je Beschäftigungsjahr"
        />

        <RechnerInput
          label="Jahresbruttoeinkommen (ohne Abfindung)"
          name="jahresBruttoEinkommen"
          value={params.jahresBruttoEinkommen}
          onChange={(v) => set("jahresBruttoEinkommen", v)}
          einheit="€"
          step={1000}
        />
      </div>

      <RechnerButton onClick={handleBerechnen} />

      {result && (
        <RechnerResults>
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Abfindung (brutto)"
              value={euro(result.abfindungBrutto)}
              highlight
            />
            <RechnerResultBox
              label="Netto (Fünftelregelung)"
              value={euro(result.nettoFuenftel)}
              variant="positive"
            />
            <RechnerResultBox
              label="Steuerersparnis"
              value={euro(result.steuerersparnis)}
              variant={result.steuerersparnis > 0 ? "positive" : "neutral"}
              subtext="durch Fünftelregelung"
            />
          </div>

          <RechnerComparisonTable
            title="Vergleich: Normale Besteuerung vs. Fünftelregelung"
            scenarios={[
              {
                label: "Normal",
                rows: [
                  { label: "Abfindung (brutto)", value: euro(result.abfindungBrutto) },
                  { label: "Einkommensteuer", value: euro(result.estNormal) },
                  { label: "Abfindung (netto)", value: euro(result.nettoNormal) },
                ],
              },
              {
                label: "Fünftelregelung",
                rows: [
                  { label: "Abfindung (brutto)", value: euro(result.abfindungBrutto) },
                  { label: "Einkommensteuer", value: euro(result.estFuenftel) },
                  { label: "Abfindung (netto)", value: euro(result.nettoFuenftel) },
                ],
              },
            ]}
            highlightDifference
          />

          <RechnerHinweis>
            Berechnung nach §34 EStG (Fünftelregelung). Solidaritätszuschlag und Kirchensteuer
            sind in dieser vereinfachten Darstellung nicht separat ausgewiesen.
            Abfindungen sind grundsätzlich sozialversicherungsfrei.
          </RechnerHinweis>
        </RechnerResults>
      )}
    </div>
  );
}
