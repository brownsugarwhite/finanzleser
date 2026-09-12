/**
 * Die Auslese für die Startseite: „Aus unserem Newsletter" (drei Ratgeber, ein
 * Vergleich, eine Checkliste, ein Rechner) und Leos Vergleichsempfehlungen.
 *
 * Alles kommt aus bereits gecachten Quellen — `getLatestPosts` holt die Landing ohnehin,
 * und `getWerkzeugIndex()` ist über `getWerkzeugZahlen()` im Layout warm. Keine einzige
 * zusätzliche WordPress-Abfrage.
 */
import type { WerkzeugVerweis } from "@/lib/faden/werkzeugIndex";

/** Ein Eintrag der Auslese, so knapp wie möglich — er reist im Schnappschuss mit. */
export interface AusleseEintrag {
  label: string;
  titel: string;
  href: string;
  /** Farbpunkt der Werkzeugsorte; Ratgeber haben keinen. */
  dot?: "rechner" | "vergleich" | "checkliste";
}

/**
 * 🚨 Die Rechner tragen alle denselben Zeitstempel — sie wurden am 05.04.2026 innerhalb
 * einer Sekunde importiert (54 von 56 auf `10:44:53`). „Der neueste Rechner" wäre dort
 * reiner Zufall, nämlich der, den der Importer zuletzt geschrieben hat. Deshalb eine
 * kurze Vorzugsliste: der erste vorhandene gewinnt, und erst wenn keiner davon im
 * Bestand steht, entscheidet doch das Datum.
 *
 * Bei Checklisten und Vergleichen ist das Datum echt (gemessen am 12.09.2026, Spanne über
 * Wochen) — dort zählt es allein.
 */
const RECHNER_VORZUG = ["unterhalt", "brutto-netto", "rentenbesteuerung", "kfz-steuer", "elterngeld"];

/** Jüngster Verweis einer Sorte nach Datum; ohne Datum zählt die Listenreihenfolge. */
function juengster(index: Map<string, WerkzeugVerweis>, typ: string): WerkzeugVerweis | null {
  let beste: WerkzeugVerweis | null = null;
  for (const [key, v] of index) {
    if (!key.startsWith(`${typ}:`)) continue;
    if (!beste || (v.datum || "") > (beste.datum || "")) beste = v;
  }
  return beste;
}

/** Der Rechner der Auslese: Vorzugsliste zuerst, sonst der jüngste. */
function rechnerDerWoche(index: Map<string, WerkzeugVerweis>): WerkzeugVerweis | null {
  for (const slug of RECHNER_VORZUG) {
    const v = index.get(`rechner:${slug}`);
    if (v) return v;
  }
  return juengster(index, "rechner");
}

/** Ein Vergleich, eine Checkliste, ein Rechner für die Auslese — in dieser Reihenfolge. */
export function werkzeugeDerWoche(index: Map<string, WerkzeugVerweis>): AusleseEintrag[] {
  const teile: [string, "vergleich" | "checkliste" | "rechner", WerkzeugVerweis | null][] = [
    ["Vergleich", "vergleich", juengster(index, "vergleich")],
    ["Checkliste", "checkliste", juengster(index, "checkliste")],
    ["Rechner", "rechner", rechnerDerWoche(index)],
  ];
  return teile.flatMap(([label, dot, v]) => (v ? [{ label, titel: v.titel, href: v.href, dot }] : []));
}

/**
 * Die Vergleiche, die Leo am Ende der Startseite vorschlägt, wenn kein Kassensturz
 * vorliegt — die vier meistgesuchten Policen. Slugs aus dem Vergleichs-CPT; ein Slug,
 * den es nicht (mehr) gibt, wird still übersprungen.
 */
export const GAENGIGE_VERGLEICHE = [
  "private-haftpflichtversicherung-vergleich",
  "kfz-versicherung-vergleich",
  "hausratversicherung-vergleich",
  "rechtsschutzversicherung-vergleich",
];

/** Verweise zu einer Slug-Liste, unbekannte übersprungen. */
export function vergleicheAufloesen(index: Map<string, WerkzeugVerweis>, slugs: string[]): WerkzeugVerweis[] {
  return slugs.flatMap((s) => { const v = index.get(`vergleich:${s}`); return v ? [v] : []; });
}
