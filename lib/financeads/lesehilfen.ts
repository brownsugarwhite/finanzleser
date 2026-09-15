/**
 * Kleine Griffe in die lose typisierte API-Antwort. Die Registry benutzt nur diese,
 * damit ein fehlendes Feld nie wirft, sondern `null` ergibt — eine Kategorie mit
 * anderer Form liefert dann leere Zellen statt einer kaputten Seite.
 */
import type { ApiProdukt, KennWert } from "./typen.ts";

type Roh = Record<string, unknown> | unknown[] | null | undefined;

/** `pfad(obj, "a.b.0.c")` — Pfad mit Punkten, Zahlen greifen in Arrays. */
export function pfad(obj: unknown, weg: string): unknown {
  let cur: unknown = obj;
  for (const teil of weg.split(".")) {
    if (cur === null || cur === undefined) return null;
    if (Array.isArray(cur)) { const i = Number(teil); cur = Number.isInteger(i) ? cur[i] : null; continue; }
    if (typeof cur === "object") { cur = (cur as Record<string, unknown>)[teil]; continue; }
    return null;
  }
  return cur ?? null;
}

/** Zahl oder null — akzeptiert auch "3.25" als String (financeads liefert beides). */
export function zahl(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string" && v.trim() !== "") { const n = Number(v.replace(",", ".")); return Number.isFinite(n) ? n : null; }
  return null;
}

