"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type MinijobParams, type MinijobResult } from "@/lib/calculators/minijob";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerCheckbox from "./ui/RechnerCheckbox";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";

const typLabels: Record<string, string> = {
  minijob: "Minijob",
  midijob: "Midijob (Gleitzone)",
  regulaer: "Regulaer versicherungspflichtig",
};

export default function MinijobRechner() {
  const [params, setParams] = useState<MinijobParams>({
    monatsBrutto: 520,
    rvBefreiung: false,
  });

  const [result, setResult] = useState<MinijobResult | null>(null);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Minijob-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Monatlicher Verdienst"
          name="monatsBrutto"
          value={params.monatsBrutto}
          onChange={(val) => setParams((prev) => ({ ...prev, monatsBrutto: val }))}
          einheit="€"
          step={10}
          min={0}
        />

        <RechnerCheckbox
          label="RV-Befreiung (Rentenversicherung befreit)"
          name="rvBefreiung"
          checked={params.rvBefreiung}
          onChange={(val) => setParams((prev) => ({ ...prev, rvBefreiung: val }))}
        />
      </div>

      <RechnerButton onClick={handleBerechnen} />

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Beschaeftigungstyp"
              value={typLabels[result.typ] || result.typ}
            />
            <RechnerResultBox
              label="Netto Arbeitnehmer"
              value={euro(result.netto)}
              highlight={true}
            />
            {result.typ === "minijob" && (
              <RechnerResultBox
                label="Kosten Arbeitgeber"
                value={euro(result.agGesamt)}
              />
            )}
          </div>

          <h4 className="rechner-result-section-title">Arbeitnehmer</h4>
          <RechnerResultTable
            rows={[
              { label: "Monatsbrutto", value: euro(result.monatsBrutto) },
              { label: "Typ", value: typLabels[result.typ] || result.typ },
              ...(result.typ === "minijob"
                ? [{ label: "RV-Aufstockung AN", value: euro(result.anRVAufstockung) }]
                : []),
              ...(result.typ === "midijob"
                ? [
                    { label: "SV-Beitrag (reduziert)", value: euro(result.anSVReduziert) },
                    { label: "SV-Beitrag (normal)", value: euro(result.anSVNormal) },
                    { label: "Ersparnis", value: euro(result.anErsparnis) },
                  ]
                : []),
              { label: "Netto", value: euro(result.netto) },
              { label: "Stunden bei Mindestlohn", value: `${result.stundenBeiMindestlohn} h/Monat` },
            ]}
          />

          {result.typ === "minijob" && (
            <>
              <h4 className="rechner-result-section-title">Arbeitgeber-Kosten</h4>
              <RechnerResultTable
                rows={[
                  { label: "KV-Pauschale (AG)", value: euro(result.agKV) },
                  { label: "RV-Pauschale (AG)", value: euro(result.agRV) },
                  { label: "Steuerpauschale (AG)", value: euro(result.agSteuer) },
                ]}
                footer={{ label: "AG-Kosten gesamt", value: euro(result.agGesamt) }}
              />
            </>
          )}

          <RechnerHinweis>
            Bei Minijobs zahlt der Arbeitgeber Pauschalabgaeben. Der Arbeitnehmer kann sich
            von der RV-Aufstockung (3,6%) befreien lassen, verliert dann aber Rentenansprueche.
            Midijob-Grenze 2026: 538,01 bis 2.000 EUR.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
