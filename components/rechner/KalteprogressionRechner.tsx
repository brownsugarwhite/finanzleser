"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type KalteprogressionParams, type KalteprogressionResult } from "@/lib/calculators/kalteprogression";
import { euro, prozent } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerComparisonTable from "./ui/RechnerComparisonTable";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";
import RechnerResults from "./ui/RechnerResults";

export default function KalteprogressionRechner() {
  const [params, setParams] = useState<KalteprogressionParams>({
    monatsBrutto: 3500,
    gehaltssteigerungProzent: 3.0,
    inflationsrateProzent: 2.5,
  });
  const [result, setResult] = useState<KalteprogressionResult | null>(null);

  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  const set = (key: keyof KalteprogressionParams, val: number) =>
    setParams((p) => ({ ...p, [key]: val }));

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Kalte-Progression-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Monatliches Bruttogehalt"
          name="monatsBrutto"
          value={params.monatsBrutto}
          onChange={(v) => set("monatsBrutto", v)}
          einheit="€"
          step={100}
        />

        <RechnerInput
          label="Gehaltserhöhung"
          name="gehaltssteigerungProzent"
          value={params.gehaltssteigerungProzent}
          onChange={(v) => set("gehaltssteigerungProzent", v)}
          einheit="%"
          step={0.1}
        />

        <RechnerInput
          label="Inflationsrate"
          name="inflationsrateProzent"
          value={params.inflationsrateProzent}
          onChange={(v) => set("inflationsrateProzent", v)}
          einheit="%"
          step={0.1}
        />
      </div>

      <RechnerButton onClick={handleBerechnen} />

      {result && (
        <RechnerResults>
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Kalte Progression"
              value={euro(result.kalteProgressionMonat) + " / Monat"}
              highlight
              subtext={euro(result.kalteProgressionJahr) + " / Jahr"}
            />
            <RechnerResultBox
              label="Realer Nettoanstieg"
              value={prozent(result.realerNettoAnstiegProzent)}
              variant={result.realerNettoAnstiegProzent >= 0 ? "positive" : "negative"}
            />
          </div>

          <RechnerComparisonTable
            title="Vergleich: Vorher vs. Nachher (monatlich)"
            scenarios={[
              {
                label: "Vorher",
                rows: [
                  { label: "Bruttogehalt", value: euro(result.bruttoVorher) },
                  { label: "Einkommensteuer", value: euro(result.estVorher) },
                  { label: "Solidaritätszuschlag", value: euro(result.soliVorher) },
                  { label: "Netto", value: euro(result.nettoVorher) },
                  { label: "Steuerquote", value: prozent(result.steuerquoteVorher) },
                ],
              },
              {
                label: "Nachher",
                rows: [
                  { label: "Bruttogehalt", value: euro(result.bruttoNachher) },
                  { label: "Einkommensteuer", value: euro(result.estNachher) },
                  { label: "Solidaritätszuschlag", value: euro(result.soliNachher) },
                  { label: "Netto", value: euro(result.nettoNachher) },
                  { label: "Steuerquote", value: prozent(result.steuerquoteNachher) },
                ],
              },
            ]}
            highlightDifference
          />

          <RechnerResultTable
            rows={[
              { label: "Nominaler Bruttoanstieg", value: `+${euro(result.bruttoAnstiegAbsolut)} (+${prozent(result.bruttoAnstiegProzent)})` },
              { label: "Nominaler Nettoanstieg", value: `+${euro(result.nettoAnstiegAbsolut)} (+${prozent(result.nettoAnstiegProzent)})` },
              { label: "Realer Nettoanstieg", value: `${euro(result.realerNettoAnstiegAbsolut)} (${prozent(result.realerNettoAnstiegProzent)})` },
            ]}
          />

          <RechnerHinweis>
            Berechnung nach §32a EStG 2026. Die kalte Progression entsteht, wenn
            Gehaltserhöhungen durch den progressiven Steuertarif überproportional besteuert werden.
          </RechnerHinweis>
        </RechnerResults>
      )}
    </div>
  );
}
