"use client";

import { useState, useCallback } from "react";
import { berechne, type KfwStudienkreditParams, type KfwStudienkreditResult } from "@/lib/calculators/kfw-studienkredit";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";

export default function KfwStudienkreditRechner() {
  const [params, setParams] = useState<KfwStudienkreditParams>({
    auszahlungMonat: 650,
    auszahlungMonate: 14,
    zinssatzPa: 6.85,
    karenzMonate: 18,
    tilgungMonate: 120,
  });

  const [result, setResult] = useState<KfwStudienkreditResult | null>(null);

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params));
  }, [params]);

  const handleChange = (key: keyof KfwStudienkreditParams, val: number) => {
    setParams((p) => ({ ...p, [key]: val }));
  };

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">KfW-Studienkredit-Rechner</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Monatliche Auszahlung"
          name="auszahlungMonat"
          value={params.auszahlungMonat}
          onChange={(val) => handleChange("auszahlungMonat", val)}
          einheit="EUR"
          min={100}
          max={650}
          step={50}
        />
        <RechnerInput
          label="Auszahlungsdauer"
          name="auszahlungMonate"
          value={params.auszahlungMonate}
          onChange={(val) => handleChange("auszahlungMonate", val)}
          einheit="Monate"
          min={1}
          max={84}
        />
        <RechnerInput
          label="Zinssatz p.a."
          name="zinssatzPa"
          value={params.zinssatzPa}
          onChange={(val) => handleChange("zinssatzPa", val)}
          einheit="%"
          min={0}
          max={15}
          step={0.01}
        />
        <RechnerInput
          label="Karenzphase"
          name="karenzMonate"
          value={params.karenzMonate}
          onChange={(val) => handleChange("karenzMonate", val)}
          einheit="Monate"
          min={0}
          max={23}
        />
        <RechnerInput
          label="Tilgungsdauer"
          name="tilgungMonate"
          value={params.tilgungMonate}
          onChange={(val) => handleChange("tilgungMonate", val)}
          einheit="Monate"
          min={1}
          max={300}
        />
      </div>

      <RechnerButton onClick={handleBerechnen} />

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Monatsrate Tilgung"
              value={euro(result.monatsrate)}
              highlight={true}
            />
            <RechnerResultBox
              label="Gesamtrueckzahlung"
              value={euro(result.gesamtRueckzahlung)}
            />
          </div>

          <h4 className="rechner-result-section-title">Uebersicht</h4>
          <RechnerResultTable
            rows={[
              { label: "Gesamte Auszahlung", value: euro(result.gesamtAuszahlung) },
              { label: "Gesamte Zinsen", value: euro(result.gesamtZinsen) },
              { label: "Monatsrate (Tilgung)", value: euro(result.monatsrate) },
              { label: "Gesamtrueckzahlung", value: euro(result.gesamtRueckzahlung) },
            ]}
          />

          <RechnerHinweis>
            KfW-Studienkredit (Programm 174): Zinssatz wird halbjaehrlich angepasst.
            Waehrend Auszahlung und Karenzphase fallen Zinsen an, die zum Kapital addiert werden.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
