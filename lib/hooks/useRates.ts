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
    // Lade sofort
    fetch("/api/rates")
      .then((res) => res.json())
      .then((data) => {
        console.log("useRates loaded:", data.sozialversicherung?.krankenversicherung?.durchschnittlicher_zusatzbeitrag_prozent);
        setRates(data);
      })
      .catch((err) => console.error("useRates fetch error:", err));

    // Polling: Alle 5 Sekunden neu laden (für Live-Updates von WordPress)
    const interval = setInterval(() => {
      fetch("/api/rates")
        .then((res) => res.json())
        .then((data) => {
          console.log("useRates polling loaded:", data.sozialversicherung?.krankenversicherung?.durchschnittlicher_zusatzbeitrag_prozent);
          setRates(data);
        })
        .catch(() => {});
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return rates;
}
