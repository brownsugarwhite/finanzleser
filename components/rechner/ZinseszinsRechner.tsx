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
import RechnerPresets from "./ui/RechnerPresets";
import { useRechnerState } from "@/lib/hooks/useRechnerState";
import RechnerResults from "./ui/RechnerResults";

export default function ZinseszinsRechner() {
  const [params, setParams] = useState<ZinseszinsParams>({
    startkapital: 10000,
    monatlicheSparrate: 200,
    zinssatzPa: 5.0,
    laufzeitJahre: 10,
  });

  const [result, setResult] = useState<ZinseszinsResult | null>(null);
  const rechnerState = useRechnerState(params);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
    rechnerState.markCalculated();
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Zinseszinsrechner</h3>

      <RechnerPresets
        presets={[
          { label: "ETF-Sparplan", values: { startkapital: 1000, monatlicheSparrate: 200, zinssatzPa: 7, laufzeitJahre: 20 } },
          { label: "Tagesgeld", values: { startkapital: 10000, monatlicheSparrate: 0, zinssatzPa: 2.5, laufzeitJahre: 5 } },
          { label: "Altersvorsorge", values: { startkapital: 5000, monatlicheSparrate: 300, zinssatzPa: 6, laufzeitJahre: 30 } },
        ]}
        onApply={(v) => setParams((p) => ({ ...p, ...v }))}
      />

      <div className="rechner-inputs">
        <RechnerInput
          label="Startkapital"
          name="startkapital"
          value={params.startkapital}
          onChange={(val) => setParams((prev) => ({ ...prev, startkapital: val }))}
          einheit="€"
          step={1000}
          min={0}
          max={500000}
        />
        <RechnerInput
          label="Monatliche Sparrate"
          name="monatlicheSparrate"
          value={params.monatlicheSparrate}
          onChange={(val) => setParams((prev) => ({ ...prev, monatlicheSparrate: val }))}
          einheit="€"
          step={50}
          min={0}
          max={5000}
        />
        <RechnerInput
          label="Zinssatz p.a."
          name="zinssatzPa"
          value={params.zinssatzPa}
          onChange={(val) => setParams((prev) => ({ ...prev, zinssatzPa: val }))}
          einheit="%"
          step={0.1}
          min={0}
          max={15}
          slider
        />
        <RechnerInput
          label="Laufzeit"
          name="laufzeitJahre"
          value={params.laufzeitJahre}
          onChange={(val) => setParams((prev) => ({ ...prev, laufzeitJahre: val }))}
          einheit="Jahre"
          step={1}
          min={1}
          max={50}
        />
      <RechnerButton onClick={handleBerechnen} disabled={rechnerState.buttonDisabled} needsUpdate={rechnerState.needsUpdate} />

      </div>

      {result && (
        <RechnerResults scrollKey={rechnerState.scrollKey}>
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
        </RechnerResults>
      )}
    </div>
  );
}
