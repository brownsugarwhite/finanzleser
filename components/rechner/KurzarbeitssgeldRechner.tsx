"use client";

import { useState, useEffect } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type KurzarbeitssgeldParams, type KurzarbeitssgeldResult } from "@/lib/calculators/kurzarbeitsgeld";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";

export default function KurzarbeitssgeldRechner() {
  const [params, setParams] = useState<KurzarbeitssgeldParams>({
    regelmaessiges_gehalt: 3500,
    ausgefallene_stunden: 10,
    gesamtstunden_pro_woche: 40,
    monate: 6,
  });

  const [result, setResult] = useState<KurzarbeitssgeldResult | null>(null);

  const rates = useRates();

  useEffect(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Kurzarbeitsgeld-Rechner</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Regelm. Monatliches Gehalt"
          name="regelmaessiges_gehalt"
          value={params.regelmaessiges_gehalt}
          onChange={(val) => setParams((prev) => ({ ...prev, regelmaessiges_gehalt: val }))}
          einheit="€"
          step={100}
          min={0}
        />

        <RechnerInput
          label="Ausgefallene Stunden/Woche"
          name="ausgefallene_stunden"
          value={params.ausgefallene_stunden}
          onChange={(val) => setParams((prev) => ({ ...prev, ausgefallene_stunden: val }))}
          einheit="h"
          step={1}
          min={0}
        />

        <RechnerInput
          label="Arbeitszeit pro Woche"
          name="gesamtstunden_pro_woche"
          value={params.gesamtstunden_pro_woche}
          onChange={(val) => setParams((prev) => ({ ...prev, gesamtstunden_pro_woche: val }))}
          einheit="h"
          step={1}
          min={1}
        />

        <RechnerInput
          label="Dauer"
          name="monate"
          value={params.monate}
          onChange={(val) => setParams((prev) => ({ ...prev, monate: val }))}
          einheit="Monate"
          step={1}
          min={1}
        />
      </div>

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox label="Kurzarbeitsgeld/Monat" value={euro(result.kurzarbeitsgeld_monatlich)} highlight={true} />
            <RechnerResultBox label="Gesamt" value={euro(result.kurzarbeitsgeld_gesamt)} />
          </div>

          <RechnerResultTable
            rows={[
              { label: "Regelm. Gehalt", value: euro(result.regelmaessiges_gehalt) },
              { label: "Ausfallquote", value: `${(result.ausfallquote * 100).toFixed(0)}%` },
              { label: "Kurzarbeitsgeld (monatlich)", value: euro(result.kurzarbeitsgeld_monatlich) },
              { label: "Kurzarbeitsgeld (gesamt)", value: euro(result.kurzarbeitsgeld_gesamt) },
              { label: "Einkommensverlust", value: euro(result.einkommensverlust) },
            ]}
          />

          <RechnerHinweis>
            Kurzarbeitsgeld ersetzt 60% des wegfallenden Nettoentgelts. Voraussetzung: angemeldete
            Kurzarbeit bei der Agentur für Arbeit. Dies ist eine vereinfachte Berechnung.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
