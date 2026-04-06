"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type RentenschaetzerParams, type RentenschaetzerResult } from "@/lib/calculators/rentenschaetzer";
import { euro, punkte } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";
import RechnerResults from "./ui/RechnerResults";

export default function RentenschaetzerRechner() {
  const [params, setParams] = useState<RentenschaetzerParams>({
    monatlichesEinkommen: 3500,
    versicherungsjahre: 35,
  });

  const [result, setResult] = useState<RentenschaetzerResult | null>(null);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Rentenschaetzer 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Durchschnittliches monatliches Bruttoeinkommen"
          name="monatlichesEinkommen"
          value={params.monatlichesEinkommen}
          onChange={(val) => setParams((p) => ({ ...p, monatlichesEinkommen: val }))}
          einheit="€/Monat"
          min={0}
          step={100}
        />

        <RechnerInput
          label="Versicherungsjahre"
          name="versicherungsjahre"
          value={params.versicherungsjahre}
          onChange={(val) => setParams((p) => ({ ...p, versicherungsjahre: val }))}
          einheit="Jahre"
          min={1}
          max={50}
          step={1}
        />
      </div>

      <RechnerButton onClick={handleBerechnen} />

      {result && (
        <RechnerResults>
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Geschaetzte monatliche Rente"
              value={euro(result.renteMonatlichGeschaetzt)}
              highlight={true}
            />
            <RechnerResultBox
              label="Entgeltpunkte (geschaetzt)"
              value={punkte(result.entgeltpunkteGeschaetzt)}
            />
          </div>

          <h4 className="rechner-result-section-title">Berechnung</h4>
          <RechnerResultTable
            rows={[
              { label: "Monatliches Bruttoeinkommen", value: euro(params.monatlichesEinkommen) },
              { label: "Versicherungsjahre", value: `${params.versicherungsjahre} Jahre` },
              { label: "Entgeltpunkte (geschaetzt)", value: punkte(result.entgeltpunkteGeschaetzt) },
            ]}
            footer={{ label: "Monatliche Rente (geschaetzt)", value: euro(result.renteMonatlichGeschaetzt) }}
          />

          <RechnerHinweis>
            Dies ist eine unverbindliche Schaetzung. Die tatsaechliche Rente haengt von den genauen
            Versicherungszeiten und Einkommen ab. Luecken oder unterdurchschnittliche Einkommen
            reduzieren die Rente. Nutzen Sie die offizielle Rentenauskunft der Deutschen
            Rentenversicherung fuer praezise Werte.
          </RechnerHinweis>
        </RechnerResults>
      )}
    </div>
  );
}
