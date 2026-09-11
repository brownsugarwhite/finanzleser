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
  /** Faden-Felder aus dem CMS (nur mit NEXT_PUBLIC_FADEN=1 abgefragt, sonst undefined). */
  faden?: FadenFelder;
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

// ─────────────────────────────────────────────
// Faden („Der Faden mit Leo“) — Beitragsfelder aus dem mu-plugin finanzleser-faden
// (Post-Meta als JSON-Strings, in GraphQL camelCase; lib/faden/felder.ts parst sie).
// Vertrag: docs/Konzept_Inhaltsvertrag.md
// ─────────────────────────────────────────────

export type FadenStatus = "entwurf" | "freigegeben";

export interface FadenKurzfassung {
  status?: FadenStatus;
  erzeugt_am?: string;
  erzeugt_von?: string;
  saetze: string[];
  quellen: string[];
}

export interface FadenFrage {
  /** Abschnitts-ID `heading-<n>` (Zählung über alle h2, 0 = Kicker, 1 = Einleitung). */
  abschnitt: string;
  abschnitt_titel?: string;
  status?: FadenStatus;
  frage: string;
  antwort: string;
  quellen: string[];
}

export type FadenZielTyp = "post" | "rechner" | "checkliste" | "vergleich" | "dokumente" | "glossar" | "spiel";

export interface FadenEinwurf {
  /** Abschnitts-ID, nach der das Werkzeug erscheint. */
  nach: string;
  typ: FadenZielTyp;
  slug: string;
  grund?: string;
}

export interface FadenZiel {
  typ: FadenZielTyp;
  slug: string;
}

export type StatistikArt = "torte" | "saeulen" | "balken";

export interface StatistikWert {
  label: string;
  wert: number;
  /** Optional: eigene Farbe (Token oder Hex), sonst Reihenfolge der Palette. */
  farbe?: string;
}

export interface StatistikReihe {
  key: string;
  label: string;
  werte: StatistikWert[];
}

export interface StatistikFormel {
  typ: "rechner" | "faktor";
  /** typ rechner: Slug in lib/calculators (Allowlist in lib/statistik/formeln.ts). */
  rechner?: string;
  eingabe?: string;
  ausgabe?: string;
  basis?: Record<string, number | string | boolean>;
  /** typ faktor: Label des Werts, auf den der Regler linear skaliert. */
  bezug?: string;
}

export interface StatistikRegler {
  label: string;
  min: number;
  max: number;
  schritt: number;
  start: number;
  einheit?: string;
  formel: StatistikFormel;
  /** true: „Ihr Wert“ erscheint als eigener Balken/Säule im Diagramm (nur bei gleicher Einheit sinnvoll); sonst nur als Zeile unter dem Regler. */
  imDiagramm?: boolean;
  /** Beschriftung der Ergebniszeile („Ihr Kindergeld im Monat“) und deren Einheit, falls anders als das Diagramm. */
  ergebnis?: string;
  ergebnisEinheit?: string;
}

export interface FadenStatistik {
  abschnitt: string;
  abschnitt_titel?: string;
  art: StatistikArt;
  titel: string;
  untertitel?: string;
  einheit: string;
  status?: FadenStatus;
  erzeugt_am?: string;
  quelle: { name: string; url: string; stand: string; sekundaer?: boolean };
  reihen: StatistikReihe[];
  umschalter?: { label: string };
  regler?: StatistikRegler;
  hinweis?: string;
}

export interface FadenFelder {
  kurzfassung?: FadenKurzfassung;
  leoFragen: FadenFrage[];
  glossarBegriffe: string[];
  leoEinwuerfe: FadenEinwurf[];
  dazuPasst: FadenZiel[];
  waechterRegeln: string[];
  statistiken: FadenStatistik[];
}

/** Glossarbegriff (CPT `glossar` aus wordpress/mu-plugins/finanzleser-faden.php; nur mit Faden-Schalter abgefragt). */
/** Spiel des Fadens (Beitragstyp `spiel`, mu-plugin finanzleser-faden). */
export interface Spiel {
  id: string;
  slug: string;
  title: string;
  /* „karte" (Drehkarte, „Begriff erklärt") und „rubbellos" sind am 11.09.2026 gestrichen:
     die Drehkarte erklärt Begriffe — das macht im Faden das Glossar an Ort und Stelle —,
     und „rubbellos" hatte nie eine rendernde Komponente. Das Rubbeln gibt es weiterhin,
     es heißt „gewusst". */
  typ: "mythos" | "quiz" | "schaetzen" | "gewusst" | "finanzwort";
  felder: Record<string, string>;
  wappen: string;
  status: string;
  punkte: number;
  /** YYYY-MM-DD oder null = zeitlos. */
  datum: string | null;
}

export interface GlossarEintrag {
  id: string;
  title: string;
  slug: string;
  /** Erklärung = post_content (im Schema `content`, nicht `erklaerung`). */
  content: string;
  varianten: string[];
  quelle: string;
  /** Slug des verknüpften Ratgebers. */
  ratgeber: string;
  /** "rechner/unterhalt", "checkliste/elternunterhalt", "vergleich/…", "dokument/…". */
  tool: string;
  frage: string;
  antwort: string;
  wappen: string;
  status: string;
  rubrik: string;
}
