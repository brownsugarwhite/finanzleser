"use client";

import { useState, useEffect } from "react";
import { berechne, type WohngeldParams, type WohngeldResult } from "@/lib/calculators/wohngeld";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerSelect from "./ui/RechnerSelect";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";

export default function WohngeldRechner() {
  const [params, setParams] = useState<WohngeldParams>({
    miete: 800,
    haushaltsmitglieder: 2,
  });

  const [result, setResult] = useState<WohngeldResult | null>(null);

  useEffect(() => {
    setResult(berechne(params));
  }, [params]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Wohngeld-Rechner</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Monatliche Miete"
          name="miete"
          value={params.miete}
          onChange={(val) => setParams((prev) => ({ ...prev, miete: val }))}
          einheit="€"
          step={50}
          min={0}
        />

        <RechnerSelect
          label="Haushaltsmitglieder"
          name="haushaltsmitglieder"
          value={params.haushaltsmitglieder.toString()}
          onChange={(val) => setParams((prev) => ({ ...prev, haushaltsmitglieder: parseInt(val) }))}
          options={Array.from({ length: 6 }, (_, i) => ({
            label: (i + 1).toString(),
            value: (i + 1).toString(),
          }))}
        />
      </div>

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox label="Monatliches Wohngeld" value={euro(result.monatlich)} highlight={true} />
            <RechnerResultBox label="Jährlich" value={euro(result.jaehrlich)} />
          </div>

          <RechnerResultTable
            rows={[
              { label: "Monatliche Miete", value: euro(result.miete) },
              { label: "Haushaltsmitglieder", value: result.haushaltsmitglieder.toString() },
              { label: "Monatliches Wohngeld", value: euro(result.monatlich) },
              { label: "Jährliches Wohngeld", value: euro(result.jaehrlich) },
            ]}
          />

          <RechnerHinweis>
            Dies ist eine vereinfachte Berechnung. Der tatsächliche Wohngeldanspruch hängt von
            Einkommen, Vermögen und regional unterschiedlichen Höchstmieten ab. Wenden Sie sich
            an Ihre Gemeinde für exakte Informationen.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
