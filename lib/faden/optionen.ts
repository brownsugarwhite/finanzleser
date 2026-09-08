/**
 * Redaktionelle Optionen des Fadens aus dem CMS (mu-plugin finanzleser-faden, REST
 * `finanzleser/v1/faden-options`): Kassensturz, „Leo fragt“, Wächter-Regeln,
 * Lebensereignisse, Level. Ein gecachter Abruf (CONTENT_REVALIDATE), Fehler werfen
 * (CLAUDE.md, Falle 2) — außer die URL fehlt ganz, dann leere Defaults.
 */
import { CONTENT_REVALIDATE } from "@/lib/wordpress";

/**
 * Bedingung im Kassensturz (Prototyp 05b-js-daten.html `bed()`): genau ein Vergleich je
 * Knoten, `alle` verknüpft mit UND. `wert` ist der ältere Name für `ist`.
 */
export interface KassensturzBedingung {
  feld?: string;
  /** Antwort ist genau dieser Wert. */
  ist?: string;
  /** Alter Name für `ist`. */
  wert?: string;
  /** Antwort ist nicht dieser Wert. */
  nicht?: string;
  /** Antwort ist einer dieser Werte. */
  in?: string[];
  /** Mehrfachauswahl enthält den Wert nicht. */
  ohne?: string;
  /** Mehrfachauswahl enthält den Wert. */
  mit?: string;
  /** Feld beantwortet (true) bzw. unbeantwortet (false). */
  gesetzt?: boolean;
  /** Alle Teilbedingungen müssen gelten. */
  alle?: KassensturzBedingung[];
}
export interface KassensturzFrage {
  id: string;
  text: string;
  /** Fehlt bei der Schätzfrage. */
  optionen?: string[];
  /** Nur zeigen, wenn die Bedingung gilt (z. B. `{ feld: "status", nicht: "In Rente" }`). */
  wenn?: KassensturzBedingung;
  mehrfach?: boolean;
  /** Schätzfrage mit Regler (`schaetz: true` in den Daten, `art: "schaetzen"` als Alias). */
  schaetz?: boolean;
  art?: "schaetzen" | "auswahl";
  /** Richtiger Wert der Schätzfrage. */
  richtig?: number;
  /** Quelle der Auflösung. */
  quelle?: string;
  /** Ikon je Option (überschreibt `KassensturzDaten.ikonen`). */
  ikonen?: Record<string, string>;
  einheit?: string;
  min?: number;
  max?: number;
  schritt?: number;
  start?: number;
}
export interface KassensturzLuecke {
  /** Kurzname für die Ampel („Arbeitskraft“, „Haftpflicht“ …). */
  kurz?: string;
  /** Älterer Name für `kurz`. */
  key?: string;
  /** Ikon-Name der Ergebniskarte. */
  ikon?: string;
  titel: string;
  text: string;
  ampel?: "rot" | "gelb" | "gruen";
  wenn?: KassensturzBedingung;
  links?: { typ: string; slug: string; text?: string }[];
}
export interface KassensturzGut {
  kurz: string;
  wenn?: KassensturzBedingung;
}
export interface KassensturzScore {
  /** Nur zur Dokumentation; gerechnet wird wie im Prototyp: 100 − 22 × Lücken + 3 × Gut. */
  formel?: string;
  min?: number;
  max?: number;
  /** Höchstens so viele Lücken im Ergebnis (Prototyp: 3). */
  max_luecken?: number;
}
export interface KassensturzProfil {
  /** Vorlage mit {status}, {haushalt}, {wohnen}, {schluss}. */
  vorlage?: string;
  status?: Record<string, string>;
  haushalt?: Record<string, string>;
  wohnen?: Record<string, string>;
  /** Schlusssatz je Zahl der Lücken („0“ … „3“). */
  schluss?: Record<string, string>;
}
export interface KassensturzDaten {
  titel: string;
  untertitel?: string;
  status?: string;
  erzeugt_am?: string;
  fragen: KassensturzFrage[];
  /** Ikon je Antworttext (fragenübergreifend). */
  ikonen?: Record<string, string>;
  luecken?: KassensturzLuecke[];
  /** Was gut ist (Ampel grün), mit Bedingung. */
  gut?: KassensturzGut[];
  score?: KassensturzScore;
  profil?: KassensturzProfil;
  profile?: { key: string; titel: string; text?: string; wenn?: Record<string, string | string[]> }[];
  punkte?: number;
  wappen?: string;
  [weitere: string]: unknown;
}