export function text(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

/** Deutsche Fassung eines mehrsprachigen Felds (`{de, en, …}`), sonst der String selbst. */
export function de(v: unknown): string | null {
  if (typeof v === "string") return text(v);
  if (v && typeof v === "object") return text((v as Record<string, unknown>).de);
  return null;
}

export function haken(v: unknown): boolean | null {
  if (v === true || v === 1 || v === "1" || v === "true") return true;
  if (v === false || v === 0 || v === "0" || v === "false") return false;
  return null;
}

/** HTML → Klartext, Zeilenumbrüche aus <br> erhalten, Entities minimal aufgelöst. */
export function klartext(html: unknown): string | null {
  const s = text(html);
  if (!s) return null;
  return s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#x20ac;/gi, "€").replace(/&euro;/g, "€").replace(/&quot;/g, '"')
    .replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim() || null;
}

/** Erstes Element eines Arrays (financeads liefert Konditionen oft als Liste mit einem Eintrag). */
export function erstes(v: unknown): Roh {
  return Array.isArray(v) ? (v[0] as Roh) : (v as Roh);
}

/** Größter `value` in einer Konditionsliste. */
export function maxWert(liste: unknown): number | null {
  if (!Array.isArray(liste)) return null;
  let m: number | null = null;
  for (const e of liste) { const n = zahl(pfad(e, "value")); if (n !== null && (m === null || n > m)) m = n; }
  return m;
}

/** Konditionseintrag einer Liste, dessen `requirements.<schluessel>` gleich `wert` ist. */
export function eintragMit(liste: unknown, schluessel: string, wert: string): Roh {
  if (!Array.isArray(liste)) return null;
  return (liste.find((e) => pfad(e, `requirements.${schluessel}`) === wert) as Roh) ?? null;
}

/** Jüngstes `update_datetime` im ganzen Produkt (rekursiv, begrenzt). */
export function juengstesDatum(p: ApiProdukt): string | null {
  let best: string | null = null;
  const lauf = (v: unknown, tiefe: number) => {
    if (tiefe > 6 || v === null || typeof v !== "object") return;
    if (Array.isArray(v)) { for (const e of v) lauf(e, tiefe + 1); return; }
    for (const [k, w] of Object.entries(v as Record<string, unknown>)) {
      if (k === "update_datetime" && typeof w === "string" && /^\d{4}-\d{2}-\d{2}/.test(w) && !w.startsWith("-0001")) {
        if (!best || w > best) best = w;
      } else lauf(w, tiefe + 1);
    }
  };
  lauf(p.conditions, 0);
  return best;
}

export function nurWerte(o: Record<string, KennWert | undefined>): Record<string, KennWert> {
  const out: Record<string, KennWert> = {};
  for (const [k, v] of Object.entries(o)) out[k] = v === undefined ? null : v;
  return out;
}

/**
 * Der ⅔-Zins aus dem repräsentativen Beispiel nach § 6a PAngV.
 *
 * financeads führt dafür kein Feld; der Satz steht als Prosa in
 * `details.representative_example.de`: „Mindestens 2 von 3 Kunden erhalten einen
 * Effektivzins von höchstens 8,38 % …“. Am 15.09.2026 war er in allen 20 Autokredit-
 * Angeboten vorhanden.
 *
 * 🚨 Eine Regex auf Pflichttext ist spröde. Greift sie nicht, gibt es `null` und die
 * Detailzeile entfällt — nie einen geschätzten Ersatzwert. Lieber eine Zeile weniger
 * als eine erfundene Zahl neben einem Kreditangebot.
 */
export function zweiDrittelZins(text: string | null): number | null {
  if (!text) return null;
  const roh = text.replace(/<[^>]+>/g, " ");
  const m =
    roh.match(/(?:h(?:ö|oe)chstens|maximal|bis\s+zu)\s+([\d.,]+)\s*%/i) ??
    roh.match(/zwei\s*[-\s]?\s*Drittel[^%]{0,80}?([\d.,]+)\s*%/i) ??
    roh.match(/2\s+von\s+3[^%]{0,80}?([\d.,]+)\s*%/i);
  if (!m) return null;
  const z = Number(m[1].replace(/\./g, "").replace(",", "."));
  return Number.isFinite(z) ? z : null;
}

/**
 * Gilt das Angebot für die angefragte Summe und Laufzeit?
 *
 * `interest_effective.requirements` nennt `loan_min/max` und `duration_months_min/max`.
 * Gemessen am 15.09.2026: bei 20.000 € über 60 Monate galten **6 von 20** Autokrediten
 * gar nicht — der Zins daneben gehört zu einer anderen Summe oder Laufzeit.
 */
export function giltFuer(anforderung: unknown, params: Record<string, string>): boolean {
  const zw = (k: string) => zahl(pfad(anforderung, k));
  const summe = Number(params.loan);
  const monate = Number(params.duration_months);
  const inSpanne = (v: number, min: number | null, max: number | null) =>
    !Number.isFinite(v) || ((min === null || v >= min) && (max === null || v <= max));
  return (
    inSpanne(summe, zw("loan_min"), zw("loan_max")) &&
    inSpanne(monate, zw("duration_months_min"), zw("duration_months_max"))
  );
}

/** „5.000–35.000 €, 48–84 Monate“ — wofür der genannte Zins gilt. */
export function spanneText(anforderung: unknown): string | null {
  const zw = (k: string) => zahl(pfad(anforderung, k));
  const teile: string[] = [];
  const sMin = zw("loan_min"), sMax = zw("loan_max");
  const mMin = zw("duration_months_min"), mMax = zw("duration_months_max");
  const f = (v: number) => v.toLocaleString("de-DE");
  if (sMin !== null || sMax !== null) teile.push(`${f(sMin ?? 0)}–${sMax !== null ? f(sMax) : "…"} €`);
  if (mMin !== null || mMax !== null) teile.push(mMin === mMax ? `${mMin} Monate` : `${mMin ?? 0}–${mMax ?? "…"} Monate`);
  return teile.length ? teile.join(", ") : null;
}

/**
 * Der Kreditgeber hinter dem Angebot.
 *
 * `details.loan_provider` nennt ihn als Anschrift („Santander Consumer Bank,
 * Santander-Platz 1, 41061 Mönchengladbach“). Für die Detailzeile reicht der Name bis
 * zum ersten Komma.
 *
 * 🚨 Das Feld sagt NICHT, ob ein Vermittler dazwischensteht — gemessen am 15.09.2026 ist
 * es bei Verivox und teylor leer, bei Maxda (einem Vermittler) dagegen gefüllt. Leer
 * heißt: der Kreditgeber steht erst nach der Anfrage fest. Aus dieser Anschrift „Bank
 * oder Vermittler“ abzuleiten wäre geraten.
 */
export function kreditgeber(feld: unknown): string | null {
  const t = text(feld);
  if (t === null || t.trim() === "") return null;
  return t.split(",")[0].trim() || null;
}
