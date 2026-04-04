"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type EinkommensteuerParams, type EinkommensteuerResult } from "@/lib/calculators/einkommensteuer";
import { euro, prozent } from "@/lib/calculators/utils";
import { BUNDESLAENDER_OPTIONS } from "@/lib/calculators/shared/kirchensteuer";
import RechnerInput from "./ui/RechnerInput";
import RechnerSelect from "./ui/RechnerSelect";
import RechnerCheckbox from "./ui/RechnerCheckbox";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerMultiColumnTable from "./ui/RechnerMultiColumnTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";

const SK_OPTIONS = [
  { label: "I – Ledig", value: "1" },
  { label: "II – Alleinerziehend", value: "2" },
  { label: "III – Verheiratet (höheres Einkommen)", value: "3" },
  { label: "IV – Verheiratet (ähnliches Einkommen)", value: "4" },
  { label: "V – Verheiratet (Ehegatte hat III)", value: "5" },
  { label: "VI – Zweitjob", value: "6" },
];

export default function EinkommensteuerRechner() {
  const [params, setParams] = useState<EinkommensteuerParams>({
    jahresBrutto: 50000,
    steuerklasse: 1,
    bundesland: "Nordrhein-Westfalen",
    kirchenmitglied: false,
    werbungskosten: 0,
    sonderausgaben: 0,
    aussergewoehnlicheBelastungen: 0,
  });
  const [showExtras, setShowExtras] = useState(false);
  const [result, setResult] = useState<EinkommensteuerResult | null>(null);

  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  const set = (key: keyof EinkommensteuerParams, val: number | string | boolean) =>
    setParams((p) => ({ ...p, [key]: val }));

  const columns = [
    { key: "position", label: "Position", align: "left" as const },
    { key: "jaehrlich", label: "Jährlich", align: "right" as const },
    { key: "monatlich", label: "Monatlich", align: "right" as const },
  ];

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Einkommensteuer-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Jahresbruttoeinkommen"
          name="jahresBrutto"
          value={params.jahresBrutto}
          onChange={(v) => set("jahresBrutto", v)}
          einheit="€"
          step={1000}
        />

        <RechnerSelect
          label="Steuerklasse"
          name="steuerklasse"
          value={params.steuerklasse.toString()}
          onChange={(v) => set("steuerklasse", parseInt(v))}
          options={SK_OPTIONS}
        />

        <RechnerSelect
          label="Bundesland"
          name="bundesland"
          value={params.bundesland}
          onChange={(v) => set("bundesland", v)}
          options={BUNDESLAENDER_OPTIONS}
        />

        <RechnerCheckbox
          label="Kirchenmitglied"
          name="kirchenmitglied"
          checked={params.kirchenmitglied}
          onChange={(v) => set("kirchenmitglied", v)}
        />

        <div className="rechner-extras-toggle">
          <button
            type="button"
            className="rechner-toggle-btn"
            onClick={() => setShowExtras(!showExtras)}
          >
            {showExtras ? "Weitere Abzüge ausblenden" : "Weitere Abzüge einblenden"}
          </button>
        </div>

        {showExtras && (
          <>
            <RechnerInput
              label="Werbungskosten"
              name="werbungskosten"
              value={params.werbungskosten ?? 0}
              onChange={(v) => set("werbungskosten", v)}
              einheit="€"
              step={100}
              tooltip={`Pauschbetrag: ${euro(rates.lohnsteuer.arbeitnehmer_pauschbetrag)}`}
            />
            <RechnerInput
              label="Sonderausgaben"
              name="sonderausgaben"
              value={params.sonderausgaben ?? 0}
              onChange={(v) => set("sonderausgaben", v)}
              einheit="€"
              step={100}
            />
            <RechnerInput
              label="Außergewöhnliche Belastungen"
              name="agb"
              value={params.aussergewoehnlicheBelastungen ?? 0}
              onChange={(v) => set("aussergewoehnlicheBelastungen", v)}
              einheit="€"
              step={100}
            />
          </>
        )}
      </div>

      <RechnerButton onClick={handleBerechnen} />

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Gesamtsteuer"
              value={euro(result.gesamtsteuer)}
              highlight
              subtext={`Effektiver Steuersatz: ${prozent(result.effektiverSteuersatz)}`}
            />
            <RechnerResultBox
              label="Netto-Einkommen"
              value={euro(result.nettoEinkommen)}
              subtext={`Grenzsteuersatz: ${prozent(result.grenzsteuersatz)}`}
            />
          </div>

          <RechnerMultiColumnTable
            columns={columns}
            rows={[
              { position: "Zu versteuerndes Einkommen", jaehrlich: euro(result.zvE), monatlich: euro(result.zvE / 12) },
              { position: "Einkommensteuer", jaehrlich: euro(result.einkommensteuer), monatlich: euro(result.einkommensteuerMonatlich) },
              { position: "Solidaritätszuschlag", jaehrlich: euro(result.solidaritaetszuschlag), monatlich: euro(result.solidaritaetszuschlagMonatlich) },
              { position: "Kirchensteuer", jaehrlich: euro(result.kirchensteuer), monatlich: euro(result.kirchensteuerMonatlich) },
              { position: "Gesamtsteuer", jaehrlich: euro(result.gesamtsteuer), monatlich: euro(result.gesamtsteuerMonatlich) },
              { position: "Netto-Einkommen", jaehrlich: euro(result.nettoEinkommen), monatlich: euro(result.nettoEinkommenMonatlich) },
            ]}
            groupSeparators={[3]}
            highlightLastRow
          />

          <RechnerHinweis>
            Berechnung nach §32a EStG 2026. Individuelle Freibeträge, Vorsorgeaufwendungen und Kinderfreibeträge
            können die tatsächliche Steuerlast verändern.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
