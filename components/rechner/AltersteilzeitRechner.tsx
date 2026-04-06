"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type AltersteilzeitParams, type AltersteilzeitResult } from "@/lib/calculators/altersteilzeit";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";
import RechnerResults from "./ui/RechnerResults";

export default function AltersteilzeitRechner() {
  const [params, setParams] = useState<AltersteilzeitParams>({
    monatsBrutto: 4000,
    alter: 58,
  });

  const [result, setResult] = useState<AltersteilzeitResult | null>(null);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Altersteilzeit-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Monatliches Brutto (Vollzeit)"
          name="monatsBrutto"
          value={params.monatsBrutto}
          onChange={(val) => setParams((p) => ({ ...p, monatsBrutto: val }))}
          einheit="EUR"
          min={0}
        />
        <RechnerInput
          label="Alter"
          name="alter"
          value={params.alter}
          onChange={(val) => setParams((p) => ({ ...p, alter: val }))}
          einheit="Jahre"
          min={50}
          max={67}
        />
      </div>

      <RechnerButton onClick={handleBerechnen} />

      {result && (
        <RechnerResults>
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Teilzeit-Brutto (50 %)"
              value={euro(result.teilzeitBrutto)}
              highlight={true}
            />
            <RechnerResultBox
              label="Aufstockung (20 % Vollzeit)"
              value={euro(result.aufstockung)}
            />
            <RechnerResultBox
              label="Gesamt Teilzeit"
              value={euro(result.gesamtTeilzeit)}
            />
          </div>

          {!result.alterBerechtigt && (
            <RechnerHinweis>
              Mindestalter fuer Altersteilzeit: 55 Jahre. Aktuelles Alter liegt darunter.
            </RechnerHinweis>
          )}

          <h4 className="rechner-result-section-title">Gehaltsvergleich</h4>
          <RechnerResultTable
            rows={[
              { label: "Vollzeit-Brutto", value: euro(params.monatsBrutto) },
              { label: "Teilzeit-Brutto (50 %)", value: euro(result.teilzeitBrutto) },
              { label: "Aufstockung AG (20 %)", value: euro(result.aufstockung) },
              { label: "Gesamt Altersteilzeit", value: euro(result.gesamtTeilzeit) },
              { label: "Nettovergleich (geschaetzt)", value: euro(result.nettovergleich) },
            ]}
          />

          <RechnerHinweis>
            Die Aufstockung (hier 20 % des Vollzeit-Brutto) richtet sich nach Tarif- oder
            Betriebsvereinbarung. Grundlage: Paragraph 2 AltTZG. Mindestalter: 55 Jahre.
          </RechnerHinweis>
        </RechnerResults>
      )}
    </div>
  );
}
