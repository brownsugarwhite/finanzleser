"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type MehrwertsteuerParams, type MehrwertsteuerResult } from "@/lib/calculators/mehrwertsteuer";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerSelect from "./ui/RechnerSelect";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";
import RechnerResults from "./ui/RechnerResults";

export default function MehrwertsteuerRechner() {
  const [params, setParams] = useState<MehrwertsteuerParams>({
    betrag: 100,
    richtung: "netto",
    steuersatz: "regelsteuersatz",
  });
  const [result, setResult] = useState<MehrwertsteuerResult | null>(null);

  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Mehrwertsteuer-Rechner</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Betrag"
          name="betrag"
          value={params.betrag}
          onChange={(v) => setParams((p) => ({ ...p, betrag: v }))}
          einheit="€"
          step={1}
        />

        <RechnerSelect
          label="Eingabe ist"
          name="richtung"
          value={params.richtung}
          onChange={(v) => setParams((p) => ({ ...p, richtung: v as "netto" | "brutto" }))}
          options={[
            { label: "Nettobetrag", value: "netto" },
            { label: "Bruttobetrag", value: "brutto" },
          ]}
        />

        <RechnerSelect
          label="Steuersatz"
          name="steuersatz"
          value={params.steuersatz}
          onChange={(v) => setParams((p) => ({ ...p, steuersatz: v as "regelsteuersatz" | "ermaessigt" }))}
          options={[
            { label: `${rates.mehrwertsteuer.regelsteuersatz_prozent} % (Regelsteuersatz)`, value: "regelsteuersatz" },
            { label: `${rates.mehrwertsteuer.ermaessigter_steuersatz_prozent} % (Ermäßigt)`, value: "ermaessigt" },
          ]}
        />
      </div>

      <RechnerButton onClick={handleBerechnen} />

      {result && (
        <RechnerResults>
          <div className="rechner-result-boxes">
            <RechnerResultBox label="Bruttobetrag" value={euro(result.brutto)} highlight />
          </div>

          <RechnerResultTable
            rows={[
              { label: "Nettobetrag", value: euro(result.netto) },
              { label: `Mehrwertsteuer (${result.steuersatzProzent} %)`, value: euro(result.mwst) },
              { label: "Bruttobetrag", value: euro(result.brutto) },
            ]}
          />

          <RechnerHinweis>
            Regelsteuersatz {rates.mehrwertsteuer.regelsteuersatz_prozent} % (unverändert seit 2007).
            Ermäßigter Satz {rates.mehrwertsteuer.ermaessigter_steuersatz_prozent} % für Lebensmittel, Bücher, Zeitungen u.a.
          </RechnerHinweis>
        </RechnerResults>
      )}
    </div>
  );
}
