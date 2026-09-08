/**
 * Reine Logik des Finanz-Kassensturzes (Port aus dem Prototyp, 04-js-inhalt.html
 * `ksErgebnis()` und 05b-js-daten.html `bed()`/Options-Mapping): Bedingungen, offene
 * Fragen, Ergebnis mit Profil, Ampel, Lücken und Score; dazu der Stand in
 * localStorage `faden-kassensturz` (Wiederaufnahme, Teaser unter dem Ratgeber).
 * Keine DOM-Zugriffe außer in den Speicher-Helfern, damit die Seite serverseitig rendert.
 */
import type { KassensturzBedingung, KassensturzDaten, KassensturzFrage } from "@/lib/faden/optionen";

export type Antwort = string | string[] | number;
export type Antworten = Record<string, Antwort | undefined>;

export const KS_SPEICHER = "faden-kassensturz";
/** Adresse der Ergebnisseite (Konstante, damit interne Links wie im übrigen Faden als `<a href>` durch den FadenProvider laufen). */
export const KASSENSTURZ_URL = "/kassensturz";

/** Stand eines Kassensturzes im Browser (localStorage `faden-kassensturz`). */
export interface KassensturzStand {
  antworten: Antworten;
  /** Index der aktuellen Frage in `daten.fragen`; ab `fragen.length` = Ergebnis. */
  idx: number;
  fertig: boolean;
  /** Tag des Ergebnisses als YYYY-MM-DD (lokale Zeit des Lesers). */
  datum?: string;
  score?: number;
  luecken?: number;
  /** 30 Punkte für dieses Ergebnis schon gutgeschrieben (Reload wiederholt nichts). */
  belohnt?: boolean;
  /** Punkte der Schätzfrage in diesem Durchlauf schon vergeben. */
  schaetzBelohnt?: boolean;
}

/** Fallback-Ikonen der Ergebniskarten (Prototyp `KS_ERG_IKON`), wenn die Lücke keins nennt. */
const ERG_IKON: Record<string, string> = { Arbeitskraft: "schildNein", Haftpflicht: "schirm", Notgroschen: "sparLeer", Altersvorsorge: "sanduhr", Hausrat: "sofa", "Wohngebäude": "dach", Kinder: "baby" };

/** Bedingung prüfen — 1:1 `bed(w, a)` aus 05b-js-daten.html. */
export function bedingung(w: KassensturzBedingung | undefined, a: Antworten): boolean {
  if (!w) return true;
  if (w.alle) return w.alle.every((x) => bedingung(x, a));
  const v = w.feld ? a[w.feld] : undefined;
  const liste = Array.isArray(v) ? v : [];
  if ("ist" in w) return v === w.ist;
  if ("wert" in w) return v === w.wert;
  if ("nicht" in w) return v !== w.nicht;
  if (w.in) return typeof v === "string" && w.in.includes(v);
  if ("ohne" in w) return !liste.includes(w.ohne as string);
  if ("mit" in w) return liste.includes(w.mit as string);
  if ("gesetzt" in w) return !!v === !!w.gesetzt;
  return true;
}

export function istSchaetzfrage(f: KassensturzFrage): boolean {
  return !!f.schaetz || f.art === "schaetzen";
}

/** Alle Fragen, die bei diesem Antwortstand gezeigt werden (Prototyp `offen()`). */
export function offeneFragen(fragen: KassensturzFrage[], a: Antworten): KassensturzFrage[] {
  return fragen.filter((f) => bedingung(f.wenn, a));
}

/** Nächste zu zeigende Frage ab Index `ab`; `fragen.length`, wenn keine mehr offen ist. */
export function naechsterIndex(fragen: KassensturzFrage[], ab: number, a: Antworten): number {
  let i = Math.max(0, ab);
  while (i < fragen.length && !bedingung(fragen[i].wenn, a)) i++;
  return i;
}

/** Ikon einer Antwortkarte: Frage, dann Datensatz, sonst Stern (Prototyp `ikonFuer`). */
export function ikonFuer(d: KassensturzDaten, f: KassensturzFrage, o: string): string {
  return f.ikonen?.[o] || d.ikonen?.[o] || "stern";
}

