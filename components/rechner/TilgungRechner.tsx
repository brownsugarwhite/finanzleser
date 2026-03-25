"use client";

import { useState, useEffect } from "react";
import { berechne, type TilgungParams, type TilgungResult } from "@/lib/calculators/tilgung";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";

export default function TilgungRechner() {
  const [params, setParams] = useState<TilgungParams>({
    schuldsumme: 200000,
    laufzeitMonate: 240,
    jahreszins: 3.5,
  });

  const [result, setResult] = useState<TilgungResult | null>(null);

  useEffect(() => {
    setResult(berechne(params));
  }, [params]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Tilgungsrechner</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Kreditbetrag"
          name="schuldsumme"
          value={params.schuldsumme}
          onChange={(val) => setParams((prev) => ({ ...prev, schuldsumme: val }))}
          einheit="€"
          step={5000}
          min={0}
        />

        <RechnerInput
          label="Laufzeit"
          name="laufzeitMonate"
          value={params.laufzeitMonate}
          onChange={(val) => setParams((prev) => ({ ...prev, laufzeitMonate: val }))}
          einheit="Monate"
          step={12}
          min={1}
        />

        <RechnerInput
          label="Jahreszins"
          name="jahreszins"
          value={params.jahreszins}
          onChange={(val) => setParams((prev) => ({ ...prev, jahreszins: val }))}
          einheit="%"
          step={0.1}
          min={0}
        />
      </div>

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox label="Monatsrate" value={euro(result.monatsrate)} highlight={true} />
            <RechnerResultBox label="Gesamtzinsen" value={euro(result.gesamtzins)} />
          </div>

          <RechnerResultTable
            rows={[
              { label: "Kreditbetrag", value: euro(result.schuldsumme) },
              { label: "Laufzeit", value: `${result.laufzeitMonate} Monate` },
              { label: "Jahreszins", value: `${result.jahreszins.toFixed(2)}%` },
              { label: "Monatsrate", value: euro(result.monatsrate) },
              { label: "Gesamtzinsen", value: euro(result.gesamtzins) },
            ]}
          />

          <RechnerHinweis>
            Dies ist eine vereinfachte Berechnung. Tatsächliche Kreditkonditionen können abhängig
            von Kreditgeber und Bonität unterschiedlich sein.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
