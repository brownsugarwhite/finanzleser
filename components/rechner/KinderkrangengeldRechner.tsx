"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type KinderkrankengeldParams, type KinderkrankengeldResult } from "@/lib/calculators/kinderkrankengeld";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerSelect from "./ui/RechnerSelect";
import RechnerCheckbox from "./ui/RechnerCheckbox";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";
import { useRechnerState } from "@/lib/hooks/useRechnerState";
import RechnerResults from "./ui/RechnerResults";

export default function KinderkrangengeldRechner() {
  const [params, setParams] = useState<KinderkrankengeldParams>({
    monatsBrutto: 3500,
    monatsNetto: 2400,
    anzahlKinder: 1,
    alleinerziehend: false,
    bereitsGenutzteTage: 0,
  });

  const [result, setResult] = useState<KinderkrankengeldResult | null>(null);
  const rechnerState = useRechnerState(params);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
    rechnerState.markCalculated();
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Kinderkrankengeld-Rechner 2026</h3>

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

        <RechnerInput
          label="Monatliches Nettogehalt"
          name="monatsNetto"
          value={params.monatsNetto}
          onChange={(val) => setParams((prev) => ({ ...prev, monatsNetto: val }))}
          einheit="€"
          step={100}
          min={0}
        />

        <RechnerSelect
          label="Anzahl Kinder"
          name="anzahlKinder"
          value={String(params.anzahlKinder)}
          onChange={(val) => setParams((prev) => ({ ...prev, anzahlKinder: parseInt(val) }))}
          options={[1, 2, 3, 4, 5].map((n) => ({
            label: String(n),
            value: String(n),
          }))}
        />

        <RechnerCheckbox
          label="Alleinerziehend"
          name="alleinerziehend"
          checked={params.alleinerziehend}
          onChange={(val) => setParams((prev) => ({ ...prev, alleinerziehend: val }))}
        />

        <RechnerInput
          label="Bereits genutzte Tage in diesem Jahr"
          name="bereitsGenutzteTage"
          value={params.bereitsGenutzteTage}
          onChange={(val) => setParams((prev) => ({ ...prev, bereitsGenutzteTage: val }))}
          einheit="Tage"
          min={0}
        />
      <RechnerButton onClick={handleBerechnen} disabled={rechnerState.buttonDisabled} needsUpdate={rechnerState.needsUpdate} />

      </div>

      {result && (
        <RechnerResults scrollKey={rechnerState.scrollKey}>
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Kinderkrankengeld taeglich"
              value={euro(result.kgTaeglich)}
              highlight={true}
            />
            <RechnerResultBox
              label="Verbleibende Tage"
              value={`${result.verbleibendeTage} Tage`}
            />
            <RechnerResultBox
              label="Gesamtbetrag"
              value={euro(result.gesamtbetrag)}
            />
          </div>

          <RechnerResultTable
            rows={[
              { label: "Brutto (begrenzt auf BBG)", value: `${euro(result.bruttoBegrenzt)}${result.istBegrenzt ? " (gedeckelt)" : ""}` },
              { label: "70% Brutto (taeglich)", value: euro(result.kgBruttoTaeglich) },
              { label: "90% Netto-Grenze (taeglich)", value: euro(result.kgNettoGrenze) },
              { label: "Kinderkrankengeld (taeglich)", value: euro(result.kgTaeglich) },
              { label: "Jahresanspruch", value: `${result.jahresanspruchTage} Tage` },
              { label: "Verbleibende Tage", value: `${result.verbleibendeTage} Tage` },
            ]}
            footer={{ label: "Gesamtbetrag (verbleibend)", value: euro(result.gesamtbetrag) }}
          />

          <RechnerHinweis>
            Kinderkrankengeld: 70% des Brutto, max. 90% des Netto (SS 45 SGB V).
            Der Jahresanspruch haengt von der Anzahl der Kinder und dem Familienstatus ab.
          </RechnerHinweis>
        </RechnerResults>
      )}
    </div>
  );
}
