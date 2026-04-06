"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type TilgungParams, type TilgungResult } from "@/lib/calculators/tilgung";
import { euro, prozent } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerAmortizationTable from "./ui/RechnerAmortizationTable";
import RechnerButton from "./ui/RechnerButton";
import RechnerResults from "./ui/RechnerResults";

export default function TilgungRechner() {
  const [params, setParams] = useState<TilgungParams>({
    darlehensbetrag: 300000,
    zinssatzPa: 3.5,
    anfangstilgungPa: 2.0,
    sondertilgungJahr: 0,
  });

  const [result, setResult] = useState<TilgungResult | null>(null);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  const hasSondertilgung = params.sondertilgungJahr > 0;

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Tilgungsrechner</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Darlehensbetrag"
          name="darlehensbetrag"
          value={params.darlehensbetrag}
          onChange={(val) => setParams((prev) => ({ ...prev, darlehensbetrag: val }))}
          einheit="€"
          step={5000}
          min={0}
        />
        <RechnerInput
          label="Sollzinssatz p.a."
          name="zinssatzPa"
          value={params.zinssatzPa}
          onChange={(val) => setParams((prev) => ({ ...prev, zinssatzPa: val }))}
          einheit="%"
          step={0.05}
          min={0}
        />
        <RechnerInput
          label="Anfängliche Tilgung p.a."
          name="anfangstilgungPa"
          value={params.anfangstilgungPa}
          onChange={(val) => setParams((prev) => ({ ...prev, anfangstilgungPa: val }))}
          einheit="%"
          step={0.1}
          min={0}
        />
        <RechnerInput
          label="Sondertilgung pro Jahr"
          name="sondertilgungJahr"
          value={params.sondertilgungJahr}
          onChange={(val) => setParams((prev) => ({ ...prev, sondertilgungJahr: val }))}
          einheit="€"
          step={500}
          min={0}
        />
      </div>

      <RechnerButton onClick={handleBerechnen} />

      {result && (
        <RechnerResults>
          <div className="rechner-result-boxes">
            <RechnerResultBox label="Monatsrate" value={euro(result.monatsrate)} highlight />
            <RechnerResultBox label="Laufzeit" value={`${result.laufzeitJahre} Jahre`} />
            <RechnerResultBox label="Gesamtzinsen" value={euro(result.gesamtZinsen)} />
          </div>

          <RechnerResultTable
            rows={[
              { label: "Darlehensbetrag", value: euro(params.darlehensbetrag) },
              { label: "Monatsrate", value: euro(result.monatsrate) },
              { label: "Laufzeit", value: `${result.laufzeitJahre} Jahre` },
              { label: "Gesamtzinsen", value: euro(result.gesamtZinsen) },
              { label: "Gesamttilgung", value: euro(result.gesamtTilgung) },
            ]}
          />

          <h4 className="rechner-result-section-title">Tilgungsplan (Jahresübersicht)</h4>
          <RechnerAmortizationTable
            columns={[
              { key: "jahr", label: "Jahr" },
              { key: "rateJahr", label: "Rate (Jahr)" },
              { key: "zinsen", label: "Zinsen" },
              { key: "tilgung", label: "Tilgung" },
              { key: "sondertilgung", label: "Sondertilgung", visible: hasSondertilgung },
              { key: "restschuld", label: "Restschuld" },
            ]}
            yearlyRows={result.jahresplan.map((row) => ({
              jahr: row.jahr,
              rateJahr: euro(row.rateJahr),
              zinsen: euro(row.zinsen),
              tilgung: euro(row.tilgung),
              sondertilgung: euro(row.sondertilgung),
              restschuld: euro(row.restschuld),
            }))}
          />

          <RechnerHinweis>
            Annuität = Darlehensbetrag x (Zinssatz + Tilgungssatz) / 12. Die Sondertilgung
            wird am Jahresende verrechnet und verkürzt die Laufzeit.
          </RechnerHinweis>
        </RechnerResults>
      )}
    </div>
  );
}
