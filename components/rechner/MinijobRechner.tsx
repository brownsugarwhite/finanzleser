"use client";

import { useState, useEffect } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type MinijobParams, type MinijobResult } from "@/lib/calculators/minijob";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerCheckbox from "./ui/RechnerCheckbox";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";

export default function MinijobRechner() {
  const [params, setParams] = useState<MinijobParams>({
    monatlicher_verdienst: 500,
    rv_befreiung: false
  });

  const [result, setResult] = useState<MinijobResult | null>(null);
  const rates = useRates();

  useEffect(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  const handleParamChange = (key: keyof MinijobParams, value: number | boolean) => {
    setParams((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Minijob-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Monatlicher Verdienst"
          name="monatlicher_verdienst"
          value={params.monatlicher_verdienst}
          onChange={(val) => handleParamChange("monatlicher_verdienst", Number(val))}
          einheit="€/Monat"
          min={0}
          step={50}
        />

        <RechnerCheckbox
          label="RV-Befreiung (Rentenversicherung befreit)"
          name="rv_befreiung"
          checked={params.rv_befreiung}
          onChange={(val) => handleParamChange("rv_befreiung", val)}
        />
      </div>

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Kategorie"
              value={
                result.kategorie === "minijob"
                  ? "Minijob"
                  : result.kategorie === "midijob"
                  ? "Midijob"
                  : "Regulär"
              }
              highlight={false}
            />
            <RechnerResultBox
              label="Netto Arbeitnehmer"
              value={euro(result.netto_arbeitnehmer)}
              highlight={true}
            />
            <RechnerResultBox
              label="Kosten Arbeitgeber"
              value={euro(result.kosten_arbeitgeber)}
              highlight={false}
            />
          </div>

          <h4 className="rechner-result-section-title">Details</h4>
          <RechnerResultTable
            rows={[
              { label: "Kategorie", value: result.kategorie === "minijob" ? "Minijob" : result.kategorie === "midijob" ? "Midijob" : "Regulär" },
              { label: "KV Pauschale (AG)", value: `${result.pauschale_kv_prozent}%` },
              { label: "RV Pauschale (AG)", value: `${result.pauschale_rv_prozent}%` },
              { label: "Steuer Pauschale (AG)", value: `${result.pauschale_steuer_prozent}%` },
              { label: "Geschätzte Stunden/Monat", value: `${Math.round(result.geschaetzte_stunden_monat)} h` }
            ]}
          />

          {result.hinweis && (
            <RechnerHinweis>
              ℹ️ {result.hinweis}
            </RechnerHinweis>
          )}

          <RechnerHinweis>
            Bei Minijobs zahlt nur der Arbeitgeber Pauschalabgaben. Der Arbeitnehmer erhält den vollen Verdienst.
            Die Gleitzone (Midijob) liegt zwischen Minijob und Sozialversicherungspflicht.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
