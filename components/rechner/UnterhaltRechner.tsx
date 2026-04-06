"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type UnterhaltParams, type UnterhaltResult } from "@/lib/calculators/unterhalt";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerSelect from "./ui/RechnerSelect";
import RechnerCheckbox from "./ui/RechnerCheckbox";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";
import RechnerResults from "./ui/RechnerResults";

const ALTERSSTUFEN_LABELS = ["0-5 Jahre", "6-11 Jahre", "12-17 Jahre", "ab 18 Jahre"];

export default function UnterhaltRechner() {
  const [params, setParams] = useState<UnterhaltParams>({
    nettoEinkommen: 2800,
    sonstigeAbzuege: 0,
    kindAlter: 8,
    unterhaltsberechtigte: 2,
    erwerbstaetig: true,
  });

  const [result, setResult] = useState<UnterhaltResult | null>(null);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Unterhalts-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Nettoeinkommen"
          name="nettoEinkommen"
          value={params.nettoEinkommen}
          onChange={(val) => setParams((p) => ({ ...p, nettoEinkommen: val }))}
          einheit="€"
          step={100}
          min={0}
        />

        <RechnerInput
          label="Sonstige Abzuege"
          name="sonstigeAbzuege"
          value={params.sonstigeAbzuege}
          onChange={(val) => setParams((p) => ({ ...p, sonstigeAbzuege: val }))}
          einheit="€"
          step={50}
          min={0}
          tooltip="Berufliche Aufwendungen ueber die 5%-Pauschale hinaus"
        />

        <RechnerSelect
          label="Alter des Kindes"
          name="kindAlter"
          value={params.kindAlter.toString()}
          onChange={(val) => setParams((p) => ({ ...p, kindAlter: parseInt(val) }))}
          options={Array.from({ length: 26 }, (_, i) => ({
            label: `${i} Jahre`,
            value: i.toString(),
          }))}
        />

        <RechnerSelect
          label="Anzahl Unterhaltsberechtigte"
          name="unterhaltsberechtigte"
          value={params.unterhaltsberechtigte.toString()}
          onChange={(val) => setParams((p) => ({ ...p, unterhaltsberechtigte: parseInt(val) }))}
          options={Array.from({ length: 5 }, (_, i) => ({
            label: `${i + 1}`,
            value: (i + 1).toString(),
          }))}
        />

        <RechnerCheckbox
          label="Unterhaltspflichtiger ist erwerbstaetig"
          name="erwerbstaetig"
          checked={params.erwerbstaetig}
          onChange={(val) => setParams((p) => ({ ...p, erwerbstaetig: val }))}
        />
      </div>

      <RechnerButton onClick={handleBerechnen} />

      {result && (
        <RechnerResults>
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Zahlbetrag / Monat"
              value={euro(result.zahlbetrag)}
              highlight
            />
            <RechnerResultBox
              label="Verbleibend"
              value={euro(result.verbleibtNachUnterhalt)}
              variant={result.leistungsfaehig ? "positive" : "negative"}
            />
          </div>

          <h4 className="rechner-result-section-title">Berechnung</h4>
          <RechnerResultTable
            rows={[
              { label: "Bereinigtes Netto", value: euro(result.bereinigteNetto) },
              { label: "Einkommensgruppe (Basis)", value: `Gruppe ${result.basisGruppe}` },
              { label: "Korrigierte Gruppe", value: `Gruppe ${result.korrigierteGruppe}` },
              { label: "Altersstufe", value: ALTERSSTUFEN_LABELS[result.altersstufe] },
              { label: "Tabellenbetrag", value: euro(result.tabellenbetrag) },
              { label: "Kindergeld-Abzug", value: `- ${euro(result.kgAbzug)}` },
            ]}
            footer={{ label: "Zahlbetrag", value: euro(result.zahlbetrag) }}
          />

          <h4 className="rechner-result-section-title">Pruefungen</h4>
          <RechnerResultTable
            rows={[
              { label: "Selbstbehalt", value: euro(result.selbstbehalt) },
              { label: "Verbleibt nach Unterhalt", value: euro(result.verbleibtNachUnterhalt) },
              { label: "Leistungsfaehig", value: result.leistungsfaehig ? "Ja" : "Nein" },
              { label: "Bedarfskontrollbetrag (BKB)", value: euro(result.bkb) },
              { label: "BKB eingehalten", value: result.bkbEingehalten ? "Ja" : "Nein" },
            ]}
          />

          {!result.leistungsfaehig && (
            <RechnerHinweis>
              Achtung: Nach Abzug des Unterhalts verbleibt weniger als der notwendige
              Selbstbehalt ({euro(result.selbstbehalt)}). Der Zahlbetrag muesste
              ggf. gekuerzt werden.
            </RechnerHinweis>
          )}

          <RechnerHinweis>
            Basis: Dueseldorfer Tabelle 2026 (OLG Duesseldorf). Berufspauschale 5 % vom
            Netto (min. 50 EUR, max. 150 EUR). Tabellengruppe wird bei abweichender Anzahl
            Unterhaltsberechtigter korrigiert. Fuer die tatsaechliche Unterhaltspflicht
            sollten Sie einen Anwalt oder das Jugendamt konsultieren.
          </RechnerHinweis>
        </RechnerResults>
      )}
    </div>
  );
}
