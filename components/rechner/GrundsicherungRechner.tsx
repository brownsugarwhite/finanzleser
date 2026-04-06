"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type GrundsicherungParams, type GrundsicherungResult } from "@/lib/calculators/grundsicherung";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerCheckbox from "./ui/RechnerCheckbox";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";
import RechnerResults from "./ui/RechnerResults";

export default function GrundsicherungRechner() {
  const [params, setParams] = useState<GrundsicherungParams>({
    alleinstehend: true,
    monatlicheRente: 800,
    sonstigesEinkommen: 0,
  });

  const [result, setResult] = useState<GrundsicherungResult | null>(null);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Grundsicherung-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerCheckbox
          label="Alleinstehend"
          name="alleinstehend"
          checked={params.alleinstehend}
          onChange={(val) => setParams((p) => ({ ...p, alleinstehend: val }))}
        />

        <RechnerInput
          label="Monatliche Rente"
          name="monatlicheRente"
          value={params.monatlicheRente}
          onChange={(val) => setParams((p) => ({ ...p, monatlicheRente: val }))}
          einheit="€"
          step={50}
          min={0}
        />

        <RechnerInput
          label="Sonstiges Einkommen"
          name="sonstigesEinkommen"
          value={params.sonstigesEinkommen}
          onChange={(val) => setParams((p) => ({ ...p, sonstigesEinkommen: val }))}
          einheit="€"
          step={50}
          min={0}
        />
      </div>

      <RechnerButton onClick={handleBerechnen} />

      {result && (
        <RechnerResults>
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Grundsicherung / Monat"
              value={euro(result.anspruch)}
              highlight
            />
            <RechnerResultBox
              label="Regelbedarf"
              value={euro(result.regelbedarf)}
            />
          </div>

          <RechnerResultTable
            rows={[
              { label: "Regelbedarf", value: euro(result.regelbedarf) },
              { label: "Freibetrag auf Rente", value: euro(result.freibetragRente) },
              { label: "Anrechenbare Rente", value: `- ${euro(result.anrechenbareRente)}` },
              { label: "Sonstiges anrechenbar", value: `- ${euro(result.anrechenbaresSonstiges)}` },
            ]}
            footer={{ label: "Grundsicherung", value: euro(result.anspruch) }}
          />

          <RechnerHinweis>
            Grundsicherung im Alter (ab Regelaltersgrenze) und bei voller
            Erwerbsminderung. Freibetrag auf Rente: 30 %, max. Haelfte des Regelsatzes.
            Grundlage: SGB XII.
          </RechnerHinweis>
        </RechnerResults>
      )}
    </div>
  );
}
