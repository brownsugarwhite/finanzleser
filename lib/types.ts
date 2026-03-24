// ─────────────────────────────────────────────
// Basis-Typen
// ─────────────────────────────────────────────

export interface FeaturedImage {
  node: {
    sourceUrl: string;
    altText?: string;
  };
}

export interface Category {
  name: string;
  slug: string;
  description?: string;
  count?: number;
}

export interface Author {
  id?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  description?: string;
  avatar?: { url: string };
}

// ─────────────────────────────────────────────
// Post (Standard-Beitrag / Ratgeber-Artikel)
// ─────────────────────────────────────────────

export interface PostACF {
  beitragUntertitel?: string;
  beitragZusammenfassung?: string;
  beitragPdf?: { mediaItemUrl: string };
  beitragFeaturedTool?: boolean;
  beitragRechner?: Rechner[];
  beitragVergleich?: Vergleich[];
  beitragCheckliste?: Checkliste[];
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  date: string;
  excerpt?: string;
  content?: string;
  featuredImage?: FeaturedImage;
  categories: { nodes: Category[] };
  author?: { node: Author };
  beitragFelder?: PostACF;
  seo?: SEO;
}

// ─────────────────────────────────────────────
// Rechner
// ─────────────────────────────────────────────

export type RechnerTyp = "steuer" | "brutto_netto" | "festgeld" | "tagesgeld";

export interface RechnerACF {
  rechnerTyp: RechnerTyp;
  rechnerBeschreibung?: string;
  rechnerKonfiguration?: string; // JSON-String mit Berechnungslogik und Parametern
  rechnerIcon?: { sourceUrl: string };
  rechnerKategorie?: { name: string; slug: string };
}

export interface Rechner {
  id: string;
  title: string;
  slug: string;
  rechnerFelder?: RechnerACF;
}

// ─────────────────────────────────────────────
// Vergleich
// ─────────────────────────────────────────────

export type VergleichTyp = "festgeld" | "tagesgeld" | "kfz" | "strom" | "gas";

export interface Anbieter {
  anbieterName: string;
  anbieterBewertung?: number;
  anbieterLink?: string;
}

export interface VergleichACF {
  vergleichTyp: VergleichTyp;
  vergleichBeschreibung?: string;
  vergleichAnbieter?: Anbieter[];
}

export interface Vergleich {
  id: string;
  title: string;
  slug: string;
  vergleichFelder?: VergleichACF;
}

// ─────────────────────────────────────────────
// Checkliste
// ─────────────────────────────────────────────

export interface ChecklistePunkt {
  punktText: string;
  punktDetails?: string;
  punktPflicht?: boolean;
}

export interface ChecklisteACF {
  checklisteBeschreibung?: string;
  checklistePunkte?: ChecklistePunkt[];
  checklistePdfGenerierung?: boolean;
}

export interface Checkliste {
  id: string;
  title: string;
  slug: string;
  checklisteFelder?: ChecklisteACF;
}

// ─────────────────────────────────────────────
// SEO (Yoast)
// ─────────────────────────────────────────────

export interface SEO {
  title?: string;
  metaDesc?: string;
  canonical?: string;
  opengraphTitle?: string;
  opengraphDescription?: string;
  opengraphImage?: { sourceUrl: string };
}
