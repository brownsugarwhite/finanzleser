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
  parent?: null | number | { id?: string; slug?: string };
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

export type RechnerTyp = "steuer" | "soziales" | "rente" | "kredit" | "brutto_netto" | "festgeld" | "tagesgeld";

export interface RechnerACF {
  rechnerTyp: RechnerTyp | RechnerTyp[];
  rechnerBeschreibung?: string;
  beschreibung?: string; // GraphQL-Feldname aus ACF
  rechnerKonfiguration?: string;
  rechnerIcon?: { sourceUrl: string };
  rechnerKategorie?: { name: string; slug: string };
}

export interface Rechner {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  featuredImage?: {
    node: {
      sourceUrl: string;
      altText?: string;
    };
  };
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

// ─────────────────────────────────────────────
// Anbieter (CPT: Versicherer- / Firmen-Kontaktseiten)
// ─────────────────────────────────────────────

export interface AnbieterPost {
  id: string;
  title: string;
  slug: string;
  content: string;
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
  checklistePdf?: { mediaItemUrl: string };
}

export interface Checkliste {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  checklisteFelder?: ChecklisteACF;
  checklisten?: {
    checklistenBeschreibung?: string;
    checklistePdf?: { node: { mediaItemUrl: string } };
  };
}

// ─────────────────────────────────────────────
// Dokumente (CPT)
// ─────────────────────────────────────────────

export interface DokumentKategorie {
  name: string;
  slug: string;
}

export interface Dokument {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  pdfFile?: {
    mediaItemUrl: string;
    fileSize?: number | string;
    title?: string;
    mediaDetails?: { file?: string };
  };
  dokumentKategorien?: { nodes: DokumentKategorie[] };
  featuredImage?: { node: { sourceUrl: string } };
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

// ─────────────────────────────────────────────
// Rechner-Konfiguration (WordPress ACF)
// ─────────────────────────────────────────────

export interface RechnerConfigOverrides {
  rc_mindestlohn?: number;
  rc_kindergeld?: number;
  rc_rentenwert?: number;
  rc_rv_an?: number;
  rc_kv_an?: number;
  rc_kv_zusatz?: number;
  rc_pv_kinderlos?: number;
  rc_alv_an?: number;
  rc_grundfreibetrag?: number;
  rc_bbg_kv?: number;
  rc_bbg_rv?: number;
  rc_elterngeld_min?: number;
  rc_elterngeld_max?: number;
  rc_letzte_aktualisierung?: string;
}
