/**
 * Was das Kursblatt aus einer Kategorie macht — reine Funktionen, kein React.
 *
 * Der Handoff zeigt zwei Seiten (Autokredit, Festgeld). Damit dieselben Sektionen für
 * alle 16 Klasse-A-Kategorien tragen, leitet sich alles aus `DefLite` ab: welche Spalte
 * das Streuband trägt, welcher Baustein einen Parameter setzt, wie die Enden der Achse
 * heißen. Kein Kategoriewissen im Markup.
 */
import type { DefLite, ParamDef, SpalteDef } from "./typen.ts";

/** Welcher Eingabe-Baustein setzt diesen Parameter? */
export type ParamBaustein = "lineal" | "setzzeile" | "register" | "segment";

export function bausteinFuer(p: ParamDef): ParamBaustein {
  if (p.typ === "wahl") {
    // Bis drei kurze Möglichkeiten passt der Segment-Umschalter nebeneinander
    // (K:78 „Neuwagen · Gebrauchtwagen · Umschuldung“), darüber braucht es ein Register.
    return (p.optionen?.length ?? 0) <= 3 ? "segment" : "register";
  }
  const stufen = p.schritt ? Math.round(((p.max ?? 0) - (p.min ?? 0)) / p.schritt) : 0;
  // Ein Lineal lohnt sich in einem Fenster: unter 40 Stufen gibt es nichts zu ziehen
  // (dann tippt man den Wert, den man ohnehin kennt), über 400 wird die Spur länger als
  // sechs Satzbreiten und das Treffen eines Wertes zur Geduldsprobe. Beide Enden führen
  // zur Setzzeile — die Marken der Parameter werden dort zu Vorschlägen.
  // Gegenprobe an der Übergabe: Kreditsumme 199 Stufen → Lineal (K:380), Anlagebetrag
  // 1999 Stufen → Setzzeile (F:63). Genau so steht es im Handoff.
  return stufen >= 40 && stufen <= 400 ? "lineal" : "setzzeile";
}

export interface LinealMasse {
  min: number; max: number; schritt: number;
  px: number; major: number; mittel: number;
  marken: { wert: number; label: string }[];
}

/**
 * Maße des Lineals aus einem Parameter.
 *
 * 🚨 Der Handoff nennt zwei handgewählte Konfigurationen: Kreditsumme 1.000–100.000 €
 * in 500er-Schritten mit 9 px und großem Strich alle 10.000 € (K:380), und Laufzeit
 * 12–120 Monate in 6er-Schritten mit 30 px (K:381). Die erste kommt aus dieser Ableitung
 * exakt heraus. Die zweite nicht: unsere Registry führt die Laufzeit in EINER-Schritten,
 * weil Minikredite 1–6 Monate laufen und eine feste 6er-Staffel sie auf null Angebote
 * klemmen würde (registry.ts:245). Aus 1er-Schritten wird ein feineres Lineal — dieselbe
 * Mechanik, feinere Rasterung.
 */
export function linealMasse(p: ParamDef): LinealMasse {
  const min = p.min ?? 0;
  const max = p.max ?? 100;
  const schritt = p.schritt || 1;
  const stufen = Math.max(1, Math.round((max - min) / schritt));

  // Runde Beschriftungen: Monate zählen in Jahren, alles andere dezimal.
  const monate = /monat/i.test(p.einheit ?? "");
  const kandidaten = monate ? [3, 6, 12, 24, 60] : [1, 2, 5, 10, 20, 25, 50, 100, 200, 500];
  const ziel = stufen / 12;
  const major = kandidaten.reduce((a, b) => (Math.abs(b - ziel) < Math.abs(a - ziel) ? b : a));

  // Die Spur soll gut zweieinhalb Satzbreiten lang sein: genug zum Ziehen, ohne dass der
  // Weg von einem Ende zum anderen zur Reise wird.
  const px = Math.min(40, Math.max(4, Math.round((728 * 2.5) / stufen)));

  return {
    min, max, schritt, px, major,
    mittel: major % 2 === 0 ? major / 2 : 0,
    marken: (p.presets ?? [])
      .map((v) => Number(v))
      .filter((v) => Number.isFinite(v) && v >= min && v <= max)
      .map((v) => ({ wert: v, label: markeText(v, p.einheit) })),
  };
}

function markeText(v: number, einheit?: string): string {
  if (/monat/i.test(einheit ?? "") && v >= 12 && v % 12 === 0) {
    const j = v / 12;
    return j === 1 ? "1 Jahr" : `${j} Jahre`;
  }
  return v.toLocaleString("de-DE");
}

/** Die Spalte, die das Streuband trägt: die des Bestwerts. Klasse B hat keine. */
export function hauptspalte(def: DefLite): SpalteDef | undefined {
  if (!def.bestwert) return undefined;
  return def.spalten.find((s) => s.key === def.bestwert!.key);
}

/**
 * Wie die Enden der Achse heißen. „günstig/teuer“ passt, wo weniger besser ist
 * (K:96-97); wo mehr besser ist, wäre es verkehrt herum.
 */
export function achsenEnden(haupt: SpalteDef | undefined): [string, string] {
  if (!haupt) return ["", ""];
  if (haupt.richtung === "runter") return ["günstig", "teuer"];
  if (haupt.art === "geld" || haupt.art === "prozent") return ["wenig", "viel"];
  return ["niedrig", "hoch"];
}

/** „20.000 € über 60 Monate“ — wofür die Liste gerade gilt (K:90). */
export function eingabenSatz(def: DefLite, fest: Record<string, string>, params: Record<string, string | number>): string {
  const teile: string[] = [];
  for (const p of def.params) {
    if (p.fest || fest[p.key] !== undefined) continue;
    const roh = params[p.key] ?? p.standard;
    if (roh === "" || roh === undefined) continue;
    const dauer = /monat|jahr|dauer|laufzeit/i.test(p.einheit ?? p.label);
    if (p.typ === "wahl") {
      const o = p.optionen?.find((x) => String(x.wert) === String(roh));
      // Auch eine Laufzeit aus einer Auswahlliste hängt sich an: „20.000 € über 12 Monate".
      if (o) teile.push(dauer && teile.length ? `über ${o.label}` : o.label);
      continue;
    }
    const z = Number(roh);
    if (!Number.isFinite(z)) continue;
    const text = `${z.toLocaleString("de-DE")}${p.einheit ? " " + p.einheit : ""}`;
    // Laufzeiten hängen sich an: „20.000 € über 60 Monate“ liest sich wie ein Satz,
    // „20.000 € · 60 Monate“ wie eine Aufzählung.
    teile.push(dauer && teile.length ? `über ${text}` : text);
  }
  return teile.join(" ").replace(/ (über)/g, " $1");
}
