"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type RentenbesteuerungParams, type RentenbesteuerungResult } from "@/lib/calculators/rentenbesteuerung";
import { euro, prozent } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";
import { useRechnerState } from "@/lib/hooks/useRechnerState";
import RechnerResults from "./ui/RechnerResults";

export default function RentenbesteuerungRechner() {
  const [params, setParams] = useState<RentenbesteuerungParams>({
    monatlicheRente: 1500,
    rentenBeginnJahr: 2026,
  });

  const [result, setResult] = useState<RentenbesteuerungResult | null>(null);
  const rechnerState = useRechnerState(params);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
    rechnerState.markCalculated();
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Rentenbesteuerung-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Monatliche Rente (brutto)"
          name="monatlicheRente"
          value={params.monatlicheRente}
          onChange={(val) => setParams((p) => ({ ...p, monatlicheRente: val }))}
          einheit="€/Monat"
          min={0}
          step={100}
        />

        <RechnerInput
          label="Rentenbeginn (Jahr)"
          name="rentenBeginnJahr"
          value={params.rentenBeginnJahr}
          onChange={(val) => setParams((p) => ({ ...p, rentenBeginnJahr: val }))}
          min={2005}
          max={2058}
          step={1}
        />
      <RechnerButton onClick={handleBerechnen} disabled={rechnerState.buttonDisabled} needsUpdate={rechnerState.needsUpdate} />

      </div>

      {result && (
        <RechnerResults scrollKey={rechnerState.scrollKey}>
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Einkommensteuer auf Rente"
              value={euro(result.estAufRente)}
              highlight={true}
            />
            <RechnerResultBox
              label="Besteuerungsanteil"
              value={prozent(result.besteuerungsanteilProzent)}
            />
          </div>

          <h4 className="rechner-result-section-title">Berechnung</h4>
          <RechnerResultTable
            rows={[
              { label: "Rente jaehrlich", value: euro(params.monatlicheRente * 12) },
              { label: "Besteuerungsanteil", value: prozent(result.besteuerungsanteilProzent) },
              { label: "Steuerpflichtiger Anteil", value: euro(result.steuerpflichtigAnteil) },
              { label: "Werbungskosten-Pauschbetrag", value: euro(result.wkPauschbetrag) },
              { label: "Zu versteuerndes Einkommen", value: euro(result.zvEAusRente) },
            ]}
            footer={{ label: "Einkommensteuer auf Rente", value: euro(result.estAufRente) }}
          />

          <RechnerHinweis>
            Der Besteuerungsanteil fuer Rentenbeginn {params.rentenBeginnJahr} betraegt {prozent(result.besteuerungsanteilProzent)}.
            Bis 2058 steigt der Besteuerungsanteil auf 100 %. Die Berechnung beruecksichtigt den
            Werbungskosten-Pauschbetrag von {euro(result.wkPauschbetrag)} und die ESt nach § 32a EStG.
            Soli und Kirchensteuer sind nicht enthalten.
            Quelle: § 22 Nr. 1 Satz 3 Buchst. a EStG.
          </RechnerHinweis>
        </RechnerResults>
      )}
    </div>
  );
}
