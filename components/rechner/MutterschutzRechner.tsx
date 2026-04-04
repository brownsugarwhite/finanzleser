"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type MutterschutzParams, type MutterschutzResult } from "@/lib/calculators/mutterschutz";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerSelect from "./ui/RechnerSelect";
import RechnerCheckbox from "./ui/RechnerCheckbox";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";

export default function MutterschutzRechner() {
  const now = new Date();
  const defaultMonth = now.getMonth() + 3 > 12 ? (now.getMonth() + 3) - 12 : now.getMonth() + 3;
  const defaultYear = now.getMonth() + 3 > 12 ? now.getFullYear() + 1 : now.getFullYear();

  const [params, setParams] = useState<MutterschutzParams>({
    entbindungYear: defaultYear,
    entbindungMonth: defaultMonth,
    entbindungDay: 15,
    monatsNetto: 2500,
    istGKV: true,
  });

  const [result, setResult] = useState<MutterschutzResult | null>(null);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Mutterschutz-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Entbindungstermin: Jahr"
          name="entbindungYear"
          value={params.entbindungYear}
          onChange={(val) => setParams((p) => ({ ...p, entbindungYear: val }))}
          min={2024}
          max={2030}
        />

        <RechnerSelect
          label="Monat"
          name="entbindungMonth"
          value={params.entbindungMonth.toString()}
          onChange={(val) => setParams((p) => ({ ...p, entbindungMonth: parseInt(val) }))}
          options={Array.from({ length: 12 }, (_, i) => ({
            label: `${i + 1}`,
            value: `${i + 1}`,
          }))}
        />

        <RechnerInput
          label="Tag"
          name="entbindungDay"
          value={params.entbindungDay}
          onChange={(val) => setParams((p) => ({ ...p, entbindungDay: val }))}
          min={1}
          max={31}
        />

        <RechnerInput
          label="Monatliches Nettoeinkommen"
          name="monatsNetto"
          value={params.monatsNetto}
          onChange={(val) => setParams((p) => ({ ...p, monatsNetto: val }))}
          einheit="€"
          step={100}
          min={0}
        />

        <RechnerCheckbox
          label="Gesetzlich krankenversichert (GKV)"
          name="istGKV"
          checked={params.istGKV}
          onChange={(val) => setParams((p) => ({ ...p, istGKV: val }))}
        />
      </div>

      <RechnerButton onClick={handleBerechnen} />

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Gesamtleistung"
              value={euro(result.gesamtLeistung)}
              highlight
            />
            <RechnerResultBox
              label="Tagessatz gesamt"
              value={euro(result.gesamtTagessatz)}
            />
          </div>

          <h4 className="rechner-result-section-title">Schutzfristen</h4>
          <RechnerResultTable
            rows={[
              { label: "Schutzfrist von", value: result.schutzfristVon },
              { label: "Schutzfrist bis", value: result.schutzfristBis },
              { label: "Schutztage gesamt", value: `${result.schutzTageGesamt} Tage` },
            ]}
          />

          <h4 className="rechner-result-section-title">Mutterschaftsgeld</h4>
          <RechnerResultTable
            rows={[
              { label: "Krankenkasse pro Tag", value: euro(result.mutterschaftsgeldTag) },
              { label: "Arbeitgeberzuschuss pro Tag", value: euro(result.arbeitgeberZuschussTag) },
              { label: "Krankenkasse gesamt", value: euro(result.gesamtMutterschaftsgeld) },
              { label: "Arbeitgeberzuschuss gesamt", value: euro(result.gesamtArbeitgeberzuschuss) },
            ]}
            footer={{ label: "Gesamtleistung", value: euro(result.gesamtLeistung) }}
          />

          <RechnerHinweis>
            Die Krankenkasse zahlt max. 13 EUR/Tag. Der Arbeitgeber stockt die Differenz
            zum durchschnittlichen Nettolohn auf. Grundlage: MuSchG 2026.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
