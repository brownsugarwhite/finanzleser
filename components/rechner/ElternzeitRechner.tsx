"use client";

import { useState, useEffect } from "react";
import { useRates } from "@/lib/hooks/useRates";
import {
  berechne,
  type ElternzeitParams,
  type ElternzeitResult
} from "@/lib/calculators/elternzeit";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";

export default function ElternzeitRechner() {
  const today = new Date();
  const defaultDate = new Date(today.getFullYear() - 1, today.getMonth(), 15);
  const defaultDateString = defaultDate.toISOString().split("T")[0];

  const [params, setParams] = useState<ElternzeitParams>({
    geburtsdatum: defaultDateString,
    elternteil1_monate: 12,
    elternteil2_monate: 12
  });

  const [result, setResult] = useState<ElternzeitResult | null>(null);
  const rates = useRates();

  useEffect(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  const handleParamChange = (key: keyof ElternzeitParams, value: any) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const fmt = (d: Date) =>
    new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(d);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Elternzeit-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Geburtsdatum des Kindes"
          name="geburtsdatum"
          value={params.geburtsdatum}
          onChange={(val) =>
            handleParamChange("geburtsdatum", val)
          }

        />

        <RechnerInput
          label="Elternteil 1: Elternzeit (Monate)"
          name="elternteil1_monate"
          value={params.elternteil1_monate || 0}
          onChange={(val) =>
            handleParamChange("elternteil1_monate", Number(val))
          }
          einheit="Monate"
          min={0}
          max={36}
        />

        <RechnerInput
          label="Elternteil 2: Elternzeit (Monate)"
          name="elternteil2_monate"
          value={params.elternteil2_monate || 0}
          onChange={(val) =>
            handleParamChange("elternteil2_monate", Number(val))
          }
          einheit="Monate"
          min={0}
          max={36}
        />
      </div>

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Gesamte Elternzeit"
              value={`${result.gesamt_monate} Monate`}
              highlight={!result.ueberschreitung}
            />
            {result.ueberschreitung > 0 && (
              <RechnerResultBox
                label="Überschreitung"
                value={`${result.ueberschreitung} Monate`}
                highlight={false}
              />
            )}
          </div>

          {result.gueltig && (
            <>
              <h4 className="rechner-result-section-title">Zeiträume</h4>
              <RechnerResultTable
                rows={[
                  { label: "Elternzeit beginnt", value: fmt(result.et_beginn) },
                  {
                    label: "Elternteil 1 endet",
                    value: fmt(result.et1_ende)
                  },
                  {
                    label: "Kind max. 8 Jahre alt",
                    value: fmt(result.max_ende)
                  }
                ]}
              />

              <RechnerHinweis>
                Elternzeit ist auf 36 Monate begrenzt (§ 15 BEEG). Anmeldung
                mindestens 7 Wochen vorher erforderlich. Grundlage: BEEG 2024.
              </RechnerHinweis>
            </>
          )}

          {result.ueberschreitung > 0 && (
            <RechnerHinweis >
              ⚠️ Die Gesamtelternzeit überschreitet die gesetzliche Höchstdauer
              von 36 Monaten um {result.ueberschreitung} Monate.
            </RechnerHinweis>
          )}
        </div>
      )}
    </div>
  );
}
