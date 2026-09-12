/**
 * Datenmodell der Statistik-Formen aus Design A v2.
 *
 * Quelle ist der Handoff `docs/design_handoff_finanzleser_faden/Finanzleser Faden A v2 - Zeitung.dc.html`.
 * Jede Form hier entspricht einem Baustein dort; die Zeilennummern stehen an der jeweiligen
 * Schnittstelle. Die Werte im Handoff sind Blindtext — übernommen sind Form, Maße und Farben.
 *
 * 🚨 Die Prüfregeln in `pruefeStatistik` gibt es ein zweites Mal in
 * `wordpress/plugins/finanzleser-blocks/blocks.js` (Editor-Warnungen). Das Plugin hat keinen
 * Build-Schritt und kann diese Datei nicht importieren. Wer hier eine Regel ändert, ändert sie dort mit.
 */

export type StatistikArt =
  | "kreis"
  | "saeulen"
  | "spannen"
  | "anteilsleiste"
  | "balken"
  | "linien"
  | "zeitstrahl"
  | "tabelle"
  | "kennzahlen-vierer"
  | "kennzahlen-liste"
  | "schrittfolge"
  | "abwaegung"
  | "begriffe"
  | "vergleichsrechner";

/** Standardname im Kicker: „«Formname» · «titel»“. Überschreibbar über `kicker`. */
export const FORM_NAME: Record<StatistikArt, string> = {
  kreis: "Kreisdiagramm",
  saeulen: "Säulen",
  spannen: "Spannen",
  anteilsleiste: "Statistik",
  balken: "Statistik",
  linien: "Statistik",
  zeitstrahl: "Zeitstrahl",
  tabelle: "Vergleich",
  "kennzahlen-vierer": "Auf einen Blick",
  "kennzahlen-liste": "Kennzahlen",
  schrittfolge: "Schrittfolge",
  abwaegung: "Abwägung",
  begriffe: "Begriffe",
  vergleichsrechner: "Vergleich",
};

/** Die sechs Farben des Handoffs, in genau dieser Reihenfolge (kreisRoh, Zeile 1871). */
export const PALETTE = [
  "var(--ink)",
  "var(--green)",
  "var(--tuerkis)",
  "var(--pink)",
  "rgba(51,74,39,.45)",
  "rgba(51,74,39,.22)",
];

export interface StatistikQuelle {
  name: string;
  url?: string;
  stand?: string;
  /** Kein Erstveröffentlicher der Zahl — wird im Frontend als „Sekundärquelle“ ausgewiesen. */
  sekundaer?: boolean;
}

interface Basis {
  titel: string;
  untertitel?: string;
  einheit?: string;
  hinweis?: string;
  /** Überschreibt FORM_NAME im Kicker. */
  kicker?: string;
  quelle?: StatistikQuelle;
}

export interface Stueck {
  label: string;
  wert: number;
  farbe?: string;
}

export interface StatKreis extends Basis {
  art: "kreis";
  stuecke: Stueck[];
  /** Text unter der Zahl in der Mitte, solange nichts überfahren wird. Standard „Leistungen“. */
  mitteText?: string;
}

export interface StatAnteilsleiste extends Basis {
  art: "anteilsleiste";
  stuecke: Stueck[];
}

/**
 * Gereihte Balken — die eine Form, die der Setzkasten des Handoffs nicht kennt. Sie steht
 * hier trotzdem, weil 156 der 288 Bestandsstatistiken genau das sind und die Redaktion sie
 * braucht: Werte mit langen Beschriftungen, die sich nicht auf 100 summieren. Gebaut aus
 * der Bildsprache der Spannen, siehe components/statistik/formen/Balkenliste.tsx.
 */
export interface StatBalken extends Basis {
  art: "balken";
  werte: Stueck[];
  /** Ein Wert darf hervorgehoben werden — etwa der, um den es im Absatz geht. */
  hervor?: string;
}

export interface StatSaeulen extends Basis {
  art: "saeulen";
  reihen: { label: string; farbe?: string }[];
  kategorien: { label: string; werte: number[] }[];
  /** Obergrenze der Skala. Fehlt sie, wird der größte Wert + 10 % genommen. */
  maximum?: number;
}

export interface StatSpannen extends Basis {
  art: "spannen";
  zeilen: { name: string; min: number; median: number; max: number }[];
  skala?: { von: number; bis: number };
}

export interface StatLinien extends Basis {
  art: "linien";
  /** Beschriftung der x-Achse, eine je Stützstelle. */
  achse: string[];
  reihen: { label: string; farbe?: string; werte: number[]; gestrichelt?: boolean }[];
  yAchse?: { min: number; max: number };
  /** Kursive Anmerkung am rechten Rand, am Endpunkt der zweiten Reihe. */
  notiz?: string;
}

