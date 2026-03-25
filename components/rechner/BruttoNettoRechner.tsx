"use client";

import { useState, useCallback, useEffect } from "react";
import { berechne, type BruttoNettoParams, type BruttoNettoResult } from "@/lib/calculators/brutto-netto";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerSelect from "./ui/RechnerSelect";
import RechnerCheckbox from "./ui/RechnerCheckbox";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";

const BUNDESLAENDER = [
  "Baden-Württemberg",
  "Bayern",
  "Berlin",
  "Brandenburg",
  "Bremen",
  "Hamburg",
  "Hessen",
  "Mecklenburg-Vorpommern",
  "Niedersachsen",
  "Nordrhein-Westfalen",
  "Rheinland-Pfalz",
  "Saarland",
  "Sachsen",
  "Sachsen-Anhalt",
  "Schleswig-Holstein",
  "Thüringen",
];

export default function BruttoNettoRechner() {
  const [params, setParams] = useState<BruttoNettoParams>({
    monatsBrutto: 3000,
    steuerklasse: 1,
    bundesland: "Baden-Württemberg",
    kirchenmitglied: false,
    kinder: 0,
    kinderlosUeber23: false,
    eigenerKvZusatz: null,
  });

  const [result, setResult] = useState<BruttoNettoResult | null>(null);

  // Initial calculation and update on params change
  useEffect(() => {
    setResult(berechne(params));
  }, [params]);

  const handleParamChange = useCallback(
    (key: keyof BruttoNettoParams, value: number | boolean | string) => {
      setParams((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Brutto-Netto-Rechner 2026</h3>

      {/* Input Section */}
      <div className="rechner-inputs">
        <RechnerInput
          label="Monatliches Bruttoeinkommen"
          name="monatsBrutto"
          value={params.monatsBrutto}
          onChange={(val) => handleParamChange("monatsBrutto", val)}
          einheit="€"
          step={100}
          min={0}
        />

        <RechnerSelect
          label="Steuerklasse"
          name="steuerklasse"
          value={params.steuerklasse.toString()}
          onChange={(val) => handleParamChange("steuerklasse", parseInt(val) as 1 | 2 | 3 | 4 | 5 | 6)}
          options={[
            { label: "I (Single)", value: "1" },
            { label: "II (Single mit Kind)", value: "2" },
            { label: "III (Verheiratet, Splitting)", value: "3" },
            { label: "IV (Verheiratet, zusammen)", value: "4" },
            { label: "V (Verheiratet, Zweitjob)", value: "5" },
            { label: "VI (Mehrere Arbeitgeber)", value: "6" },
          ]}
        />

        <RechnerSelect
          label="Bundesland"
          name="bundesland"
          value={params.bundesland}
          onChange={(val) => handleParamChange("bundesland", val)}
          options={BUNDESLAENDER.map((bl) => ({ label: bl, value: bl }))}
        />

        <RechnerSelect
          label="Kinder unter 25 Jahren"
          name="kinder"
          value={params.kinder.toString()}
          onChange={(val) => handleParamChange("kinder", parseInt(val))}
          options={Array.from({ length: 6 }, (_, i) => ({
            label: i.toString(),
            value: i.toString(),
          }))}
        />

        <RechnerCheckbox
          label="Kirchenmitglied"
          name="kirchenmitglied"
          checked={params.kirchenmitglied}
          onChange={(val) => handleParamChange("kirchenmitglied", val)}
        />

        <RechnerCheckbox
          label="Kinderlos und älter als 23 Jahre (erhöhter PV-Satz)"
          name="kinderlosUeber23"
          checked={params.kinderlosUeber23}
          onChange={(val) => handleParamChange("kinderlosUeber23", val)}
        />
      </div>

      {/* Results Section */}
      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Bruttoeinkommen"
              value={euro(result.brutto)}
              highlight={false}
            />
            <RechnerResultBox label="Nettoeinkommen" value={euro(result.netto)} highlight={true} />
          </div>

          <h4 className="rechner-result-section-title">Sozialversicherung</h4>
          <RechnerResultTable
            rows={[
              { label: "Rentenversicherung", value: euro(result.sv.rv) },
              { label: "Krankenversicherung", value: euro(result.sv.kv) },
              { label: "Pflegeversicherung", value: euro(result.sv.pv) },
              { label: "Arbeitslosenversicherung", value: euro(result.sv.alv) },
            ]}
            footer={{ label: "Gesamt SV", value: euro(result.sv.gesamt) }}
          />

          <h4 className="rechner-result-section-title">Steuern</h4>
          <RechnerResultTable
            rows={[
              { label: "Lohnsteuer", value: euro(result.steuern.lohnsteuer) },
              { label: "Solidaritätszuschlag", value: euro(result.steuern.soli) },
              { label: "Kirchensteuer", value: euro(result.steuern.kirchensteuer) },
            ]}
            footer={{ label: "Gesamt Steuern", value: euro(result.steuern.gesamt) }}
          />

          <RechnerHinweis>
            Diese Berechnung erfolgt ohne Gewähr. Sie enthält keine Arbeitgeberzuschüsse und ist eine Näherung.
            Abweichungen durch individuelle Besonderheiten sind möglich.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
