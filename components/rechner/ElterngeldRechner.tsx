"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type ElterngeldParams, type ElterngeldResult } from "@/lib/calculators/elterngeld";
import { euro, prozent } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";
import { useRechnerState } from "@/lib/hooks/useRechnerState";
import RechnerResults from "./ui/RechnerResults";

export default function ElterngeldRechner() {
  const [params, setParams] = useState<ElterngeldParams>({
    monatsBrutto: 3000,
    zvEJahr: 36000,
  });

  const [result, setResult] = useState<ElterngeldResult | null>(null);
  const rechnerState = useRechnerState(params);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
    rechnerState.markCalculated();
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Elterngeld-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Durchschnittliches Monatsbrutto"
          name="monatsBrutto"
          value={params.monatsBrutto}
          onChange={(val) => setParams((p) => ({ ...p, monatsBrutto: val }))}
          einheit="€"
          step={100}
          min={0}
        />

        <RechnerInput
          label="Zu versteuerndes Jahreseinkommen"
          name="zvEJahr"
          value={params.zvEJahr}
          onChange={(val) => setParams((p) => ({ ...p, zvEJahr: val }))}
          einheit="€"
          step={1000}
          min={0}
          tooltip="Relevant fuer Einkommenspruefung (Grenze: 175.000 EUR)"
        />
      <RechnerButton onClick={handleBerechnen} disabled={rechnerState.buttonDisabled} needsUpdate={rechnerState.needsUpdate} />

      </div>

      {result && (
        <RechnerResults scrollKey={rechnerState.scrollKey}>
          {result.keinAnspruch ? (
            <RechnerResultBox
              label="Kein Anspruch"
              value="Einkommen ueber 175.000 EUR"
              highlight={false}
              variant="negative"
            />
          ) : (
            <>
              <div className="rechner-result-boxes">
                <RechnerResultBox
                  label="Basiselterngeld / Monat"
                  value={euro(result.basisElterngeld)}
                  highlight
                />
                <RechnerResultBox
                  label="ElterngeldPlus / Monat"
                  value={euro(result.elterngeldPlus)}
                />
              </div>

              <RechnerResultTable
                rows={[
                  { label: "Monatsbrutto", value: euro(result.monatsBrutto) },
                  { label: "BEEG-Netto", value: euro(result.beegNetto) },
                  { label: "Ersatzrate", value: prozent(result.ersatzrateProzent) },
                  { label: "Basiselterngeld (12 Mon.)", value: euro(result.gesamtBasis) },
                  { label: "ElterngeldPlus (24 Mon.)", value: euro(result.gesamtPlus) },
                ]}
              />
            </>
          )}

          <RechnerHinweis>
            Berechnung nach BEEG 2026. BEEG-Netto = Brutto minus 21,9 % SV-Pauschale
            minus progressiver Lohnsteuer. Ersatzrate 65-67 % je nach Nettoeinkommen.
            Min. 300 EUR, max. 1.800 EUR (Basis) bzw. 150-900 EUR (Plus).
          </RechnerHinweis>
        </RechnerResults>
      )}
    </div>
  );
}
