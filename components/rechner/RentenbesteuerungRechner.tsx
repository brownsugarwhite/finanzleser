"use client";

import { useState, useEffect } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type RentenbesteuerungParams, type RentenbesteuerungResult } from "@/lib/calculators/rentenbesteuerung";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerSelect from "./ui/RechnerSelect";
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
  "Thüringen"
];

export default function RentenbesteuerungRechner() {
  const [params, setParams] = useState<RentenbesteuerungParams>({
    rente_monatlich: 1500,
    sonstiges_einkommen: 500,
    bundesland: "Nordrhein-Westfalen"
  });

  const [result, setResult] = useState<RentenbesteuerungResult | null>(null);
  const rates = useRates();

  useEffect(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  const handleParamChange = (key: keyof RentenbesteuerungParams, value: number | string) => {
    setParams((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Rentenbesteuerung-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Rente monatlich"
          name="rente_monatlich"
          value={params.rente_monatlich}
          onChange={(val) => handleParamChange("rente_monatlich", Number(val))}
          einheit="€/Monat"
          min={0}
          step={100}
        />

        <RechnerInput
          label="Sonstiges Einkommen"
          name="sonstiges_einkommen"
          value={params.sonstiges_einkommen}
          onChange={(val) => handleParamChange("sonstiges_einkommen", Number(val))}
          einheit="€/Jahr"
          min={0}
          step={100}
        />

        <RechnerSelect
          label="Bundesland"
          name="bundesland"
          value={params.bundesland}
          onChange={(val) => handleParamChange("bundesland", val)}
          options={BUNDESLAENDER.map((bl) => ({ label: bl, value: bl }))}
        />
      </div>

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Geschätzte Einkommensteuer"
              value={euro(result.einkommensteuer_geschaetzt)}
              highlight={true}
            />
            <RechnerResultBox
              label="Effektiver Steuersatz"
              value={`${result.effektiver_steuersatz}%`}
              highlight={false}
            />
          </div>

          <h4 className="rechner-result-section-title">Berechnung</h4>
          <RechnerResultTable
            rows={[
              { label: "Rente jährlich", value: euro(result.rente_jaehrlich) },
              { label: "Besteuerungsanteil 2026", value: `${result.besteuerungsanteil}%` },
              { label: "Zu versteuernde Rente", value: euro(result.zu_versteuerndes_einkommen) },
              { label: "Sonstiges Einkommen", value: euro(result.sonstiges_einkommen) },
              { label: "Gesamteinkommen", value: euro(result.gesamteinkommen) }
            ]}
            footer={{ label: "Geschätzte Einkommensteuer (vereinfacht)", value: euro(result.einkommensteuer_geschaetzt) }}
          />

          <RechnerHinweis>
            Dies ist eine vereinfachte Schätzung basierend auf Durchschnittssteuersätzen.
            Die tatsächliche Steuer hängt von Ihrer Gesamtsituation ab (Kirchensteuer, Soli, Kapitalerträge, etc.).
            Der Besteuerungsanteil für Renten 2026 beträgt {result.besteuerungsanteil}%.
            Quelle: § 22 EStG, Rentenbesteuerung nach Alterseinkünfte-Gesetz.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
