"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type WohngeldParams, type WohngeldResult } from "@/lib/calculators/wohngeld";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerSelect from "./ui/RechnerSelect";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";
import RechnerResults from "./ui/RechnerResults";

export default function WohngeldRechner() {
  const [params, setParams] = useState<WohngeldParams>({
    haushaltsmitglieder: 3,
    bruttoMiete: 600,
    mietenstufe: 3,
    monatsEinkommen: 2000,
  });

  const [result, setResult] = useState<WohngeldResult | null>(null);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Wohngeld-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerSelect
          label="Haushaltsmitglieder"
          name="haushaltsmitglieder"
          value={params.haushaltsmitglieder.toString()}
          onChange={(val) => setParams((p) => ({ ...p, haushaltsmitglieder: parseInt(val) }))}
          options={Array.from({ length: 12 }, (_, i) => ({
            label: `${i + 1} ${i === 0 ? "Person" : "Personen"}`,
            value: (i + 1).toString(),
          }))}
        />

        <RechnerInput
          label="Bruttokaltmiete inkl. Nebenkosten"
          name="bruttoMiete"
          value={params.bruttoMiete}
          onChange={(val) => setParams((p) => ({ ...p, bruttoMiete: val }))}
          einheit="€"
          step={50}
          min={0}
        />

        <RechnerSelect
          label="Mietenstufe"
          name="mietenstufe"
          value={params.mietenstufe.toString()}
          onChange={(val) => setParams((p) => ({ ...p, mietenstufe: parseInt(val) }))}
          options={[
            { value: "1", label: "Stufe I (niedrig)" },
            { value: "2", label: "Stufe II" },
            { value: "3", label: "Stufe III" },
            { value: "4", label: "Stufe IV" },
            { value: "5", label: "Stufe V" },
            { value: "6", label: "Stufe VI" },
            { value: "7", label: "Stufe VII (hoch)" },
          ]}
        />

        <RechnerInput
          label="Monatliches Gesamteinkommen"
          name="monatsEinkommen"
          value={params.monatsEinkommen}
          onChange={(val) => setParams((p) => ({ ...p, monatsEinkommen: val }))}
          einheit="€"
          step={100}
          min={0}
        />
      </div>

      <RechnerButton onClick={handleBerechnen} />

      {result && (
        <RechnerResults>
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Wohngeld monatlich"
              value={euro(result.wohngeldMonatlich)}
              highlight
            />
            <RechnerResultBox
              label="Wohngeld jaehrlich"
              value={euro(result.wohngeldJaehrlich)}
            />
          </div>

          <RechnerResultTable
            rows={[
              { label: "Anrechenbare Miete (M)", value: euro(result.anrechenbareMiete) },
              { label: "Hoechstbetrag (Anlage 1)", value: euro(result.hoechstbetrag) },
              { label: "Angerechnetes Einkommen (Y)", value: euro(result.monatsEinkommen) },
              { label: "Wohngeld / Monat", value: euro(result.wohngeldMonatlich) },
              { label: "Wohngeld / Jahr", value: euro(result.wohngeldJaehrlich) },
            ]}
          />

          <RechnerHinweis>
            Berechnung nach WoGG-Formel: W = 1,15 x (M - (a + b*M + c*Y) * Y).
            Die Mietenstufe haengt vom Wohnort ab (Stufe I = guenstig, VII = teuer).
            Grundlage: WoGG mit Anlagen 1-3, inkl. Klimakomponente.
          </RechnerHinweis>
        </RechnerResults>
      )}
    </div>
  );
}
