"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type KreditParams, type KreditResult } from "@/lib/calculators/kredit";
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

export default function KreditRechner() {
  const [params, setParams] = useState<KreditParams>({
    kreditsumme: 10000,
    laufzeitMonate: 48,
    jahreszins: 5.0,
  });

  const [result, setResult] = useState<KreditResult | null>(null);
  const rechnerState = useRechnerState(params);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
    rechnerState.markCalculated();
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Kreditrechner</h3>

      <RechnerPresets
        presets={[
          { label: "Autokredit", values: { kreditsumme: 20000, laufzeitMonate: 60, jahreszins: 5.5 } },
          { label: "Ratenkredit", values: { kreditsumme: 10000, laufzeitMonate: 48, jahreszins: 6.5 } },
          { label: "Modernisierung", values: { kreditsumme: 50000, laufzeitMonate: 120, jahreszins: 4.5 } },
        ]}
        onApply={(v) => setParams((p) => ({ ...p, ...v }))}
      />

      <div className="rechner-inputs">
        <RechnerInput
          label="Kreditsumme"
          name="kreditsumme"
          value={params.kreditsumme}
          onChange={(val) => setParams((prev) => ({ ...prev, kreditsumme: val }))}
          einheit="€"
          step={500}
          min={100}
          max={500000}
        />
        <RechnerInput
          label="Laufzeit"
          name="laufzeitMonate"
          value={params.laufzeitMonate}
          onChange={(val) => setParams((prev) => ({ ...prev, laufzeitMonate: val }))}
          einheit="Monate"
          step={6}
          min={6}
          max={360}
        />
        <RechnerInput
          label="Jahreszins"
          name="jahreszins"
          value={params.jahreszins}
          onChange={(val) => setParams((prev) => ({ ...prev, jahreszins: val }))}
          einheit="%"
          step={0.1}
          min={0}
          max={15}
          slider
        />
      <RechnerButton onClick={handleBerechnen} disabled={rechnerState.buttonDisabled} needsUpdate={rechnerState.needsUpdate} />

      </div>

      {result && (
        <RechnerResults scrollKey={rechnerState.scrollKey}>
          <div className="rechner-result-boxes">
            <RechnerResultBox label="Monatsrate" value={euro(result.monatsrate)} highlight />
            <RechnerResultBox label="Gesamtzinsen" value={euro(result.gesamtzinsen)} />
            <RechnerResultBox label="Gesamtbetrag" value={euro(result.gesamtbetrag)} />
          </div>

          <RechnerResultTable
            rows={[
              { label: "Kreditsumme", value: euro(params.kreditsumme) },
              { label: "Laufzeit", value: `${params.laufzeitMonate} Monate` },
              { label: "Jahreszins", value: prozent(params.jahreszins) },
              { label: "Effektivzins", value: prozent(result.effektivzins) },
              { label: "Monatsrate", value: euro(result.monatsrate) },
              { label: "Gesamtzinsen", value: euro(result.gesamtzinsen) },
              { label: "Gesamtbetrag", value: euro(result.gesamtbetrag) },
            ]}
          />

          <h4 className="rechner-result-section-title">Tilgungsplan</h4>
          <RechnerMultiColumnTable
            columns={[
              { key: "monat", label: "Monat" },
              { key: "zinsen", label: "Zinsen", align: "right" },
              { key: "tilgung", label: "Tilgung", align: "right" },
              { key: "restschuld", label: "Restschuld", align: "right" },
            ]}
            rows={result.tilgungsplan.map((row) => ({
              monat: String(row.monat),
              zinsen: euro(row.zinsen),
              tilgung: euro(row.tilgung),
              restschuld: euro(row.restschuld),
            }))}
          />

          <RechnerHinweis>
            Diese Berechnung erfolgt ohne Gewähr und stellt nur eine Näherung dar.
            Gebühren, Provisionen und weitere Kosten sind nicht enthalten.
          </RechnerHinweis>
        </RechnerResults>
      )}
    </div>
  );
}
