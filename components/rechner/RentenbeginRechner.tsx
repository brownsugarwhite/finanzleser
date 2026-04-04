"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type RentenbeginnParams, type RentenbeginnResult } from "@/lib/calculators/rentenbeginn";
import { prozent } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerCheckbox from "./ui/RechnerCheckbox";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";

function formatAlter(alter: { jahre: number; monate: number }): string {
  if (alter.monate === 0) return `${alter.jahre} Jahre`;
  return `${alter.jahre} Jahre, ${alter.monate} Monate`;
}

export default function RentenbeginRechner() {
  const [params, setParams] = useState<RentenbeginnParams>({
    geburtsjahr: 1970,
    schwerbehinderung: false,
    langjVersichert: false,
  });

  const [result, setResult] = useState<RentenbeginnResult | null>(null);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Rentenbeginn-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Geburtsjahr"
          name="geburtsjahr"
          value={params.geburtsjahr}
          onChange={(val) => setParams((p) => ({ ...p, geburtsjahr: val }))}
          min={1940}
          max={2000}
          step={1}
        />

        <RechnerCheckbox
          label="Schwerbehinderung (GdB mind. 50)"
          name="schwerbehinderung"
          checked={params.schwerbehinderung}
          onChange={(val) => setParams((p) => ({ ...p, schwerbehinderung: val }))}
        />

        <RechnerCheckbox
          label="Besonders langjaehrig versichert (45+ Beitragsjahre)"
          name="langjVersichert"
          checked={params.langjVersichert}
          onChange={(val) => setParams((p) => ({ ...p, langjVersichert: val }))}
        />
      </div>

      <RechnerButton onClick={handleBerechnen} />

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Regelaltersgrenze"
              value={formatAlter(result.regelaltersgrenze)}
              highlight={true}
            />
            <RechnerResultBox
              label="Fruehester Rentenbeginn"
              value={formatAlter(result.fruehesterRentenbeginn)}
            />
          </div>

          <h4 className="rechner-result-section-title">Details</h4>
          <RechnerResultTable
            rows={[
              { label: "Regelaltersgrenze", value: formatAlter(result.regelaltersgrenze) },
              { label: "Fruehester Rentenbeginn", value: formatAlter(result.fruehesterRentenbeginn) },
              { label: "Abschlag (Monate)", value: `${result.abschlagMonate} Monate` },
              { label: "Abschlag (Prozent)", value: prozent(result.abschlagProzent) },
            ]}
          />

          <RechnerHinweis>
            {result.abschlagProzent > 0
              ? `Bei Rentenbeginn mit ${formatAlter(result.fruehesterRentenbeginn)} ergibt sich ein dauerhafter Abschlag von ${prozent(result.abschlagProzent)} (${result.abschlagMonate} Monate x 0,3%).`
              : "Sie koennen abschlagsfrei in Rente gehen."
            }
            {" "}Quelle: § 35, § 236 SGB VI.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
