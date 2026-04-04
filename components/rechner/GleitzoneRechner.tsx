"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type GleitzoneParams, type GleitzoneResult } from "@/lib/calculators/gleitzone";
import { euro, prozent } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";

const typLabels: Record<string, string> = {
  minijob: "Minijob",
  gleitzone: "Gleitzone (Midijob)",
  regulaer: "Regulaer versicherungspflichtig",
};

export default function GleitzoneRechner() {
  const [params, setParams] = useState<GleitzoneParams>({
    monatsBrutto: 1200,
  });

  const [result, setResult] = useState<GleitzoneResult | null>(null);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Gleitzone/Midijob-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Monatliches Bruttogehalt"
          name="monatsBrutto"
          value={params.monatsBrutto}
          onChange={(val) => setParams({ monatsBrutto: val })}
          einheit="€"
          step={50}
          min={0}
          max={3000}
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
              label="Netto nach SV"
              value={euro(result.nettoNachSV)}
              highlight={true}
            />
            {result.typ === "gleitzone" && (
              <RechnerResultBox
                label="SV-Ersparnis"
                value={euro(result.ersparnisAbsolut)}
                variant="positive"
              />
            )}
          </div>

          <RechnerResultTable
            rows={[
              { label: "Monatsbrutto", value: euro(result.monatsBrutto) },
              { label: "Beschaeftigungstyp", value: typLabels[result.typ] || result.typ },
              { label: "Beitragspflichtiges Entgelt", value: euro(result.beitragsAE) },
              { label: "SV-Beitrag AN (Gleitzone)", value: euro(result.svANGleitzone) },
              { label: "SV-Beitrag AN (normal)", value: euro(result.svANNormal) },
              { label: "Ersparnis", value: euro(result.ersparnisAbsolut) },
              { label: "Ersparnis (%)", value: prozent(result.ersparnisProzent) },
              { label: "Netto nach SV", value: euro(result.nettoNachSV) },
              ...(result.typ === "minijob"
                ? [{ label: "RV-Aufstockung AN", value: euro(result.rvAufstockung) }]
                : []),
            ]}
          />

          <RechnerHinweis>
            In der Gleitzone (538,01-2.000 EUR) zahlen Arbeitnehmer reduzierte SV-Beitraege
            (SS 20 Abs. 2 SGB IV). Die Ersparnis ist bei niedrigem Einkommen am groessten.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
