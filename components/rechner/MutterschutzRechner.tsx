"use client";

import { useState, useEffect } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type MutterschutzParams, type MutterschutzResult } from "@/lib/calculators/mutterschutz";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerCheckbox from "./ui/RechnerCheckbox";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";

export default function MutterschutzRechner() {
  const today = new Date();
  const defaultDate = new Date(today.getFullYear(), today.getMonth() + 2, 15);
  const defaultDateString = defaultDate.toISOString().split("T")[0];

  const [params, setParams] = useState<MutterschutzParams>({
    geburtstermin: defaultDateString,
    fruegeburt_oder_mehrlinge: false,
    nettolohn_tag: 50
  });

  const [result, setResult] = useState<MutterschutzResult | null>(null);
  const rates = useRates();

  useEffect(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  const handleParamChange = (key: keyof MutterschutzParams, value: string | number | boolean) => {
    setParams((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    
    <div className="rechner-container">
      <h3 className="rechner-title">Mutterschutz-Rechner 2026</h3>

      
    <div className="rechner-inputs">
        <RechnerInput
          label="Errechneter Geburtstermin"
          name="geburtstermin"
          value={params.geburtstermin}
          onChange={(val) => handleParamChange("geburtstermin", val)}

        />

        <RechnerCheckbox
          label="Frühgeburt / Mehrlinge / Behinderung (→ 12 Wochen nach statt 8)"
          name="fruegeburt_oder_mehrlinge"
          checked={params.fruegeburt_oder_mehrlinge}
          onChange={(val) => handleParamChange("fruegeburt_oder_mehrlinge", val)}
        />

        <RechnerInput
          label="Durchschnittlicher Nettolohn täglich"
          name="nettolohn_tag"
          value={params.nettolohn_tag || 0}
          onChange={(val) => handleParamChange("nettolohn_tag", val)}
          einheit="€/Tag"
          min={0}
          
        />
      </div>

      {result && (
        
    <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Schutzfrist"
              value={`${result.wochen_vor} + ${result.wochen_nach} Wochen`}
              highlight={false}
            />
            <RechnerResultBox
              label="Mutterschaftsgeld gesamt"
              value={euro(result.mutterschaftsgeld_gesamt)}
              highlight={true}
            />
          </div>

          <h4 className="rechner-result-section-title">Schutzfristen</h4>
          <RechnerResultTable
            rows={[
              { label: "Schutzfrist beginnt", value: result.schutz_beginn },
              { label: "Schutzfrist endet", value: result.schutz_ende },
              { label: "Gesamte Schutzfrist", value: `${result.schutz_tage} Tage` },
              { label: "Wochen vor Geburt", value: `${result.wochen_vor} Wochen` },
              { label: "Wochen nach Geburt", value: `${result.wochen_nach} Wochen` }
            ]}
          />

          <h4 className="rechner-result-section-title">Mutterschaftsgeld</h4>
          <RechnerResultTable
            rows={[
              { label: "Krankenkasse pro Tag (max.)", value: `${result.mutterschaftsgeld_kk_tag} €` },
              { label: "Krankenkasse gesamt", value: euro(result.mutterschaftsgeld_gesamt_kk) },
              { label: "Arbeitgeber-Zuschuss pro Tag", value: euro(result.arbeitgeber_zuschuss_tag) },
              { label: "Arbeitgeber-Zuschuss gesamt", value: euro(result.mutterschaftsgeld_gesamt_ag) }
            ]}
            footer={{ label: "Mutterschaftsgeld insgesamt", value: euro(result.mutterschaftsgeld_gesamt) }}
          />

          <RechnerHinweis>
            Die Krankenkasse zahlt max. 13 €/Tag. Der Arbeitgeber stockt auf den durchschnittlichen
            Nettolohn auf. Grundlage: §§ 3, 19–20 MuSchG.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
