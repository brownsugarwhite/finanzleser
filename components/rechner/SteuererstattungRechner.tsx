"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type SteuererstattungParams, type SteuererstattungResult } from "@/lib/calculators/steuererstattung";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";
import { useRechnerState } from "@/lib/hooks/useRechnerState";
import RechnerResults from "./ui/RechnerResults";

export default function SteuererstattungRechner() {
  const [params, setParams] = useState<SteuererstattungParams>({
    jahresBrutto: 42000,
    gezahlteLohnsteuer: 7500,
    gezahlterSoli: 0,
    werbungskostenTatsaechlich: 0,
    homeofficeTage: 0,
    sonderausgabenTatsaechlich: 0,
    aussergewoehnlicheBelastungen: 0,
    handwerkerkosten: 0,
  });
  const [result, setResult] = useState<SteuererstattungResult | null>(null);
  const rechnerState = useRechnerState(params);

  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
    rechnerState.markCalculated();
  }, [params, rates]);

  const set = (key: keyof SteuererstattungParams, val: number) =>
    setParams((p) => ({ ...p, [key]: val }));

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Steuererstattungs-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Jahres-Bruttolohn"
          name="jahresBrutto"
          value={params.jahresBrutto}
          onChange={(v) => set("jahresBrutto", v)}
          einheit="€"
          step={1000}
        />

        <RechnerInput
          label="Gezahlte Lohnsteuer"
          name="gezahlteLohnsteuer"
          value={params.gezahlteLohnsteuer}
          onChange={(v) => set("gezahlteLohnsteuer", v)}
          einheit="€"
          step={100}
        />

        <RechnerInput
          label="Gezahlter Solidaritätszuschlag"
          name="gezahlterSoli"
          value={params.gezahlterSoli}
          onChange={(v) => set("gezahlterSoli", v)}
          einheit="€"
          step={10}
        />

        <RechnerInput
          label="Werbungskosten (tatsächlich)"
          name="werbungskostenTatsaechlich"
          value={params.werbungskostenTatsaechlich}
          onChange={(v) => set("werbungskostenTatsaechlich", v)}
          einheit="€"
          step={100}
          tooltip={`Pauschbetrag: ${euro(rates.lohnsteuer.arbeitnehmer_pauschbetrag)}`}
        />

        <RechnerInput
          label="Homeoffice-Tage"
          name="homeofficeTage"
          value={params.homeofficeTage}
          onChange={(v) => set("homeofficeTage", v)}
          einheit="Tage"
          step={1}
          max={rates.steuererstattung.homeoffice_max_tage}
          tooltip={`Max. ${rates.steuererstattung.homeoffice_max_tage} Tage à ${euro(rates.steuererstattung.homeoffice_pauschale_je_tag)}`}
        />

        <RechnerInput
          label="Sonderausgaben (tatsächlich)"
          name="sonderausgabenTatsaechlich"
          value={params.sonderausgabenTatsaechlich}
          onChange={(v) => set("sonderausgabenTatsaechlich", v)}
          einheit="€"
          step={100}
        />

        <RechnerInput
          label="Außergewöhnliche Belastungen"
          name="aussergewoehnlicheBelastungen"
          value={params.aussergewoehnlicheBelastungen}
          onChange={(v) => set("aussergewoehnlicheBelastungen", v)}
          einheit="€"
          step={100}
        />

        <RechnerInput
          label="Handwerkerleistungen (Lohnkosten)"
          name="handwerkerkosten"
          value={params.handwerkerkosten}
          onChange={(v) => set("handwerkerkosten", v)}
          einheit="€"
          step={100}
          tooltip={`§35a EStG: ${rates.steuererstattung.handwerker_ermaessigung_prozent}% Ermäßigung, max. ${euro(rates.steuererstattung.handwerker_max_ermaessigung)}`}
        />
      <RechnerButton onClick={handleBerechnen} disabled={rechnerState.buttonDisabled} needsUpdate={rechnerState.needsUpdate} />

      </div>

      {result && (
        <RechnerResults scrollKey={rechnerState.scrollKey}>
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label={result.istErstattung ? "Voraussichtliche Erstattung" : "Voraussichtliche Nachzahlung"}
              value={euro(Math.abs(result.erstattungGesamt))}
              highlight
              variant={result.istErstattung ? "positive" : "negative"}
            />
          </div>

          <RechnerResultTable
            rows={[
              { label: "Jahres-Bruttolohn", value: euro(result.jahresBrutto) },
              { label: "Werbungskosten (angesetzt)", value: euro(result.werbungskosten) },
              { label: "Homeoffice-Pauschale", value: euro(result.homeofficePauschale) },
              { label: "Sonderausgaben", value: euro(result.sonderausgaben) },
              { label: "Außergewöhnliche Belastungen", value: euro(result.aussergewoehnlicheBelastungen) },
              { label: "Zu versteuerndes Einkommen", value: euro(result.zvE) },
              { label: "Einkommensteuer (Soll)", value: euro(result.estSoll) },
              { label: "Handwerker-Ermäßigung (§35a)", value: `–${euro(result.handwerkerErmaessigung)}` },
              { label: "Soli (Soll)", value: euro(result.soliSoll) },
              { label: "Gezahlte Lohnsteuer", value: euro(params.gezahlteLohnsteuer) },
              { label: "Gezahlter Soli", value: euro(params.gezahlterSoli) },
            ]}
            footer={{
              label: result.istErstattung ? "Erstattung" : "Nachzahlung",
              value: euro(Math.abs(result.erstattungGesamt)),
            }}
          />

          <RechnerHinweis>
            Vereinfachte Berechnung. Kirchensteuer, Kinderfreibeträge und individuelle
            Sonderausgabenabzüge sind nicht berücksichtigt.
          </RechnerHinweis>
        </RechnerResults>
      )}
    </div>
  );
}
