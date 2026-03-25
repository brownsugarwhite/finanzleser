"use client";

import { useState, useEffect } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type EinkommensteuerParams, type EinkommensteuerResult } from "@/lib/calculators/einkommensteuer";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerSelect from "./ui/RechnerSelect";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";

const BUNDESLAENDER = [
  "Baden-Württemberg", "Bayern", "Bremen", "Hamburg", "Hessen", "Mecklenburg-Vorpommern",
  "Niedersachsen", "Nordrhein-Westfalen", "Rheinland-Pfalz", "Saarland",
  "Sachsen", "Sachsen-Anhalt", "Schleswig-Holstein", "Thüringen", "Berlin", "Brandenburg",
];

export default function EinkommensteuerRechner() {
  const [params, setParams] = useState<EinkommensteuerParams>({
    einkommen: 50000,
    steuerklasse: 1,
    bundesland: "Bayern",
  });

  const [result, setResult] = useState<EinkommensteuerResult | null>(null);

  const rates = useRates();

  useEffect(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Einkommensteuer-Rechner</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Zu versteuerndes Einkommen"
          name="einkommen"
          value={params.einkommen}
          onChange={(val) => setParams((prev) => ({ ...prev, einkommen: val }))}
          einheit="€"
          step={1000}
          min={0}
        />

        <RechnerSelect
          label="Steuerklasse"
          name="steuerklasse"
          value={params.steuerklasse.toString()}
          onChange={(val) => setParams((prev) => ({ ...prev, steuerklasse: parseInt(val) }))}
          options={[1, 2, 3, 4, 5, 6].map((s) => ({ label: s.toString(), value: s.toString() }))}
        />

        <RechnerSelect
          label="Bundesland"
          name="bundesland"
          value={params.bundesland}
          onChange={(val) => setParams((prev) => ({ ...prev, bundesland: val }))}
          options={BUNDESLAENDER.map((b) => ({ label: b, value: b }))}
        />
      </div>

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox label="Gesamtsteuer" value={euro(result.gesamtsteuer)} highlight={true} />
            <RechnerResultBox label="Netto-Einkommen" value={euro(result.nettoEinkommen)} />
          </div>

          <RechnerResultTable
            rows={[
              { label: "Zu versteuerndes Einkommen", value: euro(result.einkommen) },
              { label: "Einkommensteuer", value: euro(result.lohnsteuer) },
              { label: "Solidaritätszuschlag", value: euro(result.solidaritaetszuschlag) },
              { label: "Kirchensteuer", value: euro(result.kirchensteuer) },
              { label: "Gesamtsteuer", value: euro(result.gesamtsteuer) },
              { label: "Netto-Einkommen", value: euro(result.nettoEinkommen) },
            ]}
          />

          <RechnerHinweis>
            Dies ist eine vereinfachte Berechnung. Die tatsächliche Steuerlast kann durch weitere
            Faktoren wie Freibeträge, Sonderausgaben und außergewöhnliche Belastungen abweichen.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
