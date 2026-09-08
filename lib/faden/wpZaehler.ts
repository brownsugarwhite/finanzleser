/**
 * Temporärer WordPress-Abfrage-Zähler für die M7-Abnahme (`FADEN_DEBUG=1`).
 *
 * Zusage aus dem Plan: der Faden löst **je Seite keine zusätzlichen**
 * WordPress-Requests aus (der Verlauf entsteht aus HTML-Schnappschüssen, jede
 * Navigation ist eine gewöhnliche Next-Navigation). Diese Datei belegt das
 * messbar, statt es zu behaupten.
 *
 * Gezählt wird in **unserem** Code, nicht über einen `globalThis.fetch`-Patch:
 * ein solcher Patch aus `instrumentation.ts` wird nachweislich nicht erreicht,
 * weil Next seinen eigenen fetch-Wrapper vorher bindet (am 08.09. gemessen:
 * `getClient` lief 25-mal, der Patch zählte 0).
 *
 * Chokepoints: `getClient()` in lib/wordpress.ts (alles GraphQL) und die
 * REST-Aufrufe in lib/ (`articleToolData`, `faden/optionen`, `wordpress.ts`).
 * API-Routen zählen nicht mit — die sind eigene Requests, kein Teil eines
 * Seiten-Renders.
 *
 * Ablesen:
 *   FADEN_DEBUG=1 npm run dev
 *   → je Abfrage eine Zeile `[wp] 12 graphql:GetPostBySlug`
 *   → `GET /api/faden/wp-zaehler?reset=1` setzt zurück, danach eine Seite
 *     abrufen und erneut lesen = Abfragen genau dieser Seite
 *
 * Fair vergleichen: dieselbe URL einmal mit `NEXT_PUBLIC_FADEN=1` und einmal
 * ohne, jeweils im **frisch gestarteten** Server mit gelöschtem
 * `.next/cache/fetch-cache` — sonst antwortet der Data-Cache und es gibt nichts
 * zu zählen.
 */

const AKTIV = process.env.FADEN_DEBUG === "1";

type Zaehler = { gesamt: number; seite: number };

/** Am globalThis, damit HMR-Modulneuladen den Stand nicht zurücksetzt. */
function stand(): Zaehler {
  const g = globalThis as typeof globalThis & { __wpZaehler?: Zaehler };
  if (!g.__wpZaehler) g.__wpZaehler = { gesamt: 0, seite: 0 };
  return g.__wpZaehler;
}

/**
 * Eine WP-Abfrage melden. Ohne `FADEN_DEBUG=1` ein No-op (ein Vergleich, kein
 * Overhead), deshalb darf der Aufruf überall stehen.
 *
 * @param name kurzer Name für die Logzeile, z. B. `graphql:GetPostBySlug`
 *             oder `rest:wp/v2/posts`.
 */
export function zaehleWp(name: string): void {
  if (!AKTIV) return;
  const z = stand();
  z.gesamt += 1;
  z.seite += 1;
  console.log(`[wp] ${z.gesamt} ${name}`);
}

/** Name einer GraphQL-Abfrage aus dem Query-Text (`query Foo {…}`). */
export function graphqlName(query: unknown): string {
  const text = typeof query === "string" ? query : "";
  const m = text.match(/(?:query|mutation)\s+(\w+)/);
  return "graphql:" + (m ? m[1] : "anonym");
}

/**
 * Stand ablesen (für `/api/faden/wp-zaehler`). `reset` setzt den Seitenzähler
 * auf 0, damit der nächste Abruf genau die Abfragen einer Seite zeigt.
 *
 * Absichtlich NICHT aus `app/layout.tsx` gelesen: dort bräuchte es `headers()`,
 * und das würde jede ISR-Route auf dynamisches Rendern umstellen (Regel 11).
 */
export function wpZaehlerLesen(reset = false): { aktiv: boolean; gesamt: number; seite: number } {
  const z = stand();
  const out = { aktiv: AKTIV, gesamt: z.gesamt, seite: z.seite };
  if (reset) z.seite = 0;
  return out;
}
