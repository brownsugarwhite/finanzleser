"use client";

import { useState, useEffect } from "react";
import { useRates } from "@/lib/hooks/useRates";
import {
  berechne,
  type BafoegParams,
  type BafoegResult
} from "@/lib/calculators/bafoeg";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerSelect from "./ui/RechnerSelect";
import RechnerCheckbox from "./ui/RechnerCheckbox";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";

export default function BafoegRechner() {
  const [params, setParams] = useState<BafoegParams>({
    wohnform: "extern",
    eigenes_einkommen: 0,
    eltern_einkommen: 3000,
    eltern_alleinstehend: false,
    geschwister_in_ausbildung: 0,
    krankenversicherung: "gesetzlich"
  });

  const [result, setResult] = useState<BafoegResult | null>(null);
  const rates = useRates();

  useEffect(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  const handleParamChange = (key: keyof BafoegParams, value: any) => {
    setParams((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">BAföG-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerSelect
          label="Wohnform"
          name="wohnform"
          value={params.wohnform}
          onChange={(val) => handleParamChange("wohnform", val as "eltern" | "extern")}
          options={[
            { value: "eltern", label: "Bei den Eltern wohnhaft" },
            { value: "extern", label: "Auswärts (Miete)" }
          ]}
        />

        <RechnerInput
          label="Eigenes monatliches Einkommen"
          name="eigenes_einkommen"
          value={params.eigenes_einkommen}
          onChange={(val) => handleParamChange("eigenes_einkommen", val)}
          einheit="€"
          min={0}
        />

        <RechnerInput
          label="Eltern monatliches Nettoeinkommen"
          name="eltern_einkommen"
          value={params.eltern_einkommen}
          onChange={(val) => handleParamChange("eltern_einkommen", val)}
          einheit="€"
          min={0}
        />

        <RechnerCheckbox
          label="Eltern sind alleinstehend"
          name="eltern_alleinstehend"
          checked={params.eltern_alleinstehend}
          onChange={(val) => handleParamChange("eltern_alleinstehend", val)}
        />

        <RechnerSelect
          label="Krankenversicherung"
          name="krankenversicherung"
          value={params.krankenversicherung}
          onChange={(val) => handleParamChange("krankenversicherung", val as "gesetzlich" | "privat" | "keine")}
          options={[
            { value: "gesetzlich", label: "Gesetzlich versichert" },
            { value: "privat", label: "Privat versichert" },
            { value: "keine", label: "Keine Krankenversicherung" }
          ]}
        />
      </div>

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            {result.hat_anspruch ? (
              <>
                <RechnerResultBox
                  label="BAföG-Anspruch / Monat"
                  value={euro(result.bafoeg)}
                  highlight={true}
                />
                <RechnerResultBox
                  label="davon Zuschuss"
                  value={euro(result.zuschuss)}
                  highlight={false}
                />
              </>
            ) : (
              <RechnerResultBox
                label="Kein BAföG-Anspruch"
                value="Einkommen zu hoch"
                highlight={false}
              />
            )}
          </div>

          {result.hat_anspruch && (
            <>
              <h4 className="rechner-result-section-title">Details</h4>
              <RechnerResultTable
                rows={[
                  { label: "Bedarfssatz", value: euro(result.bedarf) },
                  { label: "Anrechenbares Einkommen", value: `−${euro(result.gesamt_anrechenbar)}` }
                ]}
                footer={{ label: "BAföG-Anspruch", value: euro(result.bafoeg) }}
              />
            </>
          )}

          <RechnerHinweis>
            BAföG wird zur Hälfte als Zuschuss, zur Hälfte als zinsloses Darlehen gewährt.
            Grundlage: Bundesausbildungsförderungsgesetz (BAföG).
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
