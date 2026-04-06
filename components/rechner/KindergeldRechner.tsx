"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type KindergeldParams, type KindergeldResult } from "@/lib/calculators/kindergeld";
import { euro } from "@/lib/calculators/utils";
import RechnerSelect from "./ui/RechnerSelect";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";
import RechnerResults from "./ui/RechnerResults";

export default function KindergeldRechner() {
  const [params, setParams] = useState<KindergeldParams>({
    anzahlKinder: 2,
  });

  const [result, setResult] = useState<KindergeldResult | null>(null);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Kindergeld-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerSelect
          label="Anzahl Kinder"
          name="anzahlKinder"
          value={params.anzahlKinder.toString()}
          onChange={(val) => setParams({ anzahlKinder: parseInt(val) })}
          options={Array.from({ length: 10 }, (_, i) => ({
            label: `${i + 1} ${i === 0 ? "Kind" : "Kinder"}`,
            value: (i + 1).toString(),
          }))}
        />
      </div>

      <RechnerButton onClick={handleBerechnen} />

      {result && (
        <RechnerResults>
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Kindergeld monatlich"
              value={euro(result.kindergeldMonatlich)}
              highlight
            />
            <RechnerResultBox
              label="Kindergeld jaehrlich"
              value={euro(result.kindergeldJaehrlich)}
            />
          </div>

          <RechnerResultTable
            rows={[
              { label: "Anzahl Kinder", value: result.anzahlKinder.toString() },
              { label: "Kindergeld je Kind / Monat", value: euro(result.kindergeldProKind) },
              { label: "Kindergeld gesamt / Monat", value: euro(result.kindergeldMonatlich) },
              { label: "Kindergeld gesamt / Jahr", value: euro(result.kindergeldJaehrlich) },
            ]}
          />

          <h4 className="rechner-result-section-title">Kinderfreibetrag-Vergleich</h4>
          <RechnerResultTable
            rows={[
              { label: "Kinderfreibetrag je Elternteil", value: euro(result.kinderfreibetragJeElternteil) },
              { label: "Kinderfreibetrag beide Eltern", value: euro(result.kinderfreibetragBeideEltern) },
            ]}
          />

          <RechnerHinweis>
            Ab 2026 betraegt das Kindergeld einheitlich 259 EUR pro Kind und Monat.
            Das Finanzamt prueft automatisch, ob Kindergeld oder Kinderfreibetrag
            guenstiger ist (Guenstigerpruefung). Grundlage: BKGG / EStG.
          </RechnerHinweis>
        </RechnerResults>
      )}
    </div>
  );
}
