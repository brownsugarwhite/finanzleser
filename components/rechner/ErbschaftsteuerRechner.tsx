"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type ErbschaftsteuerParams, type ErbschaftsteuerResult, type Verwandtschaft } from "@/lib/calculators/erbschaftsteuer";
import { euro, prozent } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerSelect from "./ui/RechnerSelect";
import RechnerCheckbox from "./ui/RechnerCheckbox";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";
import RechnerResults from "./ui/RechnerResults";

export default function ErbschaftsteuerRechner() {
  const [params, setParams] = useState<ErbschaftsteuerParams>({
    erbschaftswert: 300000,
    verwandtschaft: "kind",
    alterKind: 10,
    istErbschaft: true,
    bereitsEmpfangen: 0,
  });

  const [result, setResult] = useState<ErbschaftsteuerResult | null>(null);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  const showAlterKind = params.verwandtschaft === "kind";

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Erbschaftsteuerrechner</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Erbschaftswert"
          name="erbschaftswert"
          value={params.erbschaftswert}
          onChange={(val) => setParams((prev) => ({ ...prev, erbschaftswert: val }))}
          einheit="€"
          step={10000}
          min={0}
        />

        <RechnerSelect
          label="Verwandtschaftsverhältnis"
          name="verwandtschaft"
          value={params.verwandtschaft}
          onChange={(val) => setParams((prev) => ({ ...prev, verwandtschaft: val as Verwandtschaft }))}
          options={[
            { label: "Ehegatte / Lebenspartner", value: "ehegatte" },
            { label: "Kind / Stiefkind", value: "kind" },
            { label: "Enkel", value: "enkel" },
            { label: "Geschwister", value: "geschwister" },
            { label: "Sonstige Personen", value: "sonstige" },
          ]}
        />

        {showAlterKind && (
          <RechnerInput
            label="Alter des Kindes"
            name="alterKind"
            value={params.alterKind}
            onChange={(val) => setParams((prev) => ({ ...prev, alterKind: val }))}
            einheit="Jahre"
            step={1}
            min={0}
            max={27}
          />
        )}

        <RechnerCheckbox
          label="Erbschaft (nicht Schenkung)"
          name="istErbschaft"
          checked={params.istErbschaft}
          onChange={(val) => setParams((prev) => ({ ...prev, istErbschaft: val }))}
        />

        <RechnerInput
          label="Bereits empfangene Schenkungen (10 Jahre)"
          name="bereitsEmpfangen"
          value={params.bereitsEmpfangen}
          onChange={(val) => setParams((prev) => ({ ...prev, bereitsEmpfangen: val }))}
          einheit="€"
          step={10000}
          min={0}
          tooltip="Schenkungen der letzten 10 Jahre reduzieren den verfügbaren Freibetrag"
        />
      </div>

      <RechnerButton onClick={handleBerechnen} />

      {result && (
        <RechnerResults>
          <div className="rechner-result-boxes">
            <RechnerResultBox label="Erbschaftsteuer" value={euro(result.erbschaftsteuer)} highlight />
            <RechnerResultBox label="Nettowert" value={euro(result.nettowert)} variant="positive" />
            <RechnerResultBox label="Effektiver Steuersatz" value={prozent(result.effektiverSatzProzent)} />
          </div>

          <RechnerResultTable
            rows={[
              { label: "Verwandtschaft", value: result.verwandtschaftText },
              { label: "Steuerklasse", value: String(result.steuerklasse) },
              { label: "Erbschaftswert", value: euro(params.erbschaftswert) },
              { label: "Persönlicher Freibetrag", value: euro(result.persoenlichFreibetrag) },
              { label: "Versorgungsfreibetrag", value: euro(result.versorgungsfreibetrag) },
              { label: "Gesamtfreibetrag", value: euro(result.gesamtFreibetrag) },
              { label: "Verfügbarer Freibetrag", value: euro(result.verfuegbarerFreibetrag) },
              { label: "Steuerpflichtiger Erwerb", value: euro(result.steuerpflichtigerErwerb) },
              { label: "Steuersatz", value: prozent(result.steuersatzProzent) },
              { label: "Erbschaftsteuer", value: euro(result.erbschaftsteuer) },
              { label: "Nettowert", value: euro(result.nettowert) },
              { label: "Effektiver Steuersatz", value: prozent(result.effektiverSatzProzent) },
            ]}
          />

          <RechnerHinweis>
            Die Erbschaftsteuer verwendet einen Stufentarif (nicht progressiv). Der Steuersatz
            gilt auf den gesamten steuerpflichtigen Erwerb. Der Versorgungsfreibetrag gilt nur
            bei Erbschaften, nicht bei Schenkungen. Konsultieren Sie einen Steuerberater.
          </RechnerHinweis>
        </RechnerResults>
      )}
    </div>
  );
}
