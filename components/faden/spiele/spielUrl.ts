/** Adresse einer Spielseite im Faden (Stufe 1): /spiele/<slug>, z. B. /spiele/finanzwort-2026-09-08. */
export function spielUrl(slug: string): string {
  return `/spiele/${slug}`;
}
