"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type StundenlohnParams, type StundenlohnResult } from "@/lib/calculators/stundenlohn";
import { euro, prozent } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";
import { useRechnerState } from "@/lib/hooks/useRechnerState";
import RechnerResults from "./ui/RechnerResults";

export default function StundenlohnRechner() {
  const [params, setParams] = useState<StundenlohnParams>({
    jahresgehalt: 42000,
    wochenstunden: 40,
    urlaubstage: 30,
    feiertage: 10,
  });

  const [result, setResult] = useState<StundenlohnResult | null>(null);
  const rechnerState = useRechnerState(params);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
    rechnerState.markCalculated();
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Stundenlohnrechner</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Jahresgehalt (brutto)"
          name="jahresgehalt"
          value={params.jahresgehalt}
          onChange={(val) => setParams((prev) => ({ ...prev, jahresgehalt: val }))}
          einheit="€"
          step={1000}
          min={0}
        />
        <RechnerInput
          label="Wochenstunden"
          name="wochenstunden"
          value={params.wochenstunden}
          onChange={(val) => setParams((prev) => ({ ...prev, wochenstunden: val }))}
          einheit="h"
          step={1}
          min={1}
        />
        <RechnerInput
          label="Urlaubstage"
          name="urlaubstage"
          value={params.urlaubstage}
          onChange={(val) => setParams((prev) => ({ ...prev, urlaubstage: val }))}
          einheit="Tage"
          step={1}
          min={0}
        />
        <RechnerInput
          label="Feiertage"
          name="feiertage"
          value={params.feiertage}
          onChange={(val) => setParams((prev) => ({ ...prev, feiertage: val }))}
          einheit="Tage"
          step={1}
          min={0}
        />
      <RechnerButton onClick={handleBerechnen} disabled={rechnerState.buttonDisabled} needsUpdate={rechnerState.needsUpdate} />

      </div>

      {result && (
        <RechnerResults scrollKey={rechnerState.scrollKey}>
          <div className="rechner-result-boxes">
            <RechnerResultBox label="Stundenlohn" value={euro(result.stundenlohn)} highlight />
            <RechnerResultBox label="Monatsgehalt" value={euro(result.monatsgehalt)} />
            <RechnerResultBox
              label={result.ueberMindestlohn ? "Über Mindestlohn" : "Unter Mindestlohn"}
              value={euro(Math.abs(result.differenzZuMindestlohn))}
              variant={result.ueberMindestlohn ? "positive" : "negative"}
            />
          </div>

          <RechnerResultTable
            rows={[
              { label: "Jahresgehalt", value: euro(params.jahresgehalt) },
              { label: "Monatsgehalt", value: euro(result.monatsgehalt) },
              { label: "Arbeitstage / Jahr", value: `${result.arbeitstageJahr} Tage` },
              { label: "Arbeitsstunden / Jahr", value: `${result.arbeitsstundenJahr} Stunden` },
              { label: "Stundenlohn", value: euro(result.stundenlohn) },
              { label: "Mindestlohn (2026)", value: euro(rates.mindestlohn.stundensatz) },
              { label: "Differenz zum Mindestlohn", value: euro(result.differenzZuMindestlohn) },
            ]}
          />

          <RechnerHinweis>
            Berechnung basiert auf dem gesetzlichen Mindestlohn 2026 ({euro(rates.mindestlohn.stundensatz)}/h).
            Wochenenden (104 Tage) werden automatisch abgezogen.
          </RechnerHinweis>
        </RechnerResults>
      )}
    </div>
  );
}