export interface StatZeitstrahl extends Basis {
  art: "zeitstrahl";
  /** `x` ist die Position auf der Achse in Prozent; fehlt sie, wird gleichmäßig verteilt. */
  stationen: { marke: string; text: string; x?: number }[];
}

export interface StatTabelle extends Basis {
  art: "tabelle";
  /** Kopfzelle der ersten Spalte. Standard „Leistung“. */
  zeilenkopf?: string;
  spalten: { name: string; tag?: string; hervor?: boolean }[];
  zeilen: { name: string; werte: string[] }[];
  fussnote?: string;
}

export interface StatKennzahlenVierer extends Basis {
  art: "kennzahlen-vierer";
  kacheln: { label: string; zahl: number; einheit?: string; text?: string; farbe?: string }[];
}

export interface StatKennzahlenListe extends Basis {
  art: "kennzahlen-liste";
  zeilen: { name: string; wert: string }[];
}

export interface StatSchrittfolge extends Basis {
  art: "schrittfolge";
  schritte: { titel: string; text?: string }[];
}

export interface StatAbwaegung extends Basis {
  art: "abwaegung";
  pro: string[];
  contra: string[];
}

export interface StatBegriffe extends Basis {
  art: "begriffe";
  begriffe: { begriff: string; text: string }[];
}

export interface StatVergleichsrechner extends Basis {
  art: "vergleichsrechner";
  slug: string;
  anbieter?: string;
}

export type Statistik =
  | StatKreis
  | StatAnteilsleiste
  | StatBalken
  | StatSaeulen
  | StatSpannen
  | StatLinien
  | StatZeitstrahl
  | StatTabelle
  | StatKennzahlenVierer
  | StatKennzahlenListe
  | StatSchrittfolge
  | StatAbwaegung
  | StatBegriffe
  | StatVergleichsrechner;

const ARTEN = new Set<string>(Object.keys(FORM_NAME));

/**
 * Base64 → Statistik. Gibt null zurück, statt zu werfen: ein kaputter Block darf keine Seite
 * killen — er verschwindet, der Rest des Beitrags bleibt stehen.
 *
 * Die Nutzlast ist UTF-8 (€, Umlaute, ✓), deshalb TextDecoder statt des alten
 * atob-plus-escape-Umwegs. Auf dem Server gibt es atob nicht überall — daher der Buffer-Zweig.
 */
export function parseStatistik(b64: string): Statistik | null {
  try {
    let json: string;
    if (typeof atob === "function") {
      const roh = atob(b64);
      const bytes = Uint8Array.from(roh, (z) => z.charCodeAt(0));
      json = new TextDecoder("utf-8").decode(bytes);
    } else {
      json = Buffer.from(b64, "base64").toString("utf8");
    }
    const o = JSON.parse(json) as Statistik;
    if (!o || typeof o !== "object" || !ARTEN.has(o.art) || !o.titel) return null;
    return o;
  } catch {
    return null;
  }
}

/** Statistik → Base64 (für Werkzeuge und Tests; im CMS macht das PHP). */
export function packeStatistik(s: Statistik): string {
  const json = JSON.stringify(s);
  if (typeof btoa !== "function") return Buffer.from(json, "utf8").toString("base64");
  const bytes = new TextEncoder().encode(json);
  let roh = "";
  for (const b of bytes) roh += String.fromCharCode(b);
  return btoa(roh);
}

const zahl = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);

/**
 * Plausibilität. Gibt Klartext-Beanstandungen zurück, leeres Array heißt in Ordnung.
 * Wird von `tools/statistik-stapel.mjs` und vom Schaukasten genutzt.
 */
