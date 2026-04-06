"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type TeilzeitParams, type TeilzeitResult } from "@/lib/calculators/teilzeit";
import { euro, prozent } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";
import RechnerResults from "./ui/RechnerResults";

const typLabels: Record<string, string> = {
  minijob: "Minijob",
  midijob: "Midijob (Gleitzone)",
  regulaer: "Regulaer versicherungspflichtig",
};

export default function TeilzeitRechner() {
  const [params, setParams] = useState<TeilzeitParams>({
    stundenlohn: 15,
    wochenstunden: 20,
    vollzeitStundenWoche: 40,
  });

  const [result, setResult] = useState<TeilzeitResult | null>(null);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Teilzeit-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Stundenlohn"
          name="stundenlohn"
          value={params.stundenlohn}
          onChange={(val) => setParams((prev) => ({ ...prev, stundenlohn: val }))}
          einheit="€/Std."
          step={0.50}
          min={0}
        />

        <RechnerInput
          label="Wochenstunden (Teilzeit)"
          name="wochenstunden"
          value={params.wochenstunden}
          onChange={(val) => setParams((prev) => ({ ...prev, wochenstunden: val }))}
          einheit="Std./Woche"
          step={1}
          min={1}
          max={60}
        />

        <RechnerInput
          label="Vollzeit-Wochenstunden"
          name="vollzeitStundenWoche"
          value={params.vollzeitStundenWoche}
          onChange={(val) => setParams((prev) => ({ ...prev, vollzeitStundenWoche: val }))}
          einheit="Std./Woche"
          step={1}
          min={1}
          max={60}
        />
      </div>

      <RechnerButton onClick={handleBerechnen} />

      {result && (
        <RechnerResults>
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Brutto monatlich"
              value={euro(result.bruttoMonatlich)}
              highlight={true}
            />
            <RechnerResultBox
              label="Teilzeitquote"
              value={prozent(result.teilzeitProzent)}
            />
            <RechnerResultBox
              label="Netto-Schaetzung"
              value={euro(result.nettoSchaetzung)}
            />
          </div>

          <RechnerResultTable
            rows={[
              { label: "Stundenlohn", value: `${result.stundenlohn.toFixed(2)} €/Std.` },
              { label: "Wochenstunden (Teilzeit)", value: `${result.wochenstunden} Std.` },
              { label: "Vollzeit-Wochenstunden", value: `${result.vollzeitStundenWoche} Std.` },
              { label: "Teilzeitquote", value: prozent(result.teilzeitProzent) },
              { label: "Monatsstunden (Ø)", value: `${result.monatsStunden.toFixed(1)} Std.` },
              { label: "Brutto monatlich", value: euro(result.bruttoMonatlich) },
              { label: "Beschaeftigungstyp", value: typLabels[result.typ] || result.typ },
              { label: "Netto-Schaetzung", value: euro(result.nettoSchaetzung) },
              { label: "Mindestlohn konform", value: result.mindestlohnKonform ? "Ja" : "Nein" },
            ]}
          />

          <RechnerHinweis>
            Die Netto-Schaetzung ist vereinfacht und beruecksichtigt pauschalierte SV-Abzuege.
            Die tatsaechliche Netto-Differenz haengt von Steuerklasse, Kirchensteuer und
            Kinderfreibetraegen ab. Bei Einkommen unter der Midijob-Grenze gelten reduzierte
            SV-Beitraege (SS 20 Abs. 2 SGB IV).
          </RechnerHinweis>
        </RechnerResults>
      )}
    </div>
  );
}
