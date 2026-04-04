"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type KirchensteuerParams, type KirchensteuerResult } from "@/lib/calculators/kirchensteuer";
import { euro } from "@/lib/calculators/utils";
import { BUNDESLAENDER_OPTIONS } from "@/lib/calculators/shared/kirchensteuer";
import RechnerInput from "./ui/RechnerInput";
import RechnerSelect from "./ui/RechnerSelect";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";

export default function KirchensteuerRechner() {
  const [params, setParams] = useState<KirchensteuerParams>({
    lohnsteuerJahr: 3000,
    bundesland: "Nordrhein-Westfalen",
  });
  const [result, setResult] = useState<KirchensteuerResult | null>(null);

  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Kirchensteuer-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Jährliche Lohn-/Einkommensteuer"
          name="lohnsteuerJahr"
          value={params.lohnsteuerJahr}
          onChange={(v) => setParams((p) => ({ ...p, lohnsteuerJahr: v }))}
          einheit="€"
          step={10}
        />

        <RechnerSelect
          label="Bundesland"
          name="bundesland"
          value={params.bundesland}
          onChange={(v) => setParams((p) => ({ ...p, bundesland: v }))}
          options={BUNDESLAENDER_OPTIONS}
        />
      </div>

      <RechnerButton onClick={handleBerechnen} />

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox label="Kirchensteuer (jährlich)" value={euro(result.kirchensteuerJahr)} highlight />
            <RechnerResultBox label="Kirchensteuer (monatlich)" value={euro(result.kirchensteuerMonat)} />
          </div>

          <RechnerResultTable
            rows={[
              { label: "Einkommensteuer", value: euro(result.lohnsteuerJahr) },
              { label: `Kirchensteuersatz (${result.bundesland})`, value: `${result.satzProzent} %` },
              { label: "Kirchensteuer (jährlich)", value: euro(result.kirchensteuerJahr) },
              { label: "Kirchensteuer (monatlich)", value: euro(result.kirchensteuerMonat) },
            ]}
          />

          <RechnerHinweis>
            Bayern und Baden-Württemberg: 8 %. Alle anderen Bundesländer: 9 %.
            Die Kirchensteuer wird auf die Einkommensteuer berechnet.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
