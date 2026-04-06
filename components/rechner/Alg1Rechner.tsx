"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type Alg1Params, type Alg1Result } from "@/lib/calculators/alg1";
import { euro, prozent } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerSelect from "./ui/RechnerSelect";
import RechnerCheckbox from "./ui/RechnerCheckbox";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";
import { useRechnerState } from "@/lib/hooks/useRechnerState";
import RechnerResults from "./ui/RechnerResults";

export default function Alg1Rechner() {
  const [params, setParams] = useState<Alg1Params>({
    monatsBrutto: 3500,
    steuerklasse: 1,
    hatKinder: false,
    versicherungsmonate: 24,
    alter: 40,
  });

  const [result, setResult] = useState<Alg1Result | null>(null);
  const rechnerState = useRechnerState(params);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
    rechnerState.markCalculated();
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">ALG I-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Monatliches Bruttogehalt"
          name="monatsBrutto"
          value={params.monatsBrutto}
          onChange={(val) => setParams((prev) => ({ ...prev, monatsBrutto: val }))}
          einheit="€"
          step={100}
          min={0}
        />

        <RechnerSelect
          label="Steuerklasse"
          name="steuerklasse"
          value={String(params.steuerklasse)}
          onChange={(val) => setParams((prev) => ({ ...prev, steuerklasse: parseInt(val) }))}
          options={[1, 2, 3, 4, 5, 6].map((sk) => ({
            label: `Klasse ${sk}`,
            value: String(sk),
          }))}
        />

        <RechnerCheckbox
          label="Hat Kinder (Leistungssatz 67%)"
          name="hatKinder"
          checked={params.hatKinder}
          onChange={(val) => setParams((prev) => ({ ...prev, hatKinder: val }))}
        />

        <RechnerInput
          label="Versicherungsmonate (letzte 30 Monate)"
          name="versicherungsmonate"
          value={params.versicherungsmonate}
          onChange={(val) => setParams((prev) => ({ ...prev, versicherungsmonate: val }))}
          einheit="Monate"
          min={0}
          max={30}
        />

        <RechnerInput
          label="Alter"
          name="alter"
          value={params.alter}
          onChange={(val) => setParams((prev) => ({ ...prev, alter: val }))}
          einheit="Jahre"
          min={16}
          max={67}
        />
      <RechnerButton onClick={handleBerechnen} disabled={rechnerState.buttonDisabled} needsUpdate={rechnerState.needsUpdate} />

      </div>

      {result && (
        <RechnerResults scrollKey={rechnerState.scrollKey}>
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="ALG I monatlich"
              value={euro(result.algMonatlich)}
              highlight={true}
            />
            <RechnerResultBox
              label="Bezugsdauer"
              value={`${result.bezugsdauerMonate} Monate`}
              highlight={true}
            />
            <RechnerResultBox
              label="Gesamtbetrag"
              value={euro(result.gesamtbetrag)}
            />
          </div>

          <RechnerResultTable
            rows={[
              { label: "Bemessungsentgelt", value: `${euro(result.bemessungsentgelt)}${result.bemessungsentgeltBegrenzt ? " (gedeckelt)" : ""}` },
              { label: "SV-Pauschale", value: euro(result.svPauschale) },
              { label: "LSt-Pauschale", value: euro(result.lstPauschale) },
              { label: "Leistungsentgelt (täglich)", value: euro(result.leistungsentgeltTaeglich) },
              { label: "Leistungsentgelt (monatlich)", value: euro(result.leistungsentgeltMonatlich) },
              { label: "Leistungssatz", value: prozent(result.satzProzent) },
              { label: "ALG I (täglich)", value: euro(result.algTaeglich) },
              { label: "ALG I (monatlich)", value: euro(result.algMonatlich) },
              { label: "Bezugsdauer", value: `${result.bezugsdauerMonate} Monate` },
            ]}
            footer={{ label: "Gesamtbetrag", value: euro(result.gesamtbetrag) }}
          />

          <RechnerHinweis>
            ALG I betraegt {result.satzProzent}% des Leistungsentgelts
            ({params.hatKinder ? "mit Kindern" : "ohne Kinder"}).
            Rechtsgrundlage: SS 149-153 SGB III. Die Berechnung ist vereinfacht
            und ersetzt keine individuelle Beratung durch die Agentur fuer Arbeit.
          </RechnerHinweis>
        </RechnerResults>
      )}
    </div>
  );
}
