"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type KurzarbeitsgeldParams, type KurzarbeitsgeldResult } from "@/lib/calculators/kurzarbeitsgeld";
import { euro, prozent } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerSelect from "./ui/RechnerSelect";
import RechnerCheckbox from "./ui/RechnerCheckbox";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";
import RechnerResults from "./ui/RechnerResults";

export default function KurzarbeitssgeldRechner() {
  const [params, setParams] = useState<KurzarbeitsgeldParams>({
    sollEntgelt: 3000,
    istEntgelt: 0,
    steuerklasse: 1,
    hatKind: false,
    kinderlosUeber23: false,
  });

  const [result, setResult] = useState<KurzarbeitsgeldResult | null>(null);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Kurzarbeitergeld-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Soll-Entgelt (normales Bruttogehalt)"
          name="sollEntgelt"
          value={params.sollEntgelt}
          onChange={(val) => setParams((prev) => ({ ...prev, sollEntgelt: val }))}
          einheit="€"
          step={100}
          min={0}
        />

        <RechnerInput
          label="Ist-Entgelt (reduziertes Bruttogehalt)"
          name="istEntgelt"
          value={params.istEntgelt}
          onChange={(val) => setParams((prev) => ({ ...prev, istEntgelt: val }))}
          einheit="€"
          step={100}
          min={0}
        />

        <RechnerSelect
          label="Steuerklasse"
          name="steuerklasse"
          value={String(params.steuerklasse)}
          onChange={(val) => setParams((prev) => ({ ...prev, steuerklasse: parseInt(val) }))}
          options={[1, 2, 3, 4, 5, 6].map((sk) => ({
            label: `Klasse ${sk}`,
            value: String(sk),
          }))}
        />

        <RechnerCheckbox
          label="Hat Kind (Leistungssatz 67%)"
          name="hatKind"
          checked={params.hatKind}
          onChange={(val) => setParams((prev) => ({ ...prev, hatKind: val }))}
        />

        <RechnerCheckbox
          label="Kinderlos und ueber 23 Jahre"
          name="kinderlosUeber23"
          checked={params.kinderlosUeber23}
          onChange={(val) => setParams((prev) => ({ ...prev, kinderlosUeber23: val }))}
        />
      </div>

      <RechnerButton onClick={handleBerechnen} />

      {result && (
        <RechnerResults>
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Kurzarbeitergeld"
              value={euro(result.kurzarbeitergeld)}
              highlight={true}
            />
            <RechnerResultBox
              label="Gesamteinkommen"
              value={euro(result.gesamtEinkommen)}
              highlight={true}
            />
          </div>

          <RechnerResultTable
            rows={[
              { label: "Soll-Brutto", value: euro(result.sollBrutto) },
              { label: "Ist-Brutto", value: euro(result.istBrutto) },
              { label: "Netto (Soll)", value: euro(result.nettoSoll) },
              { label: "Netto (Ist)", value: euro(result.nettoIst) },
              { label: "Netto-Entgeltdifferenz", value: euro(result.nettoEntgeltDifferenz) },
              { label: "Leistungssatz", value: prozent(result.leistungssatzProzent) },
              { label: "Kurzarbeitergeld", value: euro(result.kurzarbeitergeld) },
              { label: "Ausfallquote", value: prozent(result.ausfallQuoteProzent) },
            ]}
            footer={{ label: "Gesamteinkommen", value: euro(result.gesamtEinkommen) }}
          />

          <RechnerHinweis>
            Kurzarbeitergeld ersetzt {result.leistungssatzProzent}% der Netto-Entgeltdifferenz.
            Voraussetzung: angemeldete Kurzarbeit bei der Agentur fuer Arbeit.
            Rechtsgrundlage: SS 95-111 SGB III.
          </RechnerHinweis>
        </RechnerResults>
      )}
    </div>
  );
}
