"use client";

import { useState, useEffect } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type PaypalParams, type PaypalResult } from "@/lib/calculators/paypal";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";

export default function PaypalRechner() {
  const [params, setParams] = useState<PaypalParams>({
    umsatz_monatlich: 1000,
    transaktionsgebuehr_prozent: 3.49,
    fixgebuehr: 0.35
  });

  const [result, setResult] = useState<PaypalResult | null>(null);
  const rates = useRates();

  useEffect(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  const handleParamChange = (key: keyof PaypalParams, value: number) => {
    setParams((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">PayPal-Gebühren-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Monatlicher Umsatz"
          name="umsatz_monatlich"
          value={params.umsatz_monatlich}
          onChange={(val) => handleParamChange("umsatz_monatlich", Number(val))}
          einheit="€"
          min={0}
          step={100}
        />

        <RechnerInput
          label="Transaktionsgebühr"
          name="transaktionsgebuehr_prozent"
          value={params.transaktionsgebuehr_prozent}
          onChange={(val) => handleParamChange("transaktionsgebuehr_prozent", Number(val))}
          einheit="%"
          min={0}
          step={0.1}
        />

        <RechnerInput
          label="Fixgebühr"
          name="fixgebuehr"
          value={params.fixgebuehr}
          onChange={(val) => handleParamChange("fixgebuehr", Number(val))}
          einheit="€"
          min={0}
          step={0.01}
        />
      </div>

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Gesamtgebühren"
              value={euro(result.gebuehr_gesamt)}
              highlight={true}
            />
            <RechnerResultBox
              label="Netto nach Gebühren"
              value={euro(result.netto_nach_gebuehr)}
              highlight={false}
            />
            <RechnerResultBox
              label="Effektiver Gebührensatz"
              value={`${result.gebuehr_prozent}%`}
              highlight={false}
            />
          </div>

          <h4 className="rechner-result-section-title">Gebührenaufschlüsselung</h4>
          <RechnerResultTable
            rows={[
              { label: "Umsatz monatlich", value: euro(result.umsatz_monatlich) },
              { label: "Transaktionsgebühr", value: euro(result.transaktionsgebuehr) },
              { label: "Fixgebühr", value: euro(result.fixgebuehr) }
            ]}
            footer={{ label: "Gesamtgebühren", value: euro(result.gebuehr_gesamt) }}
          />

          <RechnerHinweis>
            Die angegebenen Gebühren sind für Inlandsverkäufe (Privatpersonen zu Privat).
            Gewerbliche Konten haben andere Gebührenstaffeln. Bei PayPal gibt es zusätzlich
            monatliche Kontogrenzen und Währungsumrechnungsgebühren.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
