"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type KfzSteuerParams, type KfzSteuerResult } from "@/lib/calculators/kfz_steuer";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerSelect from "./ui/RechnerSelect";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";
import { useRechnerState } from "@/lib/hooks/useRechnerState";
import RechnerResults from "./ui/RechnerResults";

export default function KfzSteuerRechner() {
  const [params, setParams] = useState<KfzSteuerParams>({
    antriebsart: "benzin",
    hubraum_ccm: 1600,
    co2_g_km: 120,
    erstzulassung_jahr: 2020,
  });

  const [result, setResult] = useState<KfzSteuerResult | null>(null);
  const rechnerState = useRechnerState(params);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
    rechnerState.markCalculated();
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Kfz-Steuer-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerSelect
          label="Antriebsart"
          name="antriebsart"
          value={params.antriebsart}
          onChange={(val) =>
            setParams((p) => ({
              ...p,
              antriebsart: val as KfzSteuerParams["antriebsart"],
            }))
          }
          options={[
            { value: "benzin", label: "Benzin" },
            { value: "diesel", label: "Diesel" },
            { value: "elektro", label: "Elektro" },
          ]}
        />

        {params.antriebsart !== "elektro" && (
          <>
            <RechnerInput
              label="Hubraum"
              name="hubraum_ccm"
              value={params.hubraum_ccm}
              onChange={(val) => setParams((p) => ({ ...p, hubraum_ccm: val }))}
              einheit="ccm"
              step={100}
              min={0}
            />
            <RechnerInput
              label="CO2-Ausstoss"
              name="co2_g_km"
              value={params.co2_g_km}
              onChange={(val) => setParams((p) => ({ ...p, co2_g_km: val }))}
              einheit="g/km"
              step={5}
              min={0}
            />
          </>
        )}

        <RechnerInput
          label="Erstzulassungsjahr"
          name="erstzulassung_jahr"
          value={params.erstzulassung_jahr}
          onChange={(val) => setParams((p) => ({ ...p, erstzulassung_jahr: val }))}
          einheit="Jahr"
          min={1990}
          max={2026}
        />
      <RechnerButton onClick={handleBerechnen} disabled={rechnerState.buttonDisabled} needsUpdate={rechnerState.needsUpdate} />

      </div>

      {result && (
        <RechnerResults scrollKey={rechnerState.scrollKey}>
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Jahressteuer"
              value={euro(result.jahressteuer)}
              highlight={true}
            />
          </div>

          {result.elektroBefreit && (
            <RechnerHinweis>
              Elektrofahrzeug: Steuerbefreiung aktiv (bis zu 10 Jahre ab Erstzulassung).
            </RechnerHinweis>
          )}

          {!result.elektroBefreit && (
            <>
              <h4 className="rechner-result-section-title">Aufschluesselung</h4>
              <RechnerResultTable
                rows={[
                  { label: "Hubraum-Steuer", value: euro(result.hubraumSteuer) },
                  { label: "CO2-Steuer", value: euro(result.co2Steuer) },
                  { label: "Jahressteuer", value: euro(result.jahressteuer) },
                ]}
              />
            </>
          )}

          <RechnerHinweis>
            Berechnung nach Paragraph 9 KraftStG. Benzin: 2,00 EUR/100 ccm.
            Diesel: 9,50 EUR/100 ccm. CO2-Freibetrag: 95 g/km.
            Elektro-Befreiung bei Neuzulassung bis 2030 (max. 10 Jahre, laengstens bis 2035).
          </RechnerHinweis>
        </RechnerResults>
      )}
    </div>
  );
}
