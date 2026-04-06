"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type ElternzeitParams, type ElternzeitResult } from "@/lib/calculators/elternzeit";
import RechnerInput from "./ui/RechnerInput";
import RechnerSelect from "./ui/RechnerSelect";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";
import { useRechnerState } from "@/lib/hooks/useRechnerState";
import RechnerResults from "./ui/RechnerResults";

export default function ElternzeitRechner() {
  const now = new Date();

  const [params, setParams] = useState<ElternzeitParams>({
    geburtYear: now.getFullYear(),
    geburtMonth: now.getMonth() + 1,
    partnerMonate: 0,
    uebertragMonateSpater: 0,
  });

  const [result, setResult] = useState<ElternzeitResult | null>(null);
  const rechnerState = useRechnerState(params);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
    rechnerState.markCalculated();
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Elternzeit-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Geburtsjahr des Kindes"
          name="geburtYear"
          value={params.geburtYear}
          onChange={(val) => setParams((p) => ({ ...p, geburtYear: val }))}
          min={2020}
          max={2030}
        />

        <RechnerSelect
          label="Geburtsmonat"
          name="geburtMonth"
          value={params.geburtMonth.toString()}
          onChange={(val) => setParams((p) => ({ ...p, geburtMonth: parseInt(val) }))}
          options={[
            { value: "1", label: "Januar" },
            { value: "2", label: "Februar" },
            { value: "3", label: "Maerz" },
            { value: "4", label: "April" },
            { value: "5", label: "Mai" },
            { value: "6", label: "Juni" },
            { value: "7", label: "Juli" },
            { value: "8", label: "August" },
            { value: "9", label: "September" },
            { value: "10", label: "Oktober" },
            { value: "11", label: "November" },
            { value: "12", label: "Dezember" },
          ]}
        />

        <RechnerSelect
          label="Partnermonate"
          name="partnerMonate"
          value={params.partnerMonate.toString()}
          onChange={(val) => setParams((p) => ({ ...p, partnerMonate: parseInt(val) }))}
          options={Array.from({ length: 15 }, (_, i) => ({
            label: `${i} Monate`,
            value: i.toString(),
          }))}
        />

        <RechnerSelect
          label="Monate auf spaeter uebertragen"
          name="uebertragMonateSpater"
          value={params.uebertragMonateSpater.toString()}
          onChange={(val) => setParams((p) => ({ ...p, uebertragMonateSpater: parseInt(val) }))}
          options={Array.from({ length: 13 }, (_, i) => ({
            label: `${i} Monate`,
            value: i.toString(),
          }))}
        />
      <RechnerButton onClick={handleBerechnen} disabled={rechnerState.buttonDisabled} needsUpdate={rechnerState.needsUpdate} />

      </div>

      {result && (
        <RechnerResults scrollKey={rechnerState.scrollKey}>
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Erster Abschnitt"
              value={`${result.monateErsterAbschnitt} Monate`}
              highlight
            />
            <RechnerResultBox
              label="Spaeter nutzbar"
              value={`${result.monateSpater} Monate`}
            />
          </div>

          <RechnerResultTable
            rows={[
              { label: "Maximale Elternzeit", value: `${result.maxMonate} Monate` },
              { label: "Anmeldefrist", value: `${result.anmeldeFristWochen} Wochen vorher` },
              { label: "Ende Mutterschutz", value: result.schutzEnde },
              { label: "Elternzeit ab", value: result.elternzeitStart },
              { label: "Ende erster Abschnitt", value: result.elternzeitEnde },
              { label: "Partnermonate", value: `${result.partnerMonate} Monate` },
            ]}
          />

          <RechnerHinweis>
            Elternzeit betraegt max. 36 Monate pro Kind (beide Elternteile gemeinsam).
            Bis zu 24 Monate koennen auf den Zeitraum bis zum 8. Geburtstag uebertragen werden.
            Anmeldung mind. 7 Wochen vor Beginn. Grundlage: BEEG 2026.
          </RechnerHinweis>
        </RechnerResults>
      )}
    </div>
  );
}
