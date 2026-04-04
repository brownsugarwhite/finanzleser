"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type UebergangsgeldParams, type UebergangsgeldResult } from "@/lib/calculators/uebergangsgeld";
import { euro, prozent } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerCheckbox from "./ui/RechnerCheckbox";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";

export default function UebergangsgeldRechner() {
  const [params, setParams] = useState<UebergangsgeldParams>({
    monatsBrutto: 3500,
    hatKind: false,
  });

  const [result, setResult] = useState<UebergangsgeldResult | null>(null);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Uebergangsgeld-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Monatliches Bruttogehalt"
          name="monatsBrutto"
          value={params.monatsBrutto}
          onChange={(val) => setParams((prev) => ({ ...prev, monatsBrutto: val }))}
          einheit="€"
          step={100}
          min={0}
        />

        <RechnerCheckbox
          label="Hat Kind (erhoehter Leistungssatz)"
          name="hatKind"
          checked={params.hatKind}
          onChange={(val) => setParams((prev) => ({ ...prev, hatKind: val }))}
        />
      </div>

      <RechnerButton onClick={handleBerechnen} />

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Uebergangsgeld taeglich"
              value={euro(result.uebergangsgeldTaeglich)}
              highlight={true}
            />
            <RechnerResultBox
              label="Uebergangsgeld monatlich"
              value={euro(result.uebergangsgeldMonatlich)}
              highlight={true}
            />
          </div>

          <RechnerResultTable
            rows={[
              { label: "Monatsbrutto", value: `${euro(result.monatsBrutto)}${result.istBegrenzt ? " (ueber BBG)" : ""}` },
              { label: "Brutto (begrenzt auf BBG)", value: euro(result.bruttoBegrenzt) },
              { label: "Netto standardisiert", value: euro(result.nettoStandardisiert) },
              { label: "Netto (taeglich)", value: euro(result.nettoTaeglich) },
              { label: "Leistungssatz", value: prozent(result.satzProzent) },
              { label: "Uebergangsgeld (taeglich)", value: euro(result.uebergangsgeldTaeglich) },
            ]}
            footer={{ label: "Uebergangsgeld (monatlich)", value: euro(result.uebergangsgeldMonatlich) }}
          />

          <RechnerHinweis>
            Uebergangsgeld betraegt {result.satzProzent}% des Nettoentgelts
            ({params.hatKind ? "mit Kind" : "ohne Kind"}).
            Es wird waehrend medizinischer oder beruflicher Rehabilitation gezahlt.
            Rechtsgrundlage: SS 20-21 SGB VI / SS 49-52 SGB IX.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
