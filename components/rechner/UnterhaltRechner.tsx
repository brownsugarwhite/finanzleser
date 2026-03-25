"use client";

import { useState, useEffect } from "react";
import { berechne, type UnterhaltParams, type UnterhaltResult } from "@/lib/calculators/unterhalt";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerSelect from "./ui/RechnerSelect";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";

export default function UnterhaltRechner() {
  const [params, setParams] = useState<UnterhaltParams>({
    kinderanzahl: 1,
    nettoeinkommen: 3000,
  });

  const [result, setResult] = useState<UnterhaltResult | null>(null);

  useEffect(() => {
    setResult(berechne(params));
  }, [params]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Unterhalts-Rechner</h3>

      <div className="rechner-inputs">
        <RechnerSelect
          label="Anzahl Kinder"
          name="kinderanzahl"
          value={params.kinderanzahl.toString()}
          onChange={(val) => setParams((prev) => ({ ...prev, kinderanzahl: parseInt(val) }))}
          options={Array.from({ length: 6 }, (_, i) => ({
            label: (i + 1).toString(),
            value: (i + 1).toString(),
          }))}
        />

        <RechnerInput
          label="Nettoeinkommen"
          name="nettoeinkommen"
          value={params.nettoeinkommen}
          onChange={(val) => setParams((prev) => ({ ...prev, nettoeinkommen: val }))}
          einheit="€"
          step={100}
          min={0}
        />
      </div>

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox label="Unterhalt pro Kind/Monat" value={euro(result.monatlicherUnterhalt)} highlight={true} />
            <RechnerResultBox label="Gesamt pro Monat" value={euro(result.monatlicherUnterhalt * result.kinderanzahl)} />
          </div>

          <RechnerResultTable
            rows={[
              { label: "Kinderanzahl", value: result.kinderanzahl.toString() },
              { label: "Nettoeinkommen", value: euro(result.nettoeinkommen) },
              { label: "Unterhaltsquote", value: `${(result.unterhaltsquote * 100).toFixed(1)}%` },
              { label: "Unterhalt pro Kind (monatlich)", value: euro(result.monatlicherUnterhalt) },
              { label: "Unterhalt pro Kind (jährlich)", value: euro(result.jaehrlichUnterhalt) },
            ]}
          />

          <RechnerHinweis>
            Basis: Düsseldorf-Tabelle (vereinfacht). Die tatsächliche Unterhalts­verpflichtung hängt
            von vielen Faktoren ab (Selbstbehalt, weitere Kinder, Vermögen). Konsultieren Sie einen
            Rechtsanwalt oder das Jugendamt.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
