"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type BafoegParams, type BafoegResult } from "@/lib/calculators/bafoeg";
import { euro } from "@/lib/calculators/utils";
import RechnerSelect from "./ui/RechnerSelect";
import RechnerInput from "./ui/RechnerInput";
import RechnerCheckbox from "./ui/RechnerCheckbox";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";
import { useRechnerState } from "@/lib/hooks/useRechnerState";
import RechnerResults from "./ui/RechnerResults";

export default function BafoegRechner() {
  const [params, setParams] = useState<BafoegParams>({
    wohnform: "extern",
    hatKV: true,
    elternEinkommen: 3000,
    elternVerheiratet: true,
    geschwisterInAusbildung: 0,
  });

  const [result, setResult] = useState<BafoegResult | null>(null);
  const rechnerState = useRechnerState(params);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
    rechnerState.markCalculated();
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">BAfoeg-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerSelect
          label="Wohnform"
          name="wohnform"
          value={params.wohnform}
          onChange={(val) => setParams((p) => ({ ...p, wohnform: val as "extern" | "eltern" }))}
          options={[
            { value: "extern", label: "Eigene Wohnung" },
            { value: "eltern", label: "Bei den Eltern" },
          ]}
        />

        <RechnerCheckbox
          label="Kranken-/Pflegeversicherungszuschlag"
          name="hatKV"
          checked={params.hatKV}
          onChange={(val) => setParams((p) => ({ ...p, hatKV: val }))}
        />

        <RechnerInput
          label="Monatliches Netto der Eltern"
          name="elternEinkommen"
          value={params.elternEinkommen}
          onChange={(val) => setParams((p) => ({ ...p, elternEinkommen: val }))}
          einheit="€"
          step={100}
          min={0}
        />

        <RechnerCheckbox
          label="Eltern verheiratet"
          name="elternVerheiratet"
          checked={params.elternVerheiratet}
          onChange={(val) => setParams((p) => ({ ...p, elternVerheiratet: val }))}
        />

        <RechnerSelect
          label="Geschwister in Ausbildung"
          name="geschwisterInAusbildung"
          value={params.geschwisterInAusbildung.toString()}
          onChange={(val) => setParams((p) => ({ ...p, geschwisterInAusbildung: parseInt(val) }))}
          options={Array.from({ length: 6 }, (_, i) => ({
            label: i.toString(),
            value: i.toString(),
          }))}
        />
      <RechnerButton onClick={handleBerechnen} disabled={rechnerState.buttonDisabled} needsUpdate={rechnerState.needsUpdate} />

      </div>

      {result && (
        <RechnerResults scrollKey={rechnerState.scrollKey}>
          {result.hatAnspruch ? (
            <>
              <div className="rechner-result-boxes">
                <RechnerResultBox
                  label="BAfoeg-Anspruch / Monat"
                  value={euro(result.bafoegAnspruch)}
                  highlight
                />
                <RechnerResultBox
                  label="Max. Darlehen gesamt"
                  value={euro(result.darlehensMax)}
                />
              </div>

              <RechnerResultTable
                rows={[
                  { label: "Maximaler Bedarfssatz", value: euro(result.bedarfMax) },
                  { label: "Eltern-Freibetrag", value: euro(result.elternFreibetrag) },
                  { label: "Anrechenb. Elterneinkommen", value: euro(result.anrechenbaresElternEinkommen) },
                  { label: "Elternanrechnung (50 %)", value: `- ${euro(result.elternAnrechnung)}` },
                ]}
                footer={{ label: "BAfoeg-Anspruch", value: euro(result.bafoegAnspruch) }}
              />
            </>
          ) : (
            <RechnerResultBox
              label="Kein BAfoeg-Anspruch"
              value="Elterneinkommen zu hoch"
              variant="negative"
            />
          )}

          <RechnerHinweis>
            BAfoeg wird zur Haelfte als Zuschuss, zur Haelfte als zinsloses Darlehen
            gewaehrt (max. 10.010 EUR Rueckzahlung). Grundlage: BAfoeg 2024/2026.
          </RechnerHinweis>
        </RechnerResults>
      )}
    </div>
  );
}
