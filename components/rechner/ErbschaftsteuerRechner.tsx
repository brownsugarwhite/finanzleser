"use client";

import { useState, useEffect } from "react";
import { berechne, type ErbschaftsteuerParams, type ErbschaftsteuerResult } from "@/lib/calculators/erbschaftsteuer";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerSelect from "./ui/RechnerSelect";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";

export default function ErbschaftsteuerRechner() {
  const [params, setParams] = useState<ErbschaftsteuerParams>({
    erbschaft: 100000,
    verwandtschaftsgrad: 1,
  });

  const [result, setResult] = useState<ErbschaftsteuerResult | null>(null);

  useEffect(() => {
    setResult(berechne(params));
  }, [params]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Erbschaftsteuer-Rechner</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Erbsumme"
          name="erbschaft"
          value={params.erbschaft}
          onChange={(val) => setParams((prev) => ({ ...prev, erbschaft: val }))}
          einheit="€"
          step={10000}
          min={0}
        />

        <RechnerSelect
          label="Verwandtschaftsverhältnis"
          name="verwandtschaftsgrad"
          value={params.verwandtschaftsgrad.toString()}
          onChange={(val) => setParams((prev) => ({ ...prev, verwandtschaftsgrad: parseInt(val) }))}
          options={[
            { label: "Kind", value: "1" },
            { label: "Enkel", value: "2" },
            { label: "Großeltern", value: "3" },
            { label: "Geschwister", value: "4" },
            { label: "Sonstige", value: "5" },
          ]}
        />
      </div>

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox label="Erbschaftsteuer" value={euro(result.erbschaftsteuer)} highlight={true} />
            <RechnerResultBox label="Netto-Erbschaft" value={euro(result.nettoErbschaft)} />
          </div>

          <RechnerResultTable
            rows={[
              { label: "Erbsumme", value: euro(result.erbschaft) },
              { label: "Freibetrag", value: euro(result.freibetrag) },
              { label: "Steuerpflichtiger Betrag", value: euro(result.steuerpflichtiger_betrag) },
              { label: "Steuersatz", value: `${(result.steuersatz * 100).toFixed(0)}%` },
              { label: "Erbschaftsteuer", value: euro(result.erbschaftsteuer) },
              { label: "Netto-Erbschaft", value: euro(result.nettoErbschaft) },
            ]}
          />

          <RechnerHinweis>
            Dies ist eine vereinfachte Berechnung. Die tatsächliche Erbschaftsteuer kann durch
            weitere Faktoren und Freibeträge abweichen. Konsultieren Sie einen Steuerberater.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
