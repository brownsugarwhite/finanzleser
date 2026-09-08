/**
 * Faden-Felder aus der GraphQL-Antwort parsen.
 *
 * Das mu-plugin finanzleser-faden liefert jedes Feld als JSON-STRING (Post-Meta
 * `type: string`), in GraphQL camelCase: kurzfassung, leoFragen, glossarBegriffe,
 * leoEinwuerfe, dazuPasst, waechterRegeln, statistiken. Leere Felder kommen als null.
 *
 * Tolerant: kaputtes JSON → leeres Feld (nie werfen, der Beitrag muss trotzdem rendern).
 * Nur `status: "freigegeben"` (oder ohne Status) wird durchgelassen — auf cms-dev ist
 * alles freigegeben, auf Produktion entscheidet später das Content Studio.
 */
import type {
  FadenEinwurf,
  FadenFelder,
  FadenFrage,
  FadenKurzfassung,
  FadenStatistik,
  FadenZiel,
} from "@/lib/types";

/** GraphQL-Felder, die die Faden-Abfrage zusätzlich anfordert (nur mit FADEN_AKTIV). */
export const FADEN_GRAPHQL_FELDER = "kurzfassung leoFragen glossarBegriffe leoEinwuerfe dazuPasst waechterRegeln statistiken";

export interface FadenRohfelder {
  kurzfassung?: string | null;
  leoFragen?: string | null;
  glossarBegriffe?: string | null;
  leoEinwuerfe?: string | null;
  dazuPasst?: string | null;
  waechterRegeln?: string | null;
  statistiken?: string | null;
}

function json<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw || typeof raw !== "string") return fallback;
  try {
    const v = JSON.parse(raw);
    return (v ?? fallback) as T;
  } catch {
    return fallback;
  }
}

function freigegeben<T extends { status?: string }>(x: T): boolean {
  return !x.status || x.status === "freigegeben";
}

const ZIEL_TYPEN = new Set(["post", "rechner", "checkliste", "vergleich", "dokumente", "glossar", "spiel"]);

export function parseFadenFelder(roh: FadenRohfelder | null | undefined): FadenFelder {
  const kurz = json<FadenKurzfassung | null>(roh?.kurzfassung, null);
  const fragen = json<FadenFrage[]>(roh?.leoFragen, []);
  const begriffe = json<string[]>(roh?.glossarBegriffe, []);
  const einwuerfe = json<FadenEinwurf[]>(roh?.leoEinwuerfe, []);
  const dazu = json<FadenZiel[]>(roh?.dazuPasst, []);
  const waechter = json<string[]>(roh?.waechterRegeln, []);
  const statistiken = json<FadenStatistik[]>(roh?.statistiken, []);

  return {
    kurzfassung: kurz && Array.isArray(kurz.saetze) && kurz.saetze.length && freigegeben(kurz)
      ? { ...kurz, saetze: kurz.saetze.filter(Boolean), quellen: Array.isArray(kurz.quellen) ? kurz.quellen : [] }
      : undefined,
    leoFragen: Array.isArray(fragen)
      ? fragen.filter((f) => f && f.abschnitt && f.frage && f.antwort && freigegeben(f)).map((f) => ({ ...f, quellen: Array.isArray(f.quellen) ? f.quellen : [] }))
      : [],
    glossarBegriffe: Array.isArray(begriffe) ? begriffe.filter((s) => typeof s === "string" && s) : [],
    leoEinwuerfe: Array.isArray(einwuerfe) ? einwuerfe.filter((e) => e && e.nach && e.slug && ZIEL_TYPEN.has(e.typ)) : [],
    dazuPasst: Array.isArray(dazu) ? dazu.filter((z) => z && z.slug).map((z) => ({ typ: ZIEL_TYPEN.has(z.typ) ? z.typ : "post", slug: z.slug })) : [],
    waechterRegeln: Array.isArray(waechter) ? waechter.filter((s) => typeof s === "string" && s) : [],
    statistiken: Array.isArray(statistiken)
      ? statistiken.filter((st) => st && st.abschnitt && st.art && Array.isArray(st.reihen) && st.reihen.length && freigegeben(st))
      : [],
  };
}
