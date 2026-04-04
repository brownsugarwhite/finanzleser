"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type BruttoNettoParams, type BruttoNettoResult } from "@/lib/calculators/brutto-netto";
import { euro } from "@/lib/calculators/utils";
import { BUNDESLAENDER_OPTIONS } from "@/lib/calculators/shared/kirchensteuer";
import RechnerInput from "./ui/RechnerInput";
import RechnerSelect from "./ui/RechnerSelect";
import RechnerCheckbox from "./ui/RechnerCheckbox";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerMultiColumnTable from "./ui/RechnerMultiColumnTable";
import RechnerConditionalGroup from "./ui/RechnerConditionalGroup";
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

const KINDER_OPTIONS = [
  { label: "0", value: "0" },
  { label: "1", value: "1" },
  { label: "2", value: "2" },
  { label: "3", value: "3" },
  { label: "4", value: "4" },
  { label: "5+", value: "5" },
];

export default function BruttoNettoRechner() {
  const [params, setParams] = useState<BruttoNettoParams>({
    monatsBrutto: 3000,
    steuerklasse: 1,
    bundesland: "Nordrhein-Westfalen",
    kirchenmitglied: false,
    kinderAnzahl: 1,
    kinderlosUeber23: false,
    kvZusatzbeitrag: 2.9,
  });
  const [result, setResult] = useState<BruttoNettoResult | null>(null);

  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    const p = {
      ...params,
      kvZusatzbeitrag: params.kvZusatzbeitrag || rates.sozialversicherung.krankenversicherung.durchschnittlicher_zusatzbeitrag_prozent,
    };
    setResult(berechne(p, rates));
  }, [params, rates]);

  const set = (key: keyof BruttoNettoParams, val: number | string | boolean) =>
    setParams((p) => ({ ...p, [key]: val }));

  const columns = [
    { key: "position", label: "Position", align: "left" as const },
    { key: "monatlich", label: "Monatlich", align: "right" as const },
    { key: "jaehrlich", label: "Jährlich", align: "right" as const },
  ];

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Brutto-Netto-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Monatliches Bruttogehalt"
          name="monatsBrutto"
          value={params.monatsBrutto}
          onChange={(v) => set("monatsBrutto", v)}
          einheit="€"
          step={100}
          min={1}
          max={150000}
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

        <RechnerSelect
          label="Kinder unter 25"
          name="kinderAnzahl"
          value={params.kinderAnzahl.toString()}
          onChange={(v) => {
            const n = parseInt(v);
            set("kinderAnzahl", n);
            if (n > 0) setParams((p) => ({ ...p, kinderAnzahl: n, kinderlosUeber23: false }));
          }}
          options={KINDER_OPTIONS}
        />

        <RechnerConditionalGroup visible={params.kinderAnzahl === 0}>
          <RechnerCheckbox
            label="Kinderlos und über 23 Jahre"
            name="kinderlosUeber23"
            checked={params.kinderlosUeber23}
            onChange={(v) => set("kinderlosUeber23", v)}
          />
        </RechnerConditionalGroup>

        <RechnerInput
          label="KV-Zusatzbeitrag"
          name="kvZusatzbeitrag"
          value={params.kvZusatzbeitrag}
          onChange={(v) => set("kvZusatzbeitrag", v)}
          einheit="%"
          step={0.1}
          min={0}
          max={10}
        />
      </div>

      <RechnerButton onClick={handleBerechnen} />

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox label="Nettolohn" value={euro(result.netto)} highlight />
            <RechnerResultBox label="Netto (jährlich)" value={euro(result.nettoJahr)} />
          </div>

          <RechnerMultiColumnTable
            columns={columns}
            rows={[
              { position: "Bruttogehalt", monatlich: euro(result.monatsBrutto), jaehrlich: euro(result.jahresBrutto) },
              { position: "Rentenversicherung", monatlich: euro(result.sv.rv), jaehrlich: euro(result.svJahr.rv) },
              { position: "Krankenversicherung", monatlich: euro(result.sv.kv), jaehrlich: euro(result.svJahr.kv) },
              { position: "Pflegeversicherung", monatlich: euro(result.sv.pv), jaehrlich: euro(result.svJahr.pv) },
              { position: "Arbeitslosenversicherung", monatlich: euro(result.sv.alv), jaehrlich: euro(result.svJahr.alv) },
              { position: "Sozialversicherung gesamt", monatlich: euro(result.sv.gesamt), jaehrlich: euro(result.svJahr.gesamt) },
              { position: "Lohnsteuer", monatlich: euro(result.lohnsteuer), jaehrlich: euro(result.lohnsteuerJahr) },
              { position: "Solidaritätszuschlag", monatlich: euro(result.solidaritaetszuschlag), jaehrlich: euro(result.solidaritaetszuschlagJahr) },
              { position: "Kirchensteuer", monatlich: euro(result.kirchensteuer), jaehrlich: euro(result.kirchensteuerJahr) },
              { position: "Steuern gesamt", monatlich: euro(result.steuernGesamt), jaehrlich: euro(result.steuernGesamtJahr) },
              { position: "Gesamtabzüge", monatlich: euro(result.gesamtAbzuege), jaehrlich: euro(result.gesamtAbzuegeJahr) },
              { position: "Nettolohn", monatlich: euro(result.netto), jaehrlich: euro(result.nettoJahr) },
            ]}
            groupSeparators={[4, 8, 9]}
            highlightLastRow
          />

          <RechnerHinweis>
            Kirchensteuer und eigener KV-Zusatzbeitrag berücksichtigt. Individuelle Freibeträge
            und Sonderausgaben sind nicht enthalten.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
