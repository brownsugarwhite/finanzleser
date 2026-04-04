"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type HaushaltsrechnerParams, type HaushaltsrechnerResult } from "@/lib/calculators/haushaltsrechner";
import { euro, prozent } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";

export default function HaushaltsrechnerRechner() {
  const [params, setParams] = useState<HaushaltsrechnerParams>({
    einkommen: 3000,
    miete: 800,
    nebenkosten: 200,
    lebensmittel: 400,
    versicherungen: 200,
    mobilitaet: 150,
    freizeit: 200,
    sonstiges: 100,
  });

  const [result, setResult] = useState<HaushaltsrechnerResult | null>(null);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Haushaltsrechner</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Netto-Einkommen"
          name="einkommen"
          value={params.einkommen}
          onChange={(val) => setParams((prev) => ({ ...prev, einkommen: val }))}
          einheit="€"
          step={100}
          min={0}
        />

        <h4 className="rechner-result-section-title">Ausgaben</h4>

        <RechnerInput
          label="Miete"
          name="miete"
          value={params.miete}
          onChange={(val) => setParams((prev) => ({ ...prev, miete: val }))}
          einheit="€"
          step={50}
          min={0}
        />
        <RechnerInput
          label="Nebenkosten"
          name="nebenkosten"
          value={params.nebenkosten}
          onChange={(val) => setParams((prev) => ({ ...prev, nebenkosten: val }))}
          einheit="€"
          step={25}
          min={0}
        />
        <RechnerInput
          label="Lebensmittel"
          name="lebensmittel"
          value={params.lebensmittel}
          onChange={(val) => setParams((prev) => ({ ...prev, lebensmittel: val }))}
          einheit="€"
          step={25}
          min={0}
        />
        <RechnerInput
          label="Versicherungen"
          name="versicherungen"
          value={params.versicherungen}
          onChange={(val) => setParams((prev) => ({ ...prev, versicherungen: val }))}
          einheit="€"
          step={25}
          min={0}
        />
        <RechnerInput
          label="Mobilität"
          name="mobilitaet"
          value={params.mobilitaet}
          onChange={(val) => setParams((prev) => ({ ...prev, mobilitaet: val }))}
          einheit="€"
          step={25}
          min={0}
        />
        <RechnerInput
          label="Freizeit"
          name="freizeit"
          value={params.freizeit}
          onChange={(val) => setParams((prev) => ({ ...prev, freizeit: val }))}
          einheit="€"
          step={25}
          min={0}
        />
        <RechnerInput
          label="Sonstiges"
          name="sonstiges"
          value={params.sonstiges}
          onChange={(val) => setParams((prev) => ({ ...prev, sonstiges: val }))}
          einheit="€"
          step={25}
          min={0}
        />
      </div>

      <RechnerButton onClick={handleBerechnen} />

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Sparbetrag / Monat"
              value={euro(result.sparBetrag)}
              highlight
              variant={result.sparBetrag >= 0 ? "positive" : "negative"}
            />
            <RechnerResultBox label="Sparquote" value={prozent(result.sparQuoteProzent)} />
            <RechnerResultBox label="Gesamtausgaben" value={euro(result.gesamtAusgaben)} />
          </div>

          <RechnerResultTable
            rows={[
              { label: "Netto-Einkommen", value: euro(params.einkommen) },
              { label: "Gesamtausgaben", value: euro(result.gesamtAusgaben) },
              { label: "Sparbetrag / Monat", value: euro(result.sparBetrag) },
              { label: "Sparquote", value: prozent(result.sparQuoteProzent) },
              { label: "Notgroschen reicht für", value: `${result.notgroschenMonate} Monate` },
            ]}
          />

          <RechnerHinweis>
            Experten empfehlen eine Sparquote von mindestens 10-20% des Nettoeinkommens.
            Ein Notgroschen von 3-6 Monatsausgaben bietet finanzielle Sicherheit.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
