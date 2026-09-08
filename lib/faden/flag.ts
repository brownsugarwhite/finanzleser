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
