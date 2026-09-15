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
