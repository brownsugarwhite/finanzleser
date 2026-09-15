/**
 * Die drei Kennzahlen unter dem Marktüberblick.
 *
 * Vorlage: „Finanzleser Vergleich & Rechner - Kursblatt.dc.html“:107-112 (Kredit: beste
 * Rate, Ø-Rate, Ersparnis über die Laufzeit) und „… Festgeld & Eingaben“:90-94 (Ertrag,
 * Ø, nach Inflation real).
 *
 * 🚨 Die Formeln stehen deklarativ in der Registry, nicht als Funktion: `DefLite` reist
 * als JSON in die Insel und darf keine Funktionen tragen (components/faden/kette/Insel.tsx).
 * Ausgewertet wird hier — reine Arithmetik, kein React.
 */
import type { DefLite, KennzahlDef, SpalteDef, VergleichProdukt } from "./typen.ts";
import { INFLATION_PA } from "./marktdaten.ts";

export interface KennzahlWert {
  key: string;
  label: string;
  unter?: string;
  art: SpalteDef["art"];
  ton: "werkzeug" | "grau" | "gruen" | "magenta";
  gross?: boolean;
  /** Der Betrag; die Darstellung formatiert ihn und lässt ihn zählen. */
  wert: number;
  /** Vorzeichen, wo es etwas bedeutet (Ertrag, Kaufkraft). */
  zeichen?: "+" | "−";
}

function zahlAus(p: VergleichProdukt | undefined, key: string): number | null {
  const w = p?.kennzahlen[key];
  return typeof w === "number" ? w : null;
}

/**
 * Generische Vorgabe, wenn die Registry nichts sagt: Bester, Durchschnitt, Unterschied.
 * Sie trägt jede Klasse-A-Kategorie, ohne dass jemand sie einträgt.
 */
export function vorgabeKennzahlen(haupt: SpalteDef): KennzahlDef[] {
  const besser = haupt.richtung === "runter" ? "Günstigster" : "Bester";
  return [
    { key: "best", label: `${besser} ${haupt.label}`, art: haupt.art, ton: "werkzeug", formel: { art: "best", key: haupt.key } },
    { key: "schnitt", label: "Durchschnitt", art: haupt.art, ton: "grau", formel: { art: "schnitt", key: haupt.key } },
    { key: "unterschied", label: "Unterschied zum Durchschnitt", art: haupt.art, ton: "gruen", gross: true, formel: { art: "differenz", key: haupt.key } },
  ];
}

export function kennzahlenBauen(
  def: DefLite,
  haupt: SpalteDef | undefined,
  zeilen: VergleichProdukt[],
  best: VergleichProdukt | undefined,
  params: Record<string, string | number>,
): KennzahlWert[] {
  if (!haupt || !zeilen.length) return [];
  const defs = def.kennzahlen?.length ? def.kennzahlen : vorgabeKennzahlen(haupt);
  const out: KennzahlWert[] = [];

  for (const k of defs) {
    const f = k.formel;
    const werte = zeilen.map((p) => zahlAus(p, f.key)).filter((v): v is number => v !== null);
    // Kennzahl ohne Datengrundlage lieber weglassen als eine Null hinschreiben.
    if (!werte.length) continue;

    const bester = zahlAus(best, f.key) ?? werte[0];
    const schnitt = werte.reduce((a, b) => a + b, 0) / werte.length;
    let wert: number;
    let zeichen: "+" | "−" | undefined;
    let ton = k.ton as KennzahlWert["ton"];
    let unter = k.unter;

    if (f.art === "best") wert = bester;
    else if (f.art === "schnitt") wert = schnitt;
    else if (f.art === "differenz") {
      const mal = f.mal ? Number(params[f.mal]) : 1;
      wert = Math.abs(schnitt - bester) * (Number.isFinite(mal) ? mal : 1);
    } else if (f.art === "real") {
      // Der Bestwert minus dem, was die Inflation über die Laufzeit frisst.
      const monate = Number(params[f.jahreAus]);
      const jahre = Number.isFinite(monate) ? monate / 12 : 1;
      // Bezugsgröße ist der angelegte Betrag — ohne ihn lässt sich kein Kaufkraftverlust
      // rechnen, und eine erfundene Zahl neben einem Zinsangebot wäre schlimmer als keine.
      const betrag = Number(params.average_balance ?? params.loan);
      if (!Number.isFinite(betrag)) continue;
      const verlust = betrag * (Math.pow(1 + INFLATION_PA / 100, jahre) - 1);
      wert = bester - verlust;
      zeichen = wert < 0 ? "−" : "+";
      if (wert < 0 && k.negativ) { ton = "magenta"; unter = k.negativ.unter; }
      wert = Math.abs(wert);
    } else {
      continue;
    }

    // Erträge tragen ihr Pluszeichen (F:91-93), Kosten nicht.
    if (!zeichen && haupt.richtung === "hoch" && (f.art === "best" || f.art === "schnitt")) zeichen = "+";

    out.push({ key: k.key, label: k.label, unter, art: k.art, ton, gross: k.gross, wert, zeichen });
  }
  return out;
}
