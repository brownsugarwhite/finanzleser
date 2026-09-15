/**
 * Datenmodell der eigenen Vergleichsrechner auf Basis der financeads-API.
 *
 * Zwei Welten, bewusst getrennt:
 *   ApiProdukt      — die Rohform, wie `api.financeads.net` sie liefert (15–395 KB je Kategorie,
 *                     Felder je Kategorie verschieden, nur lose typisiert).
 *   VergleichProdukt — unsere schlanke Form (wenige Felder, deutsch beschriftete Kennzahlen).
 *                     Nur sie reist ins HTML, in die Insel-Werte und in den WP-Snapshot.
 *
 * 🚨 Zwei Produktklassen (gemessen 15.09.2026): Klasse A liefert Konditionen und ein fertig
 * gerechnetes `calculated_conditions.total`; Klasse B (neun Versicherungskategorien) liefert NUR
 * Name, Versicherer, Logo, Prüfsiegel und Partnerlink. Für B gibt es keine Kennzahlen — die
 * Anbieterliste ist ehrlich, sie erfindet keine Beiträge.
 */

export type Kategorie =
  | "savingsaccounts" | "fixedsavingsaccounts" | "currentaccounts" | "businessaccounts"
  | "creditcards" | "brokerageaccounts" | "loans" | "mortgages" | "buildingsavings"
  | "roboadvisor" | "cryptos" | "crowdinvesting" | "taxsoftware"
  | "rentaldepositinsurances" | "pethealthinsurances" | "supplementarydentalinsurances"
  | "liabilityinsurances" | "homeinsurances" | "legalprotectioninsurances" | "termlifeinsurances"
  | "funeralexpenseinsurances" | "dogliabilityinsurances" | "horseliabilityinsurances"
  | "deviceinsurances" | "travelhealthinsurances";

export type Klasse = "A" | "B";
export type ApiVersion = "v1" | "v1.02";
export type Richtung = "hoch" | "runter";

/** Ein Parameter der Parameterzeile (Anlagebetrag, Laufzeit …) oder ein fester Filter (Variante). */
export interface ParamDef {
  key: string;
  label: string;
  typ: "zahl" | "wahl";
  standard: number | string;
  einheit?: string;
  min?: number;
  max?: number;
  schritt?: number;
  /** Chips der Parameterzeile; jede Preset-Kombination liegt im Snapshot vor. */
  presets?: (number | string)[];
  optionen?: { wert: string; label: string }[];
  /** true = Wert kann nur die Redaktion setzen (Variante), nie der Leser. */
  fest?: boolean;
}

/** „saldo": positiv = Kosten, negativ = Ertrag (Girokonto mit Guthabenzins). */
export type SpaltenArt = "geld" | "prozent" | "zahl" | "text" | "haken" | "monate" | "saldo";

export interface SpalteDef {
  key: string;
  label: string;
  /** Kurzform für die Kopfzeile (Versalien, wenig Platz). */
  kurz?: string;
  art: SpaltenArt;
  einheit?: string;
  /** Welche Richtung ist besser? Nur sortierbare Spalten. */
  richtung?: Richtung;
  /** Ab < 1060 px ausgeblendet (Handoff: „Vergleich ohne Schlüssel/Forderung-Spalten"). */
  schmal?: boolean;
  /** Zahl mit Präfix „ab" (Kredite: bonitätsabhängig). */
  ab?: boolean;
}

export type KennWert = number | string | boolean | null;

export interface KategorieDef {
  kategorie: Kategorie;
  version: ApiVersion;
  klasse: Klasse;
  /** Endpunkt bei financeads kaputt (Reisekranken, 15.09.2026): Seite zeigt Hinweis, noindex. */
  defekt?: boolean;
  /** „Tagesgeld", „Girokonto" — für Titel, Kicker, Sätze. */
  titel: string;
  /** „Tagesgeldkonto", „Tarif" — Einzahl der Produkte in Sätzen. */
  einzahl: string;
  /** Mehrzahl: „Konten", „Tarife", „Depots". */
  mehrzahl: string;
  params: ParamDef[];
  spalten: SpalteDef[];
  /** Kennzahl, nach der der Bestwert bestimmt wird; Klasse B hat keine. */
  bestwert?: { key: string; richtung: Richtung };
  /** Standard-Sortierung (Schlüssel aus `spalten`). */
  sortierung: { key: string; label: string }[];
  /** Beschriftung der Gesamtzahl rechts („Ertrag", „Beitrag / Jahr", „Rate / Monat"). */
  totalLabel?: string;
  /** Schlagwörter für Leos Karten-Zuordnung und die Suche. */
  suchwoerter: string[];
  /** Pflichthinweis unter der Liste (PAngV bei Krediten, Risikohinweis bei Krypto). */
  hinweis?: string;
  /** Rohprodukt → Kennzahlen dieser Kategorie. Nur im Server/Skript aufgerufen. */
  lesen: (p: ApiProdukt) => Record<string, KennWert>;
  /** Kurze Begründung des Bestwerts für Leo („höchster Ertrag bei deutscher Einlagensicherung"). */
  begruendung?: (p: VergleichProdukt) => string;
}

