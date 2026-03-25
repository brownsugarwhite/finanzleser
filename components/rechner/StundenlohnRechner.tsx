"use client";

import { useState, useEffect } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type StundenlohnParams, type StundenlohnResult } from "@/lib/calculators/stundenlohn";
import { euro } from "@/lib/calculators/utils";
import RechnerSelect from "./ui/RechnerSelect";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";

export default function StundenlohnRechner() {
  const [params, setParams] = useState<StundenlohnParams>({
    stunden: 40,
    stundenumfang: "vollzeit",
  });

  const [result, setResult] = useState<StundenlohnResult | null>(null);

  const rates = useRates();

  useEffect(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Stundenlohn-Rechner</h3>

      <div className="rechner-inputs">
        <RechnerSelect
          label="Beschäftigungsumfang"
          name="stundenumfang"
          value={params.stundenumfang}
          onChange={(val) =>
            setParams((prev) => ({ ...prev, stundenumfang: val as "vollzeit" | "teilzeit" | "custom" }))
          }
          options={[
            { label: "Vollzeit (40h/Woche)", value: "vollzeit" },
            { label: "Teilzeit (20h/Woche)", value: "teilzeit" },
            { label: "Benutzerdefiniert", value: "custom" },
          ]}
        />

        {params.stundenumfang === "custom" && (
          <RechnerInput
            label="Stunden pro Woche"
            name="stunden"
            value={params.stunden}
            onChange={(val) => setParams((prev) => ({ ...prev, stunden: val }))}
            einheit="h/Woche"
            step={1}
            min={1}
          />
        )}
      </div>

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox label="Mindestlohn" value={`${result.mindestlohn}€/h`} />
            <RechnerResultBox label="Wocheneinkommen" value={euro(result.einkommenWoche)} />
            <RechnerResultBox label="Monatseinkommen" value={euro(result.einkommenMonat)} highlight={true} />
          </div>

          <RechnerResultTable
            rows={[
              { label: "Mindestlohn", value: `${result.mindestlohn}€ pro Stunde` },
              { label: "Stunden pro Woche", value: `${result.stundenWoche}h` },
              { label: "Stunden pro Monat (Ø)", value: `${result.stundenMonat}h` },
              { label: "Wocheneinkommen", value: euro(result.einkommenWoche) },
              { label: "Monatseinkommen", value: euro(result.einkommenMonat) },
            ]}
          />

          <RechnerHinweis>
            Berechnung basiert auf dem bundesweiten Mindestlohn 2026 ({result.mindestlohn}€/h).
            Actual income may vary based on specific agreements.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
