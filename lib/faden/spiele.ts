/**
 * Spiele des Fadens (Beitragstyp `spiel`): Finanzwort des Tages, Mythos, Schätzfrage,
 * Quiz, Gewusst, Rubbellos, Begriffskarte. Datumsgebundene Spiele (`datum`) werden
 * für den Tag ausgespielt; sonst gilt das jüngste vergangene.
 */
import { getAllSpiele } from "@/lib/wordpress";
import type { Spiel } from "@/lib/types";

/** Heutiges Datum in Berlin als YYYY-MM-DD. */
export function heuteBerlin(d = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/** Das Spiel eines Typs für einen Tag: exakt das Datum, sonst das jüngste davor (nie ein künftiges). */
export async function spielAm(typ: Spiel["typ"], datum = heuteBerlin()): Promise<Spiel | null> {
  const alle = (await getAllSpiele()).filter((s) => s.typ === typ && s.status !== "entwurf");
  const exakt = alle.find((s) => s.datum === datum);
  if (exakt) return exakt;
  const frueher = alle.filter((s) => s.datum && s.datum < datum).sort((a, b) => (a.datum! < b.datum! ? 1 : -1));
  return frueher[0] || alle.find((s) => !s.datum) || null;
}

/** Laufende Nummer eines datierten Spiels (1 = das älteste freigegebene dieses Typs). */
export async function spielNummer(spiel: Spiel): Promise<number> {
  const alle = (await getAllSpiele()).filter((s) => s.typ === spiel.typ && s.datum && s.status !== "entwurf").sort((a, b) => (a.datum! < b.datum! ? -1 : 1));
  const i = alle.findIndex((s) => s.slug === spiel.slug);
  return i < 0 ? 1 : i + 1;
}
