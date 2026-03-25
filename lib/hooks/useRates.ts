"use client";

import { useEffect, useState } from "react";
import { RATES } from "@/lib/calculators/rates";

/**
 * Hook zum dynamischen Laden von Rechner-Rates
 * Lädt zuerst die Standard-Werte aus rates.json (sofortiger Fallback)
 * Dann versucht es, aktualisierte Werte von der API zu laden
 * Falls API nicht erreichbar: Fallback auf Standard-Werte
 */
export function useRates() {
  const [rates, setRates] = useState(RATES);

  useEffect(() => {
    // Versuche aktualisierte Werte von API zu laden (zB aus WordPress)
    fetch("/api/rates")
      .then((res) => res.json())
      .then((data) => setRates(data))
      .catch(() => {
        // Bei Fehler: Standard-Werte bleiben (schon gesetzt)
      });
  }, []);

  return rates;
}
