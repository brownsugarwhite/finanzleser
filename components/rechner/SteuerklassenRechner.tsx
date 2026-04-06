"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type SteuerklassenParams, type SteuerklassenResult } from "@/lib/calculators/steuerklassen";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerSelect from "./ui/RechnerSelect";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerMultiColumnTable from "./ui/RechnerMultiColumnTable";
import RechnerConditionalGroup from "./ui/RechnerConditionalGroup";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";
import { useRechnerState } from "@/lib/hooks/useRechnerState";
import RechnerResults from "./ui/RechnerResults";

export default function SteuerklassenRechner() {
  const [modus, setModus] = useState<"single" | "paar">("single");
  const [monatsBrutto, setMonatsBrutto] = useState(3500);
  const [monatsBruttoPartner, setMonatsBruttoPartner] = useState(2000);
  const [result, setResult] = useState<SteuerklassenResult | null>(null);
  const rechnerState = useRechnerState(params);

  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne({ modus, monatsBrutto, monatsBruttoPartner }, rates));
    rechnerState.markCalculated();
  }, [modus, monatsBrutto, monatsBruttoPartner, rates]);

  const columns = [
    { key: "beschreibung", label: "Steuerklasse", align: "left" as const },
    { key: "netto", label: "Netto", align: "right" as const },
    { key: "lohnsteuer", label: "Lohnsteuer", align: "right" as const },
    { key: "soli", label: "Soli", align: "right" as const },
  ];

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Steuerklassen-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerSelect
          label="Familienstand"
          name="modus"
          value={modus}
          onChange={(v) => setModus(v as "single" | "paar")}
          options={[
            { label: "Einzelperson", value: "single" },
            { label: "Ehepaar / Lebenspartnerschaft", value: "paar" },
          ]}
        />

        <RechnerInput
          label="Monatliches Bruttogehalt"
          name="monatsBrutto"
          value={monatsBrutto}
          onChange={setMonatsBrutto}
          einheit="€"
          step={100}
        />

        <RechnerConditionalGroup visible={modus === "paar"}>
          <RechnerInput
            label="Bruttogehalt Partner/in"
            name="monatsBruttoPartner"
            value={monatsBruttoPartner}
            onChange={setMonatsBruttoPartner}
            einheit="€"
            step={100}
          />
        </RechnerConditionalGroup>
      <RechnerButton onClick={handleBerechnen} disabled={rechnerState.buttonDisabled} needsUpdate={rechnerState.needsUpdate} />

      </div>

      {result && (
        <RechnerResults scrollKey={rechnerState.scrollKey}>
          {result.empfehlung && (
            <div className="rechner-result-boxes">
              <RechnerResultBox
                label="Empfehlung"
                value={result.empfehlung}
                highlight
                variant={result.vorteilBetrag && result.vorteilBetrag > 0 ? "positive" : "neutral"}
              />
            </div>
          )}

          <RechnerMultiColumnTable
            columns={columns}
            rows={result.vergleich.map((v) => ({
              beschreibung: v.beschreibung,
              netto: euro(v.netto),
              lohnsteuer: euro(v.lohnsteuer),
              soli: euro(v.soli),
            }))}
            groupSeparators={modus === "paar" ? [2] : []}
          />

          <RechnerHinweis>
            Berechnung nach §38b EStG / §32a EStG 2026. Kirchensteuer und individueller
            KV-Zusatzbeitrag sind hier nicht berücksichtigt.
          </RechnerHinweis>
        </RechnerResults>
      )}
    </div>
  );
}
