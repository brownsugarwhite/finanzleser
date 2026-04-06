"use client";

import { useState, useCallback } from "react";
import { berechne, type PvFoerderungParams, type PvFoerderungResult } from "@/lib/calculators/pv-foerderung";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";
import RechnerResults from "./ui/RechnerResults";

export default function PvFoerderungRechner() {
  const [params, setParams] = useState<PvFoerderungParams>({
    anlagenLeistungKwp: 10,
    eigenverbrauchProzent: 30,
    strompreisCtKwh: 35,
    einspeiseverguetungCtKwh: 8.03,
  });

  const [result, setResult] = useState<PvFoerderungResult | null>(null);

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params));
  }, [params]);

  const handleChange = (key: keyof PvFoerderungParams, val: number) => {
    setParams((p) => ({ ...p, [key]: val }));
  };

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">PV-Foerderung & Ertrag-Rechner</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Anlagenleistung"
          name="anlagenLeistungKwp"
          value={params.anlagenLeistungKwp}
          onChange={(val) => handleChange("anlagenLeistungKwp", val)}
          einheit="kWp"
          min={1}
          max={100}
          step={0.5}
        />
        <RechnerInput
          label="Eigenverbrauch"
          name="eigenverbrauchProzent"
          value={params.eigenverbrauchProzent}
          onChange={(val) => handleChange("eigenverbrauchProzent", val)}
          einheit="%"
          min={0}
          max={100}
          step={5}
        />
        <RechnerInput
          label="Strompreis"
          name="strompreisCtKwh"
          value={params.strompreisCtKwh}
          onChange={(val) => handleChange("strompreisCtKwh", val)}
          einheit="ct/kWh"
          min={0}
          max={80}
          step={0.5}
        />
        <RechnerInput
          label="Einspeiseverguetung"
          name="einspeiseverguetungCtKwh"
          value={params.einspeiseverguetungCtKwh}
          onChange={(val) => handleChange("einspeiseverguetungCtKwh", val)}
          einheit="ct/kWh"
          min={0}
          max={20}
          step={0.01}
        />
      </div>

      <RechnerButton onClick={handleBerechnen} />

      {result && (
        <RechnerResults>
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Gesamtertrag / Jahr"
              value={euro(result.gesamtertragJahr)}
              highlight={true}
            />
            <RechnerResultBox
              label="Jahresertrag"
              value={`${result.jahresertrag.toLocaleString("de-DE")} kWh`}
            />
          </div>

          <h4 className="rechner-result-section-title">Ertragsaufschluesselung</h4>
          <RechnerResultTable
            rows={[
              { label: "Jahresertrag", value: `${result.jahresertrag.toLocaleString("de-DE")} kWh` },
              { label: "Eigenverbrauch-Ersparnis", value: euro(result.eigenverbrauchErsparnis) },
              { label: "Einspeiseverguetung", value: euro(result.einspeiseverguetung) },
              { label: "Gesamtertrag / Jahr", value: euro(result.gesamtertragJahr) },
            ]}
          />

          <RechnerHinweis>
            Durchschnittlicher PV-Ertrag in Deutschland: ca. 950 kWh pro kWp und Jahr.
            Einspeiseverguetung nach EEG 2024, Paragraph 48 (Anlagen bis 10 kWp: 8,03 ct/kWh).
          </RechnerHinweis>
        </RechnerResults>
      )}
    </div>
  );
}
