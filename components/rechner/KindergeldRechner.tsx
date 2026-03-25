"use client";

import { useState, useEffect } from "react";
import { berechne, type KindergeldParams, type KindergeldResult } from "@/lib/calculators/kindergeld";
import { euro } from "@/lib/calculators/utils";
import RechnerSelect from "./ui/RechnerSelect";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";

export default function KindergeldRechner() {
  const [params, setParams] = useState<KindergeldParams>({
    kinder: 2,
  });

  const [result, setResult] = useState<KindergeldResult | null>(null);

  useEffect(() => {
    setResult(berechne(params));
  }, [params]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Kindergeld-Rechner</h3>

      <div className="rechner-inputs">
        <RechnerSelect
          label="Anzahl Kinder"
          name="kinder"
          value={params.kinder.toString()}
          onChange={(val) => setParams({ kinder: parseInt(val) })}
          options={Array.from({ length: 11 }, (_, i) => ({
            label: i.toString(),
            value: i.toString(),
          }))}
        />
      </div>

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox label="Pro Kind/Monat" value={euro(result.kindergeldProKind)} />
            <RechnerResultBox label="Monatlich gesamt" value={euro(result.gesamtKindergeld)} highlight={true} />
            <RechnerResultBox label="Jährlich" value={euro(result.jaehrlich)} />
          </div>

          <RechnerResultTable
            rows={[
              { label: "Anzahl berechtigter Kinder", value: result.kinder.toString() },
              { label: "Kindergeld pro Kind (monatlich)", value: euro(result.kindergeldProKind) },
              { label: "Gesamtkindergeld (monatlich)", value: euro(result.gesamtKindergeld) },
              { label: "Gesamtkindergeld (jährlich)", value: euro(result.jaehrlich) },
            ]}
          />

          <RechnerHinweis>
            Kindergeld wird für jedes Kind bis zur Vollendung des 18. Lebensjahres gezahlt
            (unter Umständen bis 27 Jahre bei Ausbildung/Studium).
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