/** Konfiguration eines Vergleichs, wie sie der Block `finanzleser/vergleich-quelle` speichert. */
export interface VergleichQuelle {
  embedType: "financeads";
  kategorie: Kategorie;
  /** Feste Filter der Variante (target_group, animal_type, type …) — nicht vom Leser änderbar. */
  fest: Record<string, string>;
  /** Voreinstellungen der Parameterzeile; fehlende Schlüssel → Registry-Standard. */
  vor: Record<string, number | string>;
  /** Eigene Preset-Chips je Parameter (z. B. Minikredit: kleine Beträge, kurze Laufzeiten). */
  presets?: Record<string, (number | string)[]>;
  /** Höchstzahl der Produkte im Snapshot (Standard 40). */
  limit?: number;
  /** Überschreibt die Bestwert-Regel der Registry (Schlüssel einer Spalte). */
  bestwert?: string;
  /** Freitext der Redaktion unter der Liste. */
  hinweis?: string;
}

/** Ein Produkt in unserer Form. */
export interface VergleichProdukt {
  id: number;
  /** `base_data.type` — zugleich `comparison_api_kennung` für das Tracking. */
  typ: string;
  anbieter: string;
  tarif: string;
  /** 200×50-Logo (`//bilder.financeads.net/200050/<program>.png`), protokollrelativ aufgelöst. */
  logo?: string;
  siegel?: string[];
  kennzahlen: Record<string, KennWert>;
  /** Gesamtzahl aus `calculated_conditions.total`, wenn financeads eine liefert. */
  total?: { wert: number; art: "benefit" | "cost"; einheit: string };
  /** Affiliate-Klicklink (`tracking.url`). */
  link: string;
  /** Bis zu drei Vorteile aus `benefits[].text.de`. */
  vorteile: string[];
  /** Produktspezifischer Pflichttext (PAngV) oder Aktionshinweis. */
  hinweis?: string;
  bezahlt: boolean;
}

/** Eine Parameter-Kombination samt Ergebnisliste. */
export interface VergleichVariante {
  /** Stabiler Schlüssel der Parameter (`average_balance=5000&months=12`). */
  schluessel: string;
  params: Record<string, string>;
  produkte: VergleichProdukt[];
  /** Produkt-ID des Bestwerts nach Registry-Regel. */
  bestwert?: number;
}

/** Der Snapshot eines Vergleichs, wie er in WordPress liegt und in die Insel reist. */
export interface VergleichDaten {
  slug: string;
  kategorie: Kategorie;
  klasse: Klasse;
  /** Die Voreinstellung (Schlüssel der ersten Variante). */
  standard: string;
  varianten: VergleichVariante[];
  anzahl: number;
  /** Jüngstes `update_datetime` der Konditionen, sonst Abrufzeit (ISO). */
  stand: string;
  /** Abrufzeit (ISO). */
  geladen: string;
  /** Hinweise von financeads (`data.notices`, deutsch). */
  hinweise: string[];
}

/** Tagesreihe des Bestwerts je Kategorie — Rohstoff für den Zinsverlauf. */
export interface VerlaufEintrag { datum: string; wert: number }

// ─── Rohform der API ──────────────────────────────────────────────────────────────────
// Bewusst lose: die Felder unterscheiden sich je Kategorie, und die Registry greift mit
// eigenen Lesefunktionen hinein. Was hier fehlt, holt `feld()` aus `normalisieren.ts`.

export interface ApiBetrag { value?: number | string | null; unit?: string | null; frequency?: string | null; type?: string | null; prefix?: string | null; value_highest?: number | null; update_datetime?: string | null; requirements?: Record<string, unknown> }

export interface ApiProdukt {
  base_data: {
    id: number;
    type: string;
    name: string;
    advertiser?: { id: number; name: string; country_iso?: string };
    program?: { id: number; name: string; logo_urls?: Record<string, string> };
    landingpage_url?: string;
    tracking?: { url: string; target?: string };
    view_url?: string;
    commission?: boolean;
    image_urls?: { url: string; width?: number; height?: number; categorie?: string }[];
  };
  details?: Record<string, unknown> | unknown[];
  conditions?: Record<string, unknown> | unknown[];
  calculated_conditions?: { components?: unknown; total?: { sum: number | null; currency?: string | null; type?: string | null; prefix?: string | null } };
  benefits?: { text?: Record<string, string>; rang?: number }[];
  incentives?: { value?: number; description?: string; currency?: string }[];
}

export interface ApiAntwort {
  success: boolean;
  message?: string[] | string;
  data?: {
    products?: ApiProdukt[];
    product_groups?: unknown[];
    notices?: Record<string, Record<string, string>>;
    filter_settings?: Record<string, unknown>;
  };
}
