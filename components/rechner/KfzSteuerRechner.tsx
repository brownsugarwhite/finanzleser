"use client";

import { useState, useEffect } from "react";
import { berechne, type KfzSteuerParams, type KfzSteuerResult } from "@/lib/calculators/kfz_steuer";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";

export default function KfzSteuerRechner() {
  const [params, setParams] = useState<KfzSteuerParams>({
    hubraum: 1600,
    co2_ausstoss: 140,
    anmeldungsjahr: 2024,
  });

  const [result, setResult] = useState<KfzSteuerResult | null>(null);

  useEffect(() => {
    setResult(berechne(params));
  }, [params]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">KFZ-Steuer-Rechner</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Hubraum"
          name="hubraum"
          value={params.hubraum}
          onChange={(val) => setParams((prev) => ({ ...prev, hubraum: val }))}
          einheit="ccm"
          step={100}
          min={0}
        />

        <RechnerInput
          label="CO₂-Ausstoß"
          name="co2_ausstoss"
          value={params.co2_ausstoss}
          onChange={(val) => setParams((prev) => ({ ...prev, co2_ausstoss: val }))}
          einheit="g/km"
          step={5}
          min={0}
        />

        <RechnerInput
          label="Erstzulassungsjahr"
          name="anmeldungsjahr"
          value={params.anmeldungsjahr}
          onChange={(val) => setParams((prev) => ({ ...prev, anmeldungsjahr: val }))}
          einheit="Jahr"
          step={1}
          min={1990}
        />
      </div>

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox label="Jahressteuern" value={euro(result.steuer_jaehrlich)} highlight={true} />
            <RechnerResultBox label="Monatlich" value={euro(result.steuer_monatlich)} />
          </div>

          <RechnerResultTable
            rows={[
              { label: "Hubraum", value: `${result.hubraum} ccm` },
              { label: "CO₂-Ausstoß", value: `${result.co2_ausstoss} g/km` },
              { label: "Erstzulassungsjahr", value: result.anmeldungsjahr.toString() },
              { label: "Jahressteuern", value: euro(result.steuer_jaehrlich) },
              { label: "Monatliche Steuer", value: euro(result.steuer_monatlich) },
            ]}
          />

          <RechnerHinweis>
            Berechnung nach §9 KraftStG: 2,00 € pro 100 ccm Hubraum + CO₂-Zuschlag (2 € pro g/km
            über 120 g/km). Ältere Fahrzeuge können Reduktionen erhalten.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
