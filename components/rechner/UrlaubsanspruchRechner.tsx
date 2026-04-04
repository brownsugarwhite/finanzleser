"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type UrlaubsanspruchParams, type UrlaubsanspruchResult } from "@/lib/calculators/urlaubsanspruch";
import RechnerSelect from "./ui/RechnerSelect";
import RechnerCheckbox from "./ui/RechnerCheckbox";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";

export default function UrlaubsanspruchRechner() {
  const [params, setParams] = useState<UrlaubsanspruchParams>({
    arbeitstageWoche: 5,
    schwerbehinderung: false,
  });

  const [result, setResult] = useState<UrlaubsanspruchResult | null>(null);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Urlaubsanspruch-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerSelect
          label="Arbeitstage pro Woche"
          name="arbeitstageWoche"
          value={String(params.arbeitstageWoche)}
          onChange={(val) =>
            setParams((p) => ({ ...p, arbeitstageWoche: Number(val) as 5 | 6 }))
          }
          options={[
            { value: "5", label: "5-Tage-Woche" },
            { value: "6", label: "6-Tage-Woche" },
          ]}
        />
        <RechnerCheckbox
          label="Schwerbehinderung (GdB >= 50)"
          name="schwerbehinderung"
          checked={params.schwerbehinderung}
          onChange={(val) => setParams((p) => ({ ...p, schwerbehinderung: val }))}
        />
      </div>

      <RechnerButton onClick={handleBerechnen} />

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Gesamter Urlaubsanspruch"
              value={`${result.gesamtAnspruch} Tage`}
              highlight={true}
            />
          </div>

          <h4 className="rechner-result-section-title">Aufschluesselung</h4>
          <RechnerResultTable
            rows={[
              { label: "Gesetzlicher Mindesturlaub (Werktage)", value: `${result.mindesturlaubWerktage} Tage` },
              { label: "Umgerechnet auf Arbeitstage", value: `${result.mindesturlaubArbeitstage} Tage` },
              { label: "Zusatzurlaub Schwerbehinderung", value: `${result.zusatzurlaub} Tage` },
              { label: "Gesamt", value: `${result.gesamtAnspruch} Tage` },
            ]}
          />

          <RechnerHinweis>
            Gesetzlicher Mindesturlaub nach BUrlG: 24 Werktage (6-Tage-Woche).
            Bei Schwerbehinderung (GdB {'>='} 50): 5 zusätzliche Arbeitstage nach SGB IX.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
