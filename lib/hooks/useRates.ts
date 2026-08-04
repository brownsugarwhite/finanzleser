"use client";

import { useEffect, useState } from "react";
import { RATES } from "@/lib/calculators/rates";

type Rates = typeof RATES;

/**
 * Rechner-Rates mit Modul-Level-Cache: EIN Fetch pro Seitenaufruf (JS-Runtime),
 * alle Rechner-Instanzen teilen sich Cache + inflight-Promise. Kein Polling —
 * die Werte ändern sich nur wenige Male im Jahr; Freshness kommt aus dem
 * Browser-HTTP-Cache (max-age 1h) + ISR der /api/rates-Route.
 * Fallback bei Fetch-Fehler: statische RATES aus rates.json.
 */
let cached: Rates | null = null;
let inflight: Promise<void> | null = null;
const listeners = new Set<(r: Rates) => void>();

function loadRates(): Promise<void> {
  if (cached) return Promise.resolve();
  if (!inflight) {
    inflight = fetch("/api/rates")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: Rates) => {
        cached = data;
        listeners.forEach((l) => l(data));
      })
      .catch(() => {
        inflight = null; // nächster Mount darf erneut versuchen; bis dahin gilt RATES
      });
  }
  return inflight;
}

export function useRates(): Rates {
  // SSR-safe: initialer State synchron (Cache oder statischer Fallback), fetch nur im Effect.
  const [rates, setRates] = useState<Rates>(() => cached ?? RATES);

  useEffect(() => {
    if (cached) {
      setRates(cached);
      return;
    }
    listeners.add(setRates);
    loadRates();
    return () => {
      listeners.delete(setRates);
    };
  }, []);

  return rates;
}
