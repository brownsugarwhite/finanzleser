"use client";

import { useState, useCallback } from "react";
import { berechne, type HeizkostenParams, type HeizkostenResult } from "@/lib/calculators/heizkosten";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerSelect from "./ui/RechnerSelect";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";
import RechnerResults from "./ui/RechnerResults";

export default function HeizkostenRechner() {
  const [params, setParams] = useState<HeizkostenParams>({
    wohnflaeche: 80,
    energietraeger: "gas",
    verbrauchKwh: 0,
  });

  const [result, setResult] = useState<HeizkostenResult | null>(null);

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params));
  }, [params]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Heizkosten-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Wohnflaeche"
          name="wohnflaeche"
          value={params.wohnflaeche}
          onChange={(val) => setParams((p) => ({ ...p, wohnflaeche: val }))}
          einheit="m2"
          min={10}
          max={500}
        />
        <RechnerSelect
          label="Energietraeger"
          name="energietraeger"
          value={params.energietraeger}
          onChange={(val) =>
            setParams((p) => ({
              ...p,
              energietraeger: val as HeizkostenParams["energietraeger"],
            }))
          }
          options={[
            { value: "gas", label: "Erdgas" },
            { value: "oel", label: "Heizoel" },
            { value: "fernwaerme", label: "Fernwaerme" },
            { value: "waermepumpe", label: "Waermepumpe (Strom)" },
          ]}
        />
        <RechnerInput
          label="Verbrauch (0 = automatisch)"
          name="verbrauchKwh"
          value={params.verbrauchKwh}
          onChange={(val) => setParams((p) => ({ ...p, verbrauchKwh: val }))}
          einheit="kWh/Jahr"
          min={0}
        />
      </div>

      <RechnerButton onClick={handleBerechnen} />

      {result && (
        <RechnerResults>
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Heizkosten / Jahr"
              value={euro(result.kostenJahr)}
              highlight={true}
            />
            <RechnerResultBox
              label="Heizkosten / Monat"
              value={euro(result.kostenMonat)}
            />
          </div>

          <h4 className="rechner-result-section-title">Details</h4>
          <RechnerResultTable
            rows={[
              { label: "Jahresverbrauch", value: `${result.jahresverbrauch.toLocaleString("de-DE")} kWh` },
              { label: "Kosten / Jahr", value: euro(result.kostenJahr) },
              { label: "Kosten / Monat", value: euro(result.kostenMonat) },
              { label: "CO2-Ausstoss / Jahr", value: `${result.co2Ausstoss.toLocaleString("de-DE")} kg` },
            ]}
          />

          <RechnerHinweis>
            Bei Verbrauch = 0 wird ein Durchschnittswert basierend auf Wohnflaeche und
            Energietraeger berechnet. Die Kosten sind Durchschnittswerte fuer Deutschland 2026.
          </RechnerHinweis>
        </RechnerResults>
      )}
    </div>
  );
}
