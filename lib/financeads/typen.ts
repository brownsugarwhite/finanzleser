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
  /**
   * Nur zeigen, wenn ein anderer Parameter diesen Wert hat — deklarativ, weil `DefLite`
   * als JSON in die Insel reist und keine Funktionen tragen darf.
   *
   * Gebraucht bei der Tierversicherung: die Rassegruppe trägt nur bei Hunden Tarife. Bei
   * Katzen hat Gruppe 2 null und Gruppe 3 genau einen (gemessen 16.09.2026) — drei Stufen
   * anzubieten, von denen zwei ins Leere führen, ist eine Falle.
   */
  wenn?: { key: string; ist: string };
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
  /**
   * Nur in den aufgeklappten Details, nie in der Zusammenfassung.
   *
   * 🚨 Nicht dasselbe wie `schmal`: das blendet eine Spalte unter 1060 px aus, meint aber
   * weiterhin eine Kennzahl, die in den Gewinnerblock gehört (Sollzins, Laufzeit). Hier
   * geht es um Angaben, die erst beim Nachschlagen zählen — Zins bis, ⅔-Zins,
   * Bearbeitungsgebühr, Gültigkeitsbereich.
   */
  nurDetails?: boolean;
}

export type KennWert = number | string | boolean | null;

/** Ein Chip der Filterzeile: zeigt nur Zeilen, deren Kennzahl `wert` trifft. */
export interface FilterDef {
  key: string;
  label: string;
  wert: KennWert;
}

/**
 * Ein Register in „Ihre Angaben“, das die Liste eingrenzt, ohne an die API zu gehen —
 * anders als `params`, die einen neuen Abruf auslösen.
 *
 * Der Handoff verlangt die drei Sicherungsstufen des Festgelds ausdrücklich als Register,
 * nicht als Chips („… Festgeld & Eingaben“:65): es ist eine Entscheidung mit drei Stufen,
 * keine Sammlung unabhängiger Haken.
 *
 * Jede Stufe bringt ihre eigene Bedingung mit — „Nur Deutschland“ prüft das Land,
 * „Nur Top-Bonität“ eine andere Kennzahl. Eine Stufe ohne `kennzahl` filtert nicht.
 */
export interface AuswahlOption {
  wert: string;
  label: string;
  kennzahl?: string;
  ist?: KennWert;
}

export interface AuswahlDef {
  key: string;
  label: string;
  standard: string;
  optionen: AuswahlOption[];
}

/**
 * Wie eine Kennzahl aus der Angebotsliste entsteht. Bewusst deklarativ statt als
 * Funktion: `DefLite` reist als JSON in die Insel und darf keine Funktionen tragen.
 */
export type KennzahlFormel =
  | { art: "best" | "schnitt"; key: string }
  /** Unterschied zwischen Durchschnitt und Bestwert, wahlweise mal einem Parameter (Monate). */
  | { art: "differenz"; key: string; mal?: string }
  /** Bestwert minus Kaufkraftverlust über `jahreAus` Monate. */
  | { art: "real"; key: string; jahreAus: string };

export interface KennzahlDef {
  key: string;
  label: string;
  /** Beizeile unter der Zahl. */
  unter?: string;
  art: SpaltenArt;
  ton: "werkzeug" | "grau" | "gruen";
  /** Die dritte Kennzahl steht groß und nimmt bei schmalem Satz die volle Breite. */
  gross?: boolean;
  formel: KennzahlFormel;
  /** Was gilt, wenn die Zahl negativ wird (Festgeld: Kaufkraft sinkt trotz Zinsen). */
  negativ?: { unter: string };
}

