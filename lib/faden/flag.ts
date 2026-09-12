/**
 * Schalter für den Faden (Stufe 1, Konzept „Der Faden mit Leo“).
 *
 * `NEXT_PUBLIC_FADEN=1` schaltet in app/layout.tsx und den Layout-Komponenten auf die
 * Faden-Hülle um. Ohne den Schalter rendert alles wie bisher. Der Schalter ist zugleich
 * die Zusage „das angebundene CMS kennt die Faden-Felder“ (Regel 12 in CLAUDE.md):
 * Produktion (cms.finanzleser.de) kennt sie noch nicht, cms-dev kennt sie.
 *
 * Bewusst NICHT in app/[kategorie]/page.tsx abfragen — die Redirect-Kaskade bleibt
 * byteidentisch (Regel 0).
 */
export const FADEN_AKTIV = process.env.NEXT_PUBLIC_FADEN === "1";

/**
 * Schaukasten: eine Route, die jedes Element des Fadens einmal zeigt (app/schaukasten).
 *
 * 🚨 Werkzeug für die Abnahme, kein Teil der Seite. In der Entwicklung immer an, in
 * einem Produktions-Build nur mit `NEXT_PUBLIC_SCHAUKASTEN=1` — so lässt er sich in
 * einem Deploy-Preview einschalten, ohne dass er je auf finanzleser.de landet.
 * Die Route trägt zusätzlich `robots: noindex, nofollow`.
 */
export const SCHAUKASTEN_AKTIV =
  FADEN_AKTIV && (process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_SCHAUKASTEN === "1");
