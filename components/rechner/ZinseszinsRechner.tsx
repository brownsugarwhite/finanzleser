"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type ZinseszinsParams, type ZinseszinsResult } from "@/lib/calculators/zinseszins";
import { euro, prozent } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerMultiColumnTable from "./ui/RechnerMultiColumnTable";
import RechnerButton from "./ui/RechnerButton";

export default function ZinseszinsRechner() {
  const [params, setParams] = useState<ZinseszinsParams>({
    startkapital: 10000,
    monatlicheSparrate: 200,
    zinssatzPa: 5.0,
    laufzeitJahre: 10,
  });

  const [result, setResult] = useState<ZinseszinsResult | null>(null);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Zinseszinsrechner</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Startkapital"
          name="startkapital"
          value={params.startkapital}
          onChange={(val) => setParams((prev) => ({ ...prev, startkapital: val }))}
          einheit="€"
          step={1000}
          min={0}
        />
        <RechnerInput
          label="Monatliche Sparrate"
          name="monatlicheSparrate"
          value={params.monatlicheSparrate}
          onChange={(val) => setParams((prev) => ({ ...prev, monatlicheSparrate: val }))}
          einheit="€"
          step={50}
          min={0}
        />
        <RechnerInput
          label="Zinssatz p.a."
          name="zinssatzPa"
          value={params.zinssatzPa}
          onChange={(val) => setParams((prev) => ({ ...prev, zinssatzPa: val }))}
          einheit="%"
          step={0.1}
          min={0}
        />
        <RechnerInput
          label="Laufzeit"
          name="laufzeitJahre"
          value={params.laufzeitJahre}
          onChange={(val) => setParams((prev) => ({ ...prev, laufzeitJahre: val }))}
          einheit="Jahre"
          step={1}
          min={1}
        />
      </div>

      <RechnerButton onClick={handleBerechnen} />

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox label="Endkapital" value={euro(result.endkapital)} highlight />
            <RechnerResultBox label="Einzahlungen" value={euro(result.gesamtEinzahlungen)} />
            <RechnerResultBox label="Zinserträge" value={euro(result.gesamtZinsertraege)} variant="positive" />
          </div>

          <RechnerResultTable
            rows={[
              { label: "Startkapital", value: euro(params.startkapital) },
              { label: "Monatliche Sparrate", value: euro(params.monatlicheSparrate) },
              { label: "Zinssatz p.a.", value: prozent(params.zinssatzPa) },
              { label: "Laufzeit", value: `${params.laufzeitJahre} Jahre` },
              { label: "Gesamteinzahlungen", value: euro(result.gesamtEinzahlungen) },
              { label: "Zinserträge", value: euro(result.gesamtZinsertraege) },
              { label: "Endkapital", value: euro(result.endkapital) },
            ]}
          />

          <h4 className="rechner-result-section-title">Jahresübersicht</h4>
          <RechnerMultiColumnTable
            columns={[
              { key: "jahr", label: "Jahr" },
              { key: "kapital", label: "Kapital", align: "right" },
              { key: "einzahlungen", label: "Einzahlungen", align: "right" },
              { key: "zinsertraege", label: "Zinserträge", align: "right" },
            ]}
            rows={result.jahresplan.map((row) => ({
              jahr: String(row.jahr),
              kapital: euro(row.kapital),
              einzahlungen: euro(row.einzahlungen),
              zinsertraege: euro(row.zinsertraege),
            }))}
          />

          <RechnerHinweis>
            Der Zinseszinseffekt zeigt, wie Zinsen auf Zinsen wachsen. Die Berechnung
            geht von einer jährlichen Verzinsung aus.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
