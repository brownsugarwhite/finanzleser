"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type RenteParams, type RenteResult } from "@/lib/calculators/rente";
import { euro, punkte } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";

export default function RenteRechner() {
  const [params, setParams] = useState<RenteParams>({
    geburtsjahr: 1975,
    beitragsjahre: 30,
    jahresBrutto: 40000,
    bekannteEntgeltpunkte: 0,
  });

  const [result, setResult] = useState<RenteResult | null>(null);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Rentenrechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Geburtsjahr"
          name="geburtsjahr"
          value={params.geburtsjahr}
          onChange={(val) => setParams((p) => ({ ...p, geburtsjahr: val }))}
          min={1940}
          max={2000}
          step={1}
        />

        <RechnerInput
          label="Beitragsjahre"
          name="beitragsjahre"
          value={params.beitragsjahre}
          onChange={(val) => setParams((p) => ({ ...p, beitragsjahre: val }))}
          einheit="Jahre"
          min={1}
          max={50}
          step={1}
        />

        <RechnerInput
          label="Jahresbruttoeinkommen"
          name="jahresBrutto"
          value={params.jahresBrutto}
          onChange={(val) => setParams((p) => ({ ...p, jahresBrutto: val }))}
          einheit="€/Jahr"
          min={0}
          step={1000}
        />

        <RechnerInput
          label="Bekannte Entgeltpunkte (optional)"
          name="bekannteEntgeltpunkte"
          value={params.bekannteEntgeltpunkte}
          onChange={(val) => setParams((p) => ({ ...p, bekannteEntgeltpunkte: val }))}
          einheit="EP"
          min={0}
          max={100}
          step={0.5}
          tooltip="Falls Sie Ihre Entgeltpunkte kennen (z.B. aus der Renteninformation), tragen Sie diese hier ein. Bei 0 werden die EP automatisch berechnet."
        />
      </div>

      <RechnerButton onClick={handleBerechnen} />

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Monatliche Rente"
              value={euro(result.renteMonatlich)}
              highlight={true}
            />
            <RechnerResultBox
              label="Jaehrliche Rente"
              value={euro(result.renteJaehrlich)}
            />
          </div>

          <h4 className="rechner-result-section-title">Berechnungsdetails</h4>
          <RechnerResultTable
            rows={[
              { label: "Entgeltpunkte", value: punkte(result.entgeltpunkte) },
              { label: "Zugangsfaktor", value: result.zugangsfaktor.toFixed(2) },
              { label: "Aktueller Rentenwert", value: euro(result.rentenwertAktuell) },
              { label: "Regelaltersgrenze", value: `${result.regelaltersgrenze} Jahre` },
              { label: "Verbleibende Jahre", value: `${result.verbleibendeJahre} Jahre` },
              { label: "Standardrente (45 EP)", value: euro(result.standardrente) },
            ]}
            footer={{ label: "Ihre monatliche Rente", value: euro(result.renteMonatlich) }}
          />

          <RechnerHinweis>
            Die Berechnung basiert auf dem aktuellen Rentenwert ({euro(result.rentenwertAktuell)}) und
            einem Zugangsfaktor von {result.zugangsfaktor.toFixed(2)} (Regelaltersgrenze).
            Die tatsaechliche Rente haengt von Ihren individuellen Versicherungszeiten ab.
            Quelle: Deutsche Rentenversicherung, SGB VI.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
