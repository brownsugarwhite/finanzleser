"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type KrankengeldParams, type KrankengeldResult } from "@/lib/calculators/krankengeld";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";

export default function KrankengeldRechner() {
  const [params, setParams] = useState<KrankengeldParams>({
    monatsBrutto: 3500,
    monatsNetto: 2400,
  });

  const [result, setResult] = useState<KrankengeldResult | null>(null);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Krankengeld-Rechner 2026</h3>

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
      </div>

      <RechnerButton onClick={handleBerechnen} />

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Krankengeld taeglich"
              value={euro(result.kgTaeglich)}
              highlight={true}
            />
            <RechnerResultBox
              label="Krankengeld monatlich"
              value={euro(result.kgMonatlich)}
              highlight={true}
            />
          </div>

          <RechnerResultTable
            rows={[
              { label: "Monatsbrutto", value: `${euro(result.monatsBrutto)}${result.istBegrenzt ? " (ueber BBG)" : ""}` },
              { label: "Brutto (begrenzt auf BBG)", value: euro(result.bruttoBegrenzt) },
              { label: "Regelentgelt (taeglich)", value: euro(result.regelentgeltTaeglich) },
              { label: "70% Brutto (taeglich)", value: euro(result.kgBruttoTaeglich) },
              { label: "90% Netto-Grenze (taeglich)", value: euro(result.kgNettoGrenze) },
              { label: "Krankengeld (taeglich)", value: euro(result.kgTaeglich) },
              { label: "Krankengeld (woechentlich)", value: euro(result.kgWoechentlich) },
              { label: "Krankengeld (monatlich)", value: euro(result.kgMonatlich) },
              { label: "Max. Bezugsdauer", value: `${result.maxBezugsdauerWochen} Wochen` },
            ]}
          />

          <RechnerHinweis>
            Krankengeld betraegt 70% des Bruttogehalts, max. 90% des Nettogehalts (SS 47 SGB V).
            Die maximale Bezugsdauer betraegt {result.maxBezugsdauerWochen} Wochen fuer dieselbe Erkrankung
            innerhalb von 3 Jahren.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
