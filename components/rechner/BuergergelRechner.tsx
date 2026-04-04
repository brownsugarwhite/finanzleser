"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import {
  berechne,
  type BuergergeldParams,
  type BuergergeldResult,
  type HaushaltTyp,
} from "@/lib/calculators/buergergeld";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerSelect from "./ui/RechnerSelect";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";

export default function BuergergelRechner() {
  const [params, setParams] = useState<BuergergeldParams>({
    haushaltTyp: "alleinstehend",
    anzahlKinder06: 0,
    anzahlKinder713: 0,
    anzahlKinder1417: 0,
    eigenesEinkommen: 0,
  });

  const [result, setResult] = useState<BuergergeldResult | null>(null);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Buergergeld-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerSelect
          label="Haushaltstyp"
          name="haushaltTyp"
          value={params.haushaltTyp}
          onChange={(val) => setParams((p) => ({ ...p, haushaltTyp: val as HaushaltTyp }))}
          options={[
            { value: "alleinstehend", label: "Alleinstehend" },
            { value: "paar", label: "Paar ohne Kinder" },
            { value: "alleinerziehend_kinder", label: "Alleinerziehend mit Kindern" },
            { value: "paar_kinder", label: "Paar mit Kindern" },
          ]}
        />

        <RechnerSelect
          label="Kinder 0-6 Jahre"
          name="anzahlKinder06"
          value={params.anzahlKinder06.toString()}
          onChange={(val) => setParams((p) => ({ ...p, anzahlKinder06: parseInt(val) }))}
          options={Array.from({ length: 6 }, (_, i) => ({
            label: i.toString(),
            value: i.toString(),
          }))}
        />

        <RechnerSelect
          label="Kinder 7-13 Jahre"
          name="anzahlKinder713"
          value={params.anzahlKinder713.toString()}
          onChange={(val) => setParams((p) => ({ ...p, anzahlKinder713: parseInt(val) }))}
          options={Array.from({ length: 6 }, (_, i) => ({
            label: i.toString(),
            value: i.toString(),
          }))}
        />

        <RechnerSelect
          label="Kinder 14-17 Jahre"
          name="anzahlKinder1417"
          value={params.anzahlKinder1417.toString()}
          onChange={(val) => setParams((p) => ({ ...p, anzahlKinder1417: parseInt(val) }))}
          options={Array.from({ length: 6 }, (_, i) => ({
            label: i.toString(),
            value: i.toString(),
          }))}
        />

        <RechnerInput
          label="Eigenes Erwerbseinkommen"
          name="eigenesEinkommen"
          value={params.eigenesEinkommen}
          onChange={(val) => setParams((p) => ({ ...p, eigenesEinkommen: val }))}
          einheit="€"
          step={100}
          min={0}
        />
      </div>

      <RechnerButton onClick={handleBerechnen} />

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Buergergeld-Anspruch"
              value={euro(result.buergergeldAnspruch)}
              highlight
            />
          </div>

          <h4 className="rechner-result-section-title">Berechnung</h4>
          <RechnerResultTable
            rows={[
              { label: "Regelbedarf (Erwachsene)", value: euro(result.regelbedarf) },
              { label: "Kinderbedarf", value: euro(result.kinderBedarf) },
              { label: "Gesamtbedarf", value: euro(result.gesamtBedarf) },
              { label: "Freibetrag auf Einkommen", value: euro(result.freibetrag) },
              { label: "Anrechenbares Einkommen", value: `- ${euro(result.anrechenbaresEinkommen)}` },
            ]}
            footer={{ label: "Buergergeld", value: euro(result.buergergeldAnspruch) }}
          />

          <RechnerHinweis>
            Richtwert ohne Kosten der Unterkunft (KdU). Die tatsaechliche Bewilligung
            erfolgt durch das Jobcenter unter Beruecksichtigung aller Vermoegensverhaeltnisse.
            Grundlage: SGB II.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
