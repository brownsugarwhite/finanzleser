"use client";

import { useState, useEffect } from "react";
import { berechne, type MehrwertsteuerParams, type MehrwertsteuerResult } from "@/lib/calculators/mehrwertsteuer";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerSelect from "./ui/RechnerSelect";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";

export default function MehrwertsteuerRechner() {
  const [params, setParams] = useState<MehrwertsteuerParams>({
    betrag: 100,
    richtung: "netto-brutto",
    steuersatz: 19,
  });

  const [result, setResult] = useState<MehrwertsteuerResult | null>(null);

  useEffect(() => {
    setResult(berechne(params));
  }, [params]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Mehrwertsteuer-Rechner</h3>

      <div className="rechner-inputs">
        <RechnerSelect
          label="Berechnung"
          name="richtung"
          value={params.richtung}
          onChange={(val) =>
            setParams((prev) => ({ ...prev, richtung: val as "brutto-netto" | "netto-brutto" }))
          }
          options={[
            { label: "Netto → Brutto", value: "netto-brutto" },
            { label: "Brutto → Netto", value: "brutto-netto" },
          ]}
        />

        <RechnerSelect
          label="Steuersatz"
          name="steuersatz"
          value={params.steuersatz.toString()}
          onChange={(val) => setParams((prev) => ({ ...prev, steuersatz: parseInt(val) as 19 | 7 }))}
          options={[
            { label: "Regelsteuersatz (19%)", value: "19" },
            { label: "Ermäßigter Steuersatz (7%)", value: "7" },
          ]}
        />

        <RechnerInput
          label={params.richtung === "netto-brutto" ? "Nettobetrag" : "Bruttobetrag"}
          name="betrag"
          value={params.betrag}
          onChange={(val) => setParams((prev) => ({ ...prev, betrag: val }))}
          einheit="€"
          step={10}
          min={0}
        />
      </div>

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox label="Netto" value={euro(result.netto)} />
            <RechnerResultBox label="MwSt" value={euro(result.mehrwertsteuer)} />
            <RechnerResultBox label="Brutto" value={euro(result.brutto)} highlight={true} />
          </div>

          <RechnerResultTable
            rows={[
              { label: "Nettobetrag", value: euro(result.netto) },
              { label: `Mehrwertsteuer (${result.steuersatz}%)`, value: euro(result.mehrwertsteuer) },
              { label: "Bruttobetrag", value: euro(result.brutto) },
            ]}
          />

          <RechnerHinweis>
            Regelsteuersatz 19% für die meisten Waren und Dienstleistungen. Ermäßigter Satz 7%
            für Lebensmittel, Bücher und weitere Kategorien.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
