"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type HinzuverdienstParams, type HinzuverdienstResult } from "@/lib/calculators/hinzuverdienst";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerCheckbox from "./ui/RechnerCheckbox";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";

export default function HinzuverdienstRechner() {
  const [params, setParams] = useState<HinzuverdienstParams>({
    monatlicheRente: 1500,
    monatlichesEinkommen: 2000,
    istVorzeitigeRente: false,
  });

  const [result, setResult] = useState<HinzuverdienstResult | null>(null);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Hinzuverdienst-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Monatliche Rente"
          name="monatlicheRente"
          value={params.monatlicheRente}
          onChange={(val) => setParams((p) => ({ ...p, monatlicheRente: val }))}
          einheit="€/Monat"
          min={0}
          step={100}
        />

        <RechnerInput
          label="Monatliches Einkommen (Hinzuverdienst)"
          name="monatlichesEinkommen"
          value={params.monatlichesEinkommen}
          onChange={(val) => setParams((p) => ({ ...p, monatlichesEinkommen: val }))}
          einheit="€/Monat"
          min={0}
          step={100}
        />

        <RechnerCheckbox
          label="Vorzeitige Rente (vor Regelaltersgrenze)"
          name="istVorzeitigeRente"
          checked={params.istVorzeitigeRente}
          onChange={(val) => setParams((p) => ({ ...p, istVorzeitigeRente: val }))}
        />
      </div>

      <RechnerButton onClick={handleBerechnen} />

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Verbleibende Rente"
              value={euro(result.verbleibendeRente)}
              highlight={true}
            />
            <RechnerResultBox
              label="Gesamteinkommen"
              value={euro(result.gesamtEinkommen)}
            />
          </div>

          <h4 className="rechner-result-section-title">Berechnung</h4>
          <RechnerResultTable
            rows={[
              { label: "Monatliche Rente", value: euro(params.monatlicheRente) },
              { label: "Monatliches Einkommen", value: euro(params.monatlichesEinkommen) },
              {
                label: "Hinzuverdienstgrenze (monatlich)",
                value: result.hinzuverdienstGrenze > 0
                  ? euro(result.hinzuverdienstGrenze)
                  : "unbegrenzt"
              },
              { label: "Kuerzungsbetrag", value: euro(result.kuerzungsBetrag) },
            ]}
            footer={{ label: "Gesamteinkommen (Rente + Verdienst)", value: euro(result.gesamtEinkommen) }}
          />

          <RechnerHinweis>
            {params.istVorzeitigeRente
              ? `Bei vorzeitiger Rente gilt eine Hinzuverdienstgrenze von ${euro(result.hinzuverdienstGrenze)} monatlich. 40 % des uebersteigenden Einkommens werden von der Rente abgezogen.`
              : "Bei der Regelaltersrente gibt es seit 2023 keine Hinzuverdienstgrenze mehr. Sie koennen unbegrenzt hinzuverdienen."
            }
            {" "}Quelle: § 34 SGB VI.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