export interface KursblattDef {
  /** Streuung = ein Punkt je Angebot (Vorgabe); Kurve = bester Wert je Laufzeit. */
  band?: "streuung" | "kurve";
  /** Ein Gewinner (Festgeld) oder Gewinner plus Platz 2 und 3 (Kredit). */
  podest: 1 | 3;
  /** Aufdruck des Stempels; fehlt er, steht „Bestwert“ da. */
  stempel?: string;
  /** Zeile „Mehrkosten zum Bestwert“ auf den Plätzen 2 und 3. */
  mehrkosten?: { key: string; mal?: string; label: string };
  /**
   * Die Zahl, die das Produkt kennzeichnet: groß im Gewinnerblock und Achse der Zinskurve.
   * Fehlt sie, ist es die Bestwert-Spalte.
   *
   * Beim Kredit fallen beide zusammen — der Effektivzins ordnet die Angebote UND
   * kennzeichnet sie. Beim Festgeld nicht: sortiert wird nach dem Ertrag in Euro (der
   * hängt am Betrag), gemeint ist aber der Zins („… Festgeld & Eingaben“:118).
   */
  kennwert?: string;
  /**
   * Dritte Spalte der Angebotsliste, zusätzlich zu Bestwert und Gesamtzahl.
   * Beim Festgeld das Land — dort ist es die Sicherheitsaussage und gehört nicht in die
   * aufgeklappten Details („… Festgeld & Eingaben“:140).
   *
   * `punkt` nennt eine Ja/Nein-Kennzahl, die den Punkt davor grün färbt (F:151).
   */
  dritteSpalte?: { key: string; punkt?: string };
  /**
   * Zeilen, die zwar in den Daten stehen, aber kein Angebot sind. Sie stehen nicht in der
   * Liste; darunter steht, wie viele es waren und warum.
   *
   * Beim Festgeld führen drei von 28 Banken 0 % — ihre Konditionszeilen sind seit 2024
   * bzw. 2025 unverändert (gemessen 15.09.2026). In einer nach Ertrag sortierten Liste
   * sind sie kein Angebot, sondern Rauschen; sie wegzulassen, ohne es zu sagen, wäre
   * allerdings eine stille Auswahl.
   */
  ohne?: { key: string; ist: KennWert; text: string };
}

export type Gruppe = "anlegen" | "konto" | "kredit" | "versicherung";

export interface KategorieDef {
  kategorie: Kategorie;
  version: ApiVersion;
  klasse: Klasse;
  /** Rubrik der Vergleichsübersicht. */
  gruppe: Gruppe;
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
  /**
   * Umschalter der Filterzeile. Die alte Liste zeigt den ERSTEN als Schalter, das
   * Kursblatt alle als Chips (Handoff „Nur mit: …“, K:170-175).
   */
  filter?: FilterDef[];
  /**
   * Auswahl mit mehr als zwei Stufen — im Kursblatt ein Register, nicht ein Chip
   * (Handoff F:65: „Einlagensicherung: Alle EU-Länder / Nur Top-Bonität / Nur Deutschland“).
   * `wert: null` heißt „alles zeigen“.
   */
  auswahl?: AuswahlDef[];
  /** Die drei Kennzahlen unter dem Marktüberblick; fehlt sie, greift eine generische Vorgabe. */
  kennzahlen?: KennzahlDef[];
  /** Was das Kursblatt aus dieser Kategorie macht. */
  kursblatt?: KursblattDef;
  /** Standard-Sortierung (Schlüssel aus `spalten`). */
  sortierung: { key: string; label: string }[];
  /** Beschriftung der Gesamtzahl rechts („Ertrag", „Beitrag / Jahr", „Rate / Monat"). */
  totalLabel?: string;
  /** Schlagwörter für Leos Karten-Zuordnung und die Suche. */
  suchwoerter: string[];
  /** Pflichthinweis unter der Liste (PAngV bei Krediten, Risikohinweis bei Krypto). */
  hinweis?: string;
  /**
   * Rohprodukt → Kennzahlen dieser Kategorie. Nur im Server/Skript aufgerufen.
   * `params` sind die angefragten Werte — nötig, wo das Angebot selbst sagt, für welche
   * Summen und Laufzeiten es überhaupt gilt (Kredit: `interest_effective.requirements`).
   */
  lesen: (p: ApiProdukt, params: Record<string, string>) => Record<string, KennWert>;
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
  /** Leos Begründung für den Bestwert („höchster Ertrag mit deutscher Einlagensicherung“). */
  bestwertGrund?: string;
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
  /**
   * Zinskurve je Laufzeit — im Server aus allen Varianten gerechnet, bevor sie auf die
   * Voreinstellung gekürzt werden (siehe `zinskurve` in kursblatt.ts). Steht NICHT im
   * Schnappschuss in WordPress.
   */
  kurve?: { punkte: { wert: string; label: string; kurz: string; best: number; schnitt: number }[]; paramKey: string; basis: Record<string, string> };
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

/** Serialisierbare Sicht auf eine KategorieDef — ohne Funktionen, reist in die Insel-Werte und zum Client. */
export type DefLite = Pick<KategorieDef, "kategorie" | "klasse" | "gruppe" | "defekt" | "titel" | "einzahl" | "mehrzahl" | "params" | "spalten" | "bestwert" | "filter" | "auswahl" | "kennzahlen" | "kursblatt" | "sortierung" | "totalLabel" | "hinweis">;
