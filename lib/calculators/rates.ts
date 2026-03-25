/**
 * Zentrale Rates-Datei – importiert aus config/rates.json
 * Vollständige offizielle Werte für alle 2026 Steuern, Abgaben und Tabellen
 * Zuletzt aktualisiert: 2026-01-01
 *
 * Hinweis: Häufig geändernde Werte sind auch in WordPress ACF Options verfügbar
 * für schnellere Updates ohne Code-Änderungen.
 */

import ratesData from "@/config/rates.json";

export const RATES = ratesData;

export type Rates = typeof RATES;
