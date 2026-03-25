"use client";

import { useState, useEffect } from "react";
import { berechne, type AbfindungParams, type AbfindungResult } from "@/lib/calculators/abfindung";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";

export default function AbfindungRechner() {
  const [params, setParams] = useState<AbfindungParams>({
    abfindungssumme: 50000,
    regelmaessiges_jahrseinkommen: 60000,
  });

  const [result, setResult] = useState<AbfindungResult | null>(null);

  useEffect(() => {
    setResult(berechne(params));
  }, [params]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Abfindungs-Rechner</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Abfindungssumme"
          name="abfindungssumme"
          value={params.abfindungssumme}
          onChange={(val) => setParams((prev) => ({ ...prev, abfindungssumme: val }))}
          einheit="€"
          step={5000}
          min={0}
        />

        <RechnerInput
          label="Regelm. Jahreseinkommen"
          name="regelmaessiges_jahrseinkommen"
          value={params.regelmaessiges_jahrseinkommen}
          onChange={(val) => setParams((prev) => ({ ...prev, regelmaessiges_jahrseinkommen: val }))}
          einheit="€"
          step={5000}
          min={0}
        />
      </div>

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox label="Gesamtabgaben" value={euro(result.einkommensteuer + result.solidaritaetszuschlag + result.kirchensteuer + result.sozialversicherung)} highlight={true} />
            <RechnerResultBox label="Netto-Abfindung" value={euro(result.netto_abfindung)} />
          </div>

          <RechnerResultTable
            rows={[
              { label: "Abfindungssumme", value: euro(result.abfindungssumme) },
              { label: "Einkommensteuer", value: euro(result.einkommensteuer) },
              { label: "Solidaritätszuschlag", value: euro(result.solidaritaetszuschlag) },
              { label: "Kirchensteuer", value: euro(result.kirchensteuer) },
              { label: "Sozialversicherung", value: euro(result.sozialversicherung) },
              { label: "Netto-Abfindung", value: euro(result.netto_abfindung) },
            ]}
          />

          <RechnerHinweis>
            Dies ist eine vereinfachte Berechnung mit Fünftelregelung (§34 EStG). Die tatsächliche
            Besteuerung kann durch weitere Faktoren abweichen. Konsultieren Sie einen Steuerberater.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
