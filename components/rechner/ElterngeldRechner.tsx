"use client";

import { useState, useEffect } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type ElterngeldParams, type ElterngeldResult } from "@/lib/calculators/elterngeld";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerSelect from "./ui/RechnerSelect";
import RechnerCheckbox from "./ui/RechnerCheckbox";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";

export default function ElterngeldRechner() {
  const [params, setParams] = useState<ElterngeldParams>({
    einkommen_vor_geburt: 3500,
    anzahl_kinder: 1,
    basiselterngeld: true,
  });

  const [result, setResult] = useState<ElterngeldResult | null>(null);

  const rates = useRates();

  useEffect(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Elterngeld-Rechner</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Durchschn. Nettoeinkommen vor Geburt"
          name="einkommen_vor_geburt"
          value={params.einkommen_vor_geburt}
          onChange={(val) => setParams((prev) => ({ ...prev, einkommen_vor_geburt: val }))}
          einheit="€"
          step={100}
          min={0}
        />

        <RechnerSelect
          label="Anzahl Kinder"
          name="anzahl_kinder"
          value={params.anzahl_kinder.toString()}
          onChange={(val) => setParams((prev) => ({ ...prev, anzahl_kinder: parseInt(val) }))}
          options={[1, 2, 3, 4, 5].map((n) => ({ label: n.toString(), value: n.toString() }))}
        />

        <RechnerCheckbox
          label="Basiselterngeld (statt Elterngeld Plus)"
          name="basiselterngeld"
          checked={params.basiselterngeld}
          onChange={(val) => setParams((prev) => ({ ...prev, basiselterngeld: val }))}
        />
      </div>

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox label="Monatliches Elterngeld" value={euro(result.elterngeld_monatlich)} highlight={true} />
            <RechnerResultBox label="Jährlich" value={euro(result.elterngeld_jaehrlich)} />
          </div>

          <RechnerResultTable
            rows={[
              { label: "Nettoeinkommen vor Geburt", value: euro(result.einkommen_vor_geburt) },
              { label: "Elterngeld (monatlich)", value: euro(result.elterngeld_monatlich) },
              { label: "Elterngeld (jährlich)", value: euro(result.elterngeld_jaehrlich) },
              { label: "Bezugsdauer", value: `${result.gesamtdauer_monate} Monate` },
            ]}
          />

          <RechnerHinweis>
            Elterngeld: 65% des durchschnittlichen Nettoeinkommens, min. 300 €, max. 1.800 € pro Monat.
            Mehrlingszuschlag: +25% pro Kind. Für genaue Berechnung wenden Sie sich an das zuständige Elterngeldamt.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
