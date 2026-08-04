/**
 * Autorenbox-Daten. Seit 08/2026 (EU-KI-Verordnung Art. 50, Transparenzpflichten)
 * OHNE Personennamen: einheitlich „Finanzleser-Redaktion" mit Verantwortlichkeits-
 * angabe. Das frühere 6-Personen-Roster (fiktive Namen) ist damit abgelöst.
 */

export interface Redakteur {
  name: string;
  role: string;
  imageUrl: string;
  colorVariant: 1 | 2 | 3 | 4 | 5 | 6;
}

const REDAKTION: Redakteur = {
  name: "Finanzleser-Redaktion",
  role: "Verantwortlich für den Inhalt: Finconext GmbH, Frankfurt am Main.",
  imageUrl: "/assets/redaktion/redaktion-01.jpg",
  colorVariant: 6,
};

/** Signatur bleibt slug-basiert (Call-Sites unverändert) — liefert immer die Redaktion. */
export function getRedakteurForSlug(_slug: string): Redakteur {
  return REDAKTION;
}