export interface ErgebnisLuecke {
  kurz: string;
  ikon: string;
  titel: string;
  text: string;
  links: { text: string; typ: string; slug: string }[];
}
export interface Ergebnis {
  profil: string;
  luecken: ErgebnisLuecke[];
  gut: string[];
  score: number;
}

/** Ergebnis wie im Prototyp (05b-Mapping von `ksErgebnis` + Score aus `ergebnis()`). */
export function ergebnis(d: KassensturzDaten, a: Antworten): Ergebnis {
  const luecken: ErgebnisLuecke[] = (d.luecken || []).filter((l) => bedingung(l.wenn, a)).map((l) => {
    const kurz = l.kurz || l.key || "";
    return { kurz, ikon: l.ikon || ERG_IKON[kurz] || "stern", titel: l.titel, text: l.text, links: (l.links || []).map((x) => ({ text: x.text || x.slug, typ: x.typ, slug: x.slug })) };
  });
  const gut = (d.gut || []).filter((g) => bedingung(g.wenn, a)).map((g) => g.kurz);
  const n = Math.min(luecken.length, d.score?.max_luecken ?? 3);
  const pr = d.profil || {};
  const text = (v: Antwort | undefined) => (typeof v === "string" ? v : "");
  const profil = (pr.vorlage || "Sie sind {status}, leben {haushalt} und wohnen {wohnen}. {schluss}")
    .replace("{status}", pr.status?.[text(a.status)] || "berufstätig")
    .replace("{haushalt}", pr.haushalt?.[text(a.haushalt)] || "im eigenen Haushalt")
    .replace("{wohnen}", pr.wohnen?.[text(a.wohnen)] || "zur Miete")
    .replace("{schluss}", pr.schluss?.[String(n)] || "");
  const gekuerzt = luecken.slice(0, n);
  // Formel wie im Prototyp: 100 − 22 je Lücke + 3 je Stärke, begrenzt (Standard 12–98).
  const score = Math.max(d.score?.min ?? 12, Math.min(d.score?.max ?? 98, 100 - gekuerzt.length * 22 + gut.length * 3));
  return { profil, luecken: gekuerzt, gut, score };
}

/** Punkte für einen Tipp bei der Schätzfrage (Prototyp: ≤ 100 daneben 20, ≤ 400 daneben 10). */
export function schaetzPunkte(tipp: number, richtig: number): number {
  const abw = Math.abs(tipp - richtig);
  return abw <= 100 ? 20 : abw <= 400 ? 10 : 0;
}

/** Betrag wie im Prototyp (`eur()`): 1.913 €; andere Einheiten mit Leerzeichen. */
export function betrag(n: number, einheit = "€"): string {
  const z = n.toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return einheit ? `${z} ${einheit}` : z;
}

const MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

/** Lokales Datum als YYYY-MM-DD (wie im FadenProvider für die Serie). */
export function heuteLokal(d = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/** „7. September“ (mit Jahr, wenn es nicht das laufende ist) aus YYYY-MM-DD. */
export function datumLang(iso?: string): string {
  if (!iso) return "";
  const p = iso.split("-");
  if (p.length !== 3) return iso;
  const jahr = +p[0], monat = +p[1], tag = +p[2];
  const s = `${tag}. ${MONATE[monat - 1] || ""}`.trim();
  return jahr === new Date().getFullYear() ? s : `${s} ${jahr}`;
}

export function standLesen(): KassensturzStand | null {
  try {
    const roh = localStorage.getItem(KS_SPEICHER);
    if (!roh) return null;
    const s = JSON.parse(roh) as Partial<KassensturzStand>;
    if (!s || typeof s !== "object" || !s.antworten || typeof s.antworten !== "object") return null;
    return { antworten: s.antworten, idx: typeof s.idx === "number" ? s.idx : 0, fertig: !!s.fertig, datum: typeof s.datum === "string" ? s.datum : undefined, score: typeof s.score === "number" ? s.score : undefined, luecken: typeof s.luecken === "number" ? s.luecken : undefined, belohnt: !!s.belohnt, schaetzBelohnt: !!s.schaetzBelohnt };
  } catch { return null; }
}

export function standSchreiben(s: KassensturzStand | null): void {
  try {
    if (!s) localStorage.removeItem(KS_SPEICHER);
    else localStorage.setItem(KS_SPEICHER, JSON.stringify(s));
  } catch { /* voll oder gesperrt */ }
}
