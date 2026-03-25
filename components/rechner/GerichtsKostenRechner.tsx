"use client";

import { useState, useEffect } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";

export default function GerichtsKostenRechner() {
  const [streitwert, setStreitwert] = useState(10000);

  const calculateGebuehr = (sv: number) => {
    const table = [
      { bis: 500, gebuehr: 38 },
      { bis: 1000, gebuehr: 58 },
      { bis: 1500, gebuehr: 78 },
      { bis: 5000, gebuehr: 161 },
      { bis: 10000, gebuehr: 266 },
      { bis: 50000, gebuehr: 696 },
      { bis: 500000, gebuehr: 2896 }
    ];

    for (const s of table) {
      if (sv <= s.bis) return s.gebuehr;
    }
    return 2896;
  };

  const gebuehr = calculateGebuehr(streitwert);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Gerichtskosten-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput label="Streitwert" name="streitwert" value={streitwert} onChange={(val) => setStreitwert(Number(val))} einheit="€" min={0} />
      </div>

      <div className="rechner-results">
        <div className="rechner-result-boxes">
          <RechnerResultBox label="Gerichtsgebühr" value={euro(gebuehr)} highlight={true} />
          <RechnerResultBox label="Mit Anwaltskosten (geschätzt)" value={euro(gebuehr * 2)} highlight={false} />
        </div>
      </div>
    </div>
  );
}
