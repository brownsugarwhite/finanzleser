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

export interface Post {
  id: string;
  title: string;
  slug: string;
  date: string;
  /** Letztes Änderungsdatum aus WP (ContentNode.modified) — für sitemap lastmod + article:modified_time. */
  modified?: string;
  excerpt?: string;
  content?: string;
  featuredImage?: FeaturedImage;
  categories: { nodes: Category[] };
  author?: { node: Author };
  /** Untertitel/Kicker. Kommt aus WP-Meta `beitrag_untertitel` (früher ACF beitragFelder.beitragUntertitel). */
  untertitel?: string;
  seo?: SEO;
  /** Aus dem post_content abgeleitete eingebettete Finanztools (für Tool-Dots/Labels). */
  tools?: ("rechner" | "vergleich" | "checkliste" | "dokumente")[];
}

// ─────────────────────────────────────────────
// Rechner
// ─────────────────────────────────────────────

export type RechnerTyp = "steuer" | "soziales" | "rente" | "kredit" | "brutto_netto" | "festgeld" | "tagesgeld";

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
  /** Steuert, welche Rechner-Komponente das Frontend lädt. WP-Meta `rechner_typ`. */
  rechnerTyp?: RechnerTyp | RechnerTyp[];
  /** Kurzbeschreibung für Karten und Übersichten. WP-Meta `rechner_beschreibung`. */
  beschreibung?: string;
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
  excerpt?: string;
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

export interface Checkliste {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  /** Kurzbeschreibung. WP-Meta `checkliste_beschreibung`. */
  beschreibung?: string;
  /** URL des hinterlegten PDFs, aus dem die interaktive Checkliste gebaut wird. */
  pdfUrl?: string;
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

// ─────────────────────────────────────────────
// Site-Settings (WP-Options via finanzleser-site-settings)
// ─────────────────────────────────────────────

export type TopBannerVisibility = "all" | "landing" | "off";
export type SiteLinkType = "none" | "internal" | "external" | "anchor";

export interface TopBannerSettings {
  visibility: TopBannerVisibility;
  text: string;
  link_type: SiteLinkType;
  link_value: string;
}

// Werbebanner in Beiträgen — pro Platzierung einzeln schaltbar.
export interface ArticleAdsSettings {
  top: boolean; // breiter Banner zwischen Nav und Breadcrumb
  rails: boolean; // sticky Seiten-Rails links + rechts
  mid: boolean; // breiter Banner in der Artikelmitte
}

// Werbe-Platzierungen pro Seitentyp — einzeln über das WP-Backend schaltbar.
// `mid` ist nur dort sinnvoll/verdrahtet, wo längere Prosa existiert (article/anbieter).
export interface PageAdsSettings {
  top: boolean; // breiter Banner zwischen Heading und Content
  rails: boolean; // sticky Seiten-Rails links + rechts
  mid?: boolean; // breiter Banner in der Mitte/unten
}

// Pro Seitentyp eigene Schalter. Default überall aus (siehe SITE_SETTINGS_FALLBACK).
export interface SiteAdsSettings {
  article: PageAdsSettings;
  rechner: PageAdsSettings;
  vergleich: PageAdsSettings;
  checkliste: PageAdsSettings;
  anbieter: PageAdsSettings;
  kategorie: PageAdsSettings; // Kategorie- + Subkategorie-Listen
  suche: PageAdsSettings;
  dokumente: PageAdsSettings; // Dokumente-Listenseite
}

export interface SiteSettings {
  top_banner: TopBannerSettings;
  // Legacy-Quelle für Artikel-Ads (bleibt als Fallback für ads.article erhalten).
  article_ads: ArticleAdsSettings;
  // Neue, pro-Seitentyp granulare Werbe-Schalter.
  ads: SiteAdsSettings;
}
