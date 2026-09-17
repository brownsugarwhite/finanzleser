/**
 * Ist dieser Link eine Faden-Navigation — und wenn ja, wohin?
 *
 * Eine Quelle für zwei Stellen: den Klick-Abfänger im FadenProvider und das Vorausladen
 * (lib/faden/usePrefetch.ts). Sie MÜSSEN dieselbe Antwort geben, sonst lädt der Faden
 * Ziele vor, die er gar nicht selbst öffnet — oder umgekehrt.
 *
 * `null` heißt: Finger weg, der Browser macht das (extern, Download, Datei, API, Anker
 * in der Seite, Glossarbegriff mit eigenem Klickmenü).
 */
export function fadenZiel(a: HTMLAnchorElement | null | undefined): string | null {
  if (!a || a.target === "_blank" || a.hasAttribute("download") || a.dataset.fadenAus !== undefined) return null;
  if (a.classList.contains("begriff")) return null; // Klickmenü (BegriffMenue) übernimmt
  let url: URL;
  try { url = new URL(a.href, location.href); } catch { return null; }
  if (url.origin !== location.origin) return null;
  if (url.pathname === location.pathname && url.hash) return null; // Anker in der Seite
  if (/\.(pdf|jpe?g|png|webp|svg|gif|zip|xlsx?|docx?)$/i.test(url.pathname)) return null;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/wp-content/")) return null;
  return url.pathname + url.search + url.hash;
}

/** Zeigt der Link auf die Seite, auf der wir schon stehen? */
export function istHier(ziel: string): boolean {
  const u = new URL(ziel, location.href);
  return u.pathname === location.pathname && u.search === location.search;
}