export function pruefeStatistik(s: Statistik): string[] {
  const f: string[] = [];
  if (!s.titel?.trim()) f.push("Titel fehlt.");
  const q = s.quelle;
  if (!q?.name?.trim()) f.push("Quelle fehlt.");
  else {
    if (!q.url || !/^https:\/\//.test(q.url)) f.push("Quelle braucht eine https-URL.");
    if (!q.stand?.trim()) f.push("Quelle braucht einen Stand.");
  }

  switch (s.art) {
    case "balken": {
      const n = s.werte?.length ?? 0;
      if (n < 2 || n > 8) f.push(`2 bis 8 Werte, nicht ${n}.`);
      if (!s.werte?.every((x) => zahl(x.wert) && x.label?.trim())) f.push("Jeder Wert braucht Beschriftung und endliche Zahl.");
      break;
    }
    case "kreis":
    case "anteilsleiste": {
      const n = s.stuecke?.length ?? 0;
      const grenze = s.art === "kreis" ? [3, 6] : [3, 5];
      if (n < grenze[0] || n > grenze[1]) f.push(`${grenze[0]} bis ${grenze[1]} Stücke, nicht ${n}.`);
      if (!s.stuecke?.every((x) => zahl(x.wert) && x.label?.trim())) f.push("Jedes Stück braucht Beschriftung und endliche Zahl.");
      else {
        const summe = s.stuecke.reduce((a, x) => a + x.wert, 0);
        if (Math.abs(summe - 100) > 0.5) f.push(`Anteile summieren sich auf ${summe.toFixed(1)}, nicht auf 100.`);
      }
      break;
    }
    case "saeulen": {
      if (!s.reihen?.length || s.reihen.length > 2) f.push("Eine oder zwei Reihen, nicht mehr.");
      const n = s.kategorien?.length ?? 0;
      if (n < 2 || n > 8) f.push(`2 bis 8 Kategorien, nicht ${n}.`);
      if (!s.kategorien?.every((k) => k.werte?.length === s.reihen?.length && k.werte.every(zahl))) f.push("Jede Kategorie braucht je Reihe genau eine endliche Zahl.");
      break;
    }
    case "spannen": {
      const n = s.zeilen?.length ?? 0;
      if (n < 2 || n > 6) f.push(`2 bis 6 Zeilen, nicht ${n}.`);
      s.zeilen?.forEach((z) => {
        if (![z.min, z.median, z.max].every(zahl)) f.push(`„${z.name}“: min, median und max müssen Zahlen sein.`);
        else if (!(z.min <= z.median && z.median <= z.max)) f.push(`„${z.name}“: min ≤ median ≤ max ist verletzt.`);
      });
      break;
    }
    case "linien": {
      if (!s.achse?.length) f.push("Achsenbeschriftung fehlt.");
      if (!s.reihen?.length || s.reihen.length > 2) f.push("Eine oder zwei Linien, nicht mehr.");
      s.reihen?.forEach((r) => {
        if (r.werte?.length !== s.achse?.length) f.push(`Reihe „${r.label}“ hat ${r.werte?.length} Werte, die Achse ${s.achse?.length}.`);
        if (!r.werte?.every(zahl)) f.push(`Reihe „${r.label}“ enthält keine reinen Zahlen.`);
      });
      break;
    }
    case "zeitstrahl": {
      const n = s.stationen?.length ?? 0;
      if (n < 2 || n > 5) f.push(`2 bis 5 Stationen, nicht ${n}.`);
      break;
    }
    case "tabelle": {
      if (!s.spalten?.length) f.push("Spalten fehlen.");
      if (!s.zeilen?.length) f.push("Zeilen fehlen.");
      s.zeilen?.forEach((z) => {
        if (z.werte?.length !== s.spalten?.length) f.push(`Zeile „${z.name}“ hat ${z.werte?.length} Werte, die Tabelle ${s.spalten?.length} Spalten.`);
      });
      break;
    }
    case "kennzahlen-vierer": {
      const n = s.kacheln?.length ?? 0;
      if (n < 3 || n > 4) f.push(`3 oder 4 Kacheln, nicht ${n}.`);
      if (!s.kacheln?.every((k) => zahl(k.zahl))) f.push("Jede Kachel braucht eine endliche Zahl.");
      break;
    }
    case "kennzahlen-liste": {
      const n = s.zeilen?.length ?? 0;
      if (n < 3 || n > 8) f.push(`3 bis 8 Zeilen, nicht ${n}.`);
      break;
    }
    case "schrittfolge": {
      const n = s.schritte?.length ?? 0;
      if (n < 2 || n > 6) f.push(`2 bis 6 Schritte, nicht ${n}.`);
      break;
    }
    case "abwaegung": {
      if (!s.pro?.length || !s.contra?.length) f.push("Dafür und Dagegen brauchen je mindestens einen Punkt.");
      if (s.pro?.length > 4 || s.contra?.length > 4) f.push("Höchstens vier Punkte je Seite.");
      break;
    }
    case "begriffe": {
      const n = s.begriffe?.length ?? 0;
      if (n < 2 || n > 5) f.push(`2 bis 5 Begriffe, nicht ${n}.`);
      break;
    }
    case "vergleichsrechner": {
      if (!s.slug?.trim()) f.push("Slug des Vergleichs fehlt.");
      break;
    }
  }
  return f;
}
