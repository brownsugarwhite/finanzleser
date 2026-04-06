"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type MindestlohnParams, type MindestlohnResult } from "@/lib/calculators/mindestlohn";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";
import { useRechnerState } from "@/lib/hooks/useRechnerState";
import RechnerResults from "./ui/RechnerResults";

export default function MindestlohnRechner() {
  const [params, setParams] = useState<MindestlohnParams>({
    stundenlohn: 13.90,
    wochenstunden: 40,
  });

  const [result, setResult] = useState<MindestlohnResult | null>(null);
  const rechnerState = useRechnerState(params);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
    rechnerState.markCalculated();
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Mindestlohn-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Stundenlohn"
          name="stundenlohn"
          value={params.stundenlohn}
          onChange={(val) => setParams((prev) => ({ ...prev, stundenlohn: val }))}
          einheit="€/Std."
          step={0.10}
          min={0}
        />

        <RechnerInput
          label="Wochenstunden"
          name="wochenstunden"
          value={params.wochenstunden}
          onChange={(val) => setParams((prev) => ({ ...prev, wochenstunden: val }))}
          einheit="Std./Woche"
          step={1}
          min={1}
          max={60}
        />
      <RechnerButton onClick={handleBerechnen} disabled={rechnerState.buttonDisabled} needsUpdate={rechnerState.needsUpdate} />

      </div>

      {result && (
        <RechnerResults scrollKey={rechnerState.scrollKey}>
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Monatliches Brutto"
              value={euro(result.bruttoMonatlich)}
              highlight={true}
            />
            <RechnerResultBox
              label="Mindestlohn-Pruefung"
              value={result.istKonform ? "Eingehalten" : "Unterschritten"}
              variant={result.istKonform ? "positive" : "negative"}
              highlight={true}
            />
          </div>

          {result.istKonform ? (
            <RechnerHinweis>
              Der Stundenlohn von {result.stundenlohn.toFixed(2)} EUR liegt ueber dem gesetzlichen
              Mindestlohn von {result.mindestlohn.toFixed(2)} EUR/Stunde.
            </RechnerHinweis>
          ) : (
            <RechnerHinweis>
              Der Stundenlohn von {result.stundenlohn.toFixed(2)} EUR liegt unter dem gesetzlichen
              Mindestlohn von {result.mindestlohn.toFixed(2)} EUR/Stunde.
            </RechnerHinweis>
          )}

          <RechnerResultTable
            rows={[
              { label: "Stundenlohn", value: `${result.stundenlohn.toFixed(2)} €/Std.` },
              { label: "Gesetzlicher Mindestlohn", value: `${result.mindestlohn.toFixed(2)} €/Std.` },
              { label: "Wochenstunden", value: `${result.wochenstunden} Std.` },
              { label: "Monatsstunden (Ø)", value: `${result.monatsStunden.toFixed(1)} Std.` },
              { label: "Brutto monatlich", value: euro(result.bruttoMonatlich) },
              { label: "Mindestlohn monatlich", value: euro(result.mindestlohnMonatlich) },
            ]}
            footer={{
              label: "Differenz",
              value: `${result.differenz >= 0 ? "+" : ""}${euro(result.differenz)}`,
            }}
          />

          <RechnerHinweis>
            Der gesetzliche Mindestlohn betraegt {result.mindestlohn.toFixed(2)} EUR/Stunde (MiLoG).
            Berechnungsgrundlage: 4,348 Wochen pro Monat.
          </RechnerHinweis>
        </RechnerResults>
      )}
    </div>
  );
}
