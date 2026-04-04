"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type WitwenrenteParams, type WitwenrenteResult } from "@/lib/calculators/witwenrente";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerCheckbox from "./ui/RechnerCheckbox";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";

export default function WitwenrenteRechner() {
  const [params, setParams] = useState<WitwenrenteParams>({
    entgeltpunkteVerstorbener: 40,
    eigeneEntgeltpunkte: 15,
    grosseWR: true,
    eigenesEinkommen: 1000,
  });

  const [result, setResult] = useState<WitwenrenteResult | null>(null);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Witwenrente-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Entgeltpunkte des Verstorbenen"
          name="entgeltpunkteVerstorbener"
          value={params.entgeltpunkteVerstorbener}
          onChange={(val) => setParams((p) => ({ ...p, entgeltpunkteVerstorbener: val }))}
          einheit="EP"
          min={0}
          step={0.5}
        />

        <RechnerInput
          label="Eigene Entgeltpunkte"
          name="eigeneEntgeltpunkte"
          value={params.eigeneEntgeltpunkte}
          onChange={(val) => setParams((p) => ({ ...p, eigeneEntgeltpunkte: val }))}
          einheit="EP"
          min={0}
          step={0.5}
        />

        <RechnerCheckbox
          label="Grosse Witwenrente (55 %)"
          name="grosseWR"
          checked={params.grosseWR}
          onChange={(val) => setParams((p) => ({ ...p, grosseWR: val }))}
        />

        <RechnerInput
          label="Eigenes monatliches Nettoeinkommen"
          name="eigenesEinkommen"
          value={params.eigenesEinkommen}
          onChange={(val) => setParams((p) => ({ ...p, eigenesEinkommen: val }))}
          einheit="€/Monat"
          min={0}
          step={100}
        />
      </div>

      <RechnerButton onClick={handleBerechnen} />

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Witwenrente (nach Anrechnung)"
              value={euro(result.witwenrenteNachAnrechnung)}
              highlight={true}
            />
            <RechnerResultBox
              label="Witwenrente (vor Anrechnung)"
              value={euro(result.witwenrenteVorAnrechnung)}
            />
          </div>

          <h4 className="rechner-result-section-title">Berechnung</h4>
          <RechnerResultTable
            rows={[
              { label: "Rente des Verstorbenen", value: euro(result.renteVerstorbener) },
              { label: `Witwenrente (${params.grosseWR ? "55 %" : "25 %"})`, value: euro(result.witwenrenteVorAnrechnung) },
              { label: "Freibetrag", value: euro(result.freibetrag) },
              { label: "Anrechenbare Einkuenfte", value: euro(result.anrechenbareEinkuenfte) },
              { label: "Kuerzung (40 %)", value: euro(result.kuerzung) },
            ]}
            footer={{ label: "Witwenrente nach Anrechnung", value: euro(result.witwenrenteNachAnrechnung) }}
          />

          <RechnerHinweis>
            {params.grosseWR
              ? "Grosse Witwenrente: 55 % der Rente des Verstorbenen, unbefristet."
              : "Kleine Witwenrente: 25 % der Rente des Verstorbenen, befristet auf 24 Monate."
            }
            {" "}Eigenes Einkommen ueber dem Freibetrag ({euro(result.freibetrag)}) wird zu 40 % angerechnet.
            Quelle: §§ 46, 97 SGB VI.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