export interface LeoFragtEintrag {
  key: string;
  ausloeser: { art: string; wert?: string; nach_sekunden?: number };
  text: string;
  art: "regler" | "chips" | "frage";
  regler?: { min: number; max: number; wert: number; einheit?: string; schritt?: number };
  chips?: { text: string; ziel?: FadenZiel }[];
  antwort_vorlage?: string;
  ziel?: FadenZiel;
}
export interface FadenZiel {
  typ: string;
  slug: string;
  param?: Record<string, string | number>;
  /** Adresse im Frontend, ergänzt von /api/faden/leo-fragt (lib/urls.ts); fehlt bei Zielen ohne Seite (keins, kassensturz, …). */
  href?: string;
}

export interface WaechterRegel {
  key: string;
  titel: string;
  regel: string;
  ausloeser?: { art: string; datum?: string; pfad?: string };
  stichtag?: string;
  termin?: string;
  links?: { typ: string; slug: string }[];
}

export interface Lebensereignis {
  key: string;
  titel: string;
  wappen?: string;
  phasen: { titel: string; schritte: { text: string; typ: string; slug: string }[] }[];
}

export interface Level { name: string; ab: number; belohnung?: string }

export interface FadenOptionen {
  waechterRegeln: WaechterRegel[];
  kassensturz: KassensturzDaten | null;
  leoFragt: LeoFragtEintrag[];
  lebensereignisse: Lebensereignis[];
  level: Level[];
}

export const LEVEL_STANDARD: Level[] = [
  { name: "Einsteiger", ab: 0 },
  { name: "Kenner", ab: 100 },
  { name: "Lotse", ab: 300 },
];

function json<T>(roh: unknown, fallback: T): T {
  if (roh == null || roh === "") return fallback;
  if (typeof roh !== "string") return roh as T;
  try { return JSON.parse(roh) as T; } catch { return fallback; }
}

export async function getFadenOptionen(): Promise<FadenOptionen> {
  const leer: FadenOptionen = { waechterRegeln: [], kassensturz: null, leoFragt: [], lebensereignisse: [], level: LEVEL_STANDARD };
  const wpUrl = process.env.WORDPRESS_API_URL;
  if (!wpUrl) return leer;
  const res = await fetch(`${wpUrl.replace(/\/graphql\/?$/, "")}/wp-json/finanzleser/v1/faden-options`, { next: { revalidate: CONTENT_REVALIDATE } });
  if (!res.ok) throw new Error(`faden-options: HTTP ${res.status}`);
  const d = (await res.json()) as Record<string, unknown>;
  const level = json<Level[]>(d.faden_level, []);
  return {
    waechterRegeln: json<WaechterRegel[]>(d.faden_waechter_regeln, []),
    kassensturz: json<KassensturzDaten | null>(d.faden_kassensturz, null),
    leoFragt: json<LeoFragtEintrag[]>(d.faden_leo_fragt, []),
    lebensereignisse: json<Lebensereignis[]>(d.faden_lebensereignisse, []),
    level: Array.isArray(level) && level.length ? level : LEVEL_STANDARD,
  };
}

/** Level zu einem Punktestand (höchstes `ab` ≤ punkte). */
export function levelZu(punkte: number, level: Level[] = LEVEL_STANDARD): { aktuell: Level; naechstes: Level | null } {
  const sortiert = [...level].sort((a, b) => a.ab - b.ab);
  let aktuell = sortiert[0];
  let naechstes: Level | null = null;
  for (const l of sortiert) { if (punkte >= l.ab) aktuell = l; else { naechstes = l; break; } }
  return { aktuell, naechstes };
}
