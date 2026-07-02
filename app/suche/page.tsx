import type { CSSProperties } from "react";
import Footer from "@/components/layout/Footer";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Spacer from "@/components/ui/Spacer";
import Button from "@/components/ui/Button";
import SearchHero from "@/components/sections/SearchHero";
import QuickAccessButtons from "@/components/sections/QuickAccessButtons";
import ArticleList from "@/components/sections/ArticleList";
import FinanztoolRows, { type ToolItem } from "@/components/sections/FinanztoolRows";
import DokumenteHead from "@/components/dokumente/DokumenteHead";
import DokumenteEmbed from "@/components/dokumente/DokumenteEmbed";
import ScrollToResults from "@/components/sections/ScrollToResults";
import PageAds from "@/components/layout/PageAds";
import {
  searchPosts,
  getSiteSettings,
  getAllRechner,
  getAllVergleiche,
  getAllChecklisten,
  getAllDokumente,
} from "@/lib/wordpress";
import { buildRechnerUrl, buildVergleichUrl, buildChecklisteUrl } from "@/lib/urls";
import { cleanDescription } from "@/lib/content-utils";
import { decodeHtmlEntities } from "@/lib/html-utils";
import type { Post } from "@/lib/types";

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

type ToolGroups = { rechner: ToolItem[]; vergleich: ToolItem[]; checkliste: ToolItem[] };

const TOOL_CFG = {
  rechner: { badge: "Rechner", cta: "Zum Rechner", allLabel: "Rechnern", allHref: "/finanztools/rechner", color: "var(--color-tool-rechner)" },
  vergleich: { badge: "Vergleiche", cta: "Zum Vergleich", allLabel: "Vergleichen", allHref: "/finanztools/vergleiche", color: "var(--color-tool-vergleiche)" },
  checkliste: { badge: "Checklisten", cta: "Zur Checkliste", allLabel: "Checklisten", allHref: "/finanztools/checklisten", color: "var(--color-tool-checklisten)" },
} as const;

/** Erster Satz der bereinigten Beschreibung (kurz halten für die Tool-Karten). */
function firstSentence(s: string): string {
  const m = s.match(/^[\s\S]*?[.!?](\s|$)/);
  return (m ? m[0] : s).trim();
}

function scorer(query: string) {
  const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return (hay: string) => {
    const h = hay.toLowerCase();
    return tokens.reduce((n, t) => n + (h.includes(t) ? 1 : 0), 0);
  };
}

/** Volltext-Match je Tool-Typ (Top 3) — wie FinanztoolGrid, aber suchgetrieben. */
async function getMatchingTools(query: string): Promise<ToolGroups> {
  const score = scorer(query);
  const [rechner, vergleiche, checklisten] = await Promise.all([
    getAllRechner(),
    getAllVergleiche(),
    getAllChecklisten(),
  ]);
  const top = <T,>(arr: { s: number; item: T }[]) =>
    arr.filter((o) => o.s > 0).sort((a, b) => b.s - a.s).slice(0, 3).map((o) => o.item);

  return {
    rechner: top(rechner.map((x) => ({
      s: score(`${x.title} ${x.excerpt || ""} ${x.rechnerFelder?.beschreibung || ""}`),
      item: { title: decodeHtmlEntities(x.title), desc: firstSentence(cleanDescription(x.rechnerFelder?.beschreibung || x.excerpt)), href: buildRechnerUrl(x.slug) } as ToolItem,
    }))),
    vergleich: top(vergleiche.map((x) => ({
      s: score(`${x.title} ${x.excerpt || ""}`),
      item: { title: decodeHtmlEntities(x.title), desc: firstSentence(cleanDescription(x.excerpt)), href: buildVergleichUrl(x.slug) } as ToolItem,
    }))),
    checkliste: top(checklisten.map((x) => ({
      s: score(`${x.title} ${x.excerpt || ""} ${x.checklisten?.checklistenBeschreibung || ""}`),
      item: { title: decodeHtmlEntities(x.title), desc: firstSentence(cleanDescription(x.checklisten?.checklistenBeschreibung || x.excerpt)), href: buildChecklisteUrl(x.slug) } as ToolItem,
    }))),
  };
}

/** Volltext-Match Dokumente (Top 4, Slugs für DokumenteEmbed). */
async function getMatchingDokumente(query: string): Promise<string[]> {
  const score = scorer(query);
  const dokumente = await getAllDokumente();
  return dokumente
    .map((d) => ({ s: score(`${d.title} ${d.excerpt || ""} ${d.dokumentKategorien?.nodes?.map((n) => n.name).join(" ") || ""}`), slug: d.slug }))
    .filter((o) => o.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 4)
    .map((o) => o.slug);
}

export default async function SearchPage(props: SearchPageProps) {
  const searchParams = await props.searchParams;
  const query = searchParams.q || "";

  let results: Post[] = [];
  let toolGroups: ToolGroups = { rechner: [], vergleich: [], checkliste: [] };
  let dokSlugs: string[] = [];
  if (query) {
    [results, toolGroups, dokSlugs] = await Promise.all([
      searchPosts(query),
      getMatchingTools(query),
      getMatchingDokumente(query),
    ]);
  }
  const hasTools = toolGroups.rechner.length + toolGroups.vergleich.length + toolGroups.checkliste.length > 0;

  const settings = await getSiteSettings();

  return (
    <>
      <main className="min-h-screen" style={{ backgroundColor: "var(--color-bg-page)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Suche", href: "/suche" }]} />
        </div>

        <section className="pb-12">
          {/* Such-Hero = „Heading"; bleibt breit zentriert. */}
          <div className="max-w-7xl mx-auto px-6">
            <SearchHero initialQuery={query} />
            <QuickAccessButtons />
            <ScrollToResults query={query} />

            <div style={{ position: "relative", zIndex: 1, marginTop: 56, marginBottom: 8 }}>
              <Spacer />
            </div>
          </div>

          {/* Ergebnisse exakt wie Unterkategorie: Content 728, Band-Rails. */}
          <PageAds ads={settings.ads.suche} variant="tool" contentWidth={728} railGap={46} topFormat="leaderboard" contentClassName="page-shell-col--exact">
            {query && results.length > 0 && (
              <div id="search-results" className="mt-8" style={{ scrollMarginTop: 24 }}>
                <p className="text-gray-600 mb-8" style={{ fontSize: 16 }}>
                  {results.length}{" "}
                  {results.length === 1 ? "Ergebnis" : "Ergebnisse"} für{" "}
                  <span style={{ fontFamily: "Merriweather, serif", fontSize: 23, fontStyle: "italic", fontWeight: 600, color: "var(--color-text-primary)" }}>
                    &ldquo;{query}&rdquo;
                  </span>
                </p>

                <ArticleList posts={results} />

                {/* Passende Tools je Typ (Rechner/Vergleiche/Checklisten), je max 3. */}
                {hasTools && (
                  <div className="finanztool-grids">
                    {(["rechner", "vergleich", "checkliste"] as const).map((key) => {
                      const items = toolGroups[key];
                      if (items.length === 0) return null;
                      const cfg = TOOL_CFG[key];
                      return (
                        <section key={key} className="finanztool-grid-section" style={{ ["--tool-color" as string]: cfg.color } as CSSProperties}>
                          <div className="finanztool-section-head">
                            <span className="finanztool-heading-badge" style={{ background: cfg.color }}>{cfg.badge}</span>
                            <span className="finanztool-section-sub">zu &bdquo;{query}&ldquo;</span>
                          </div>
                          <FinanztoolRows items={items} cta={cfg.cta} perRow={3} />
                          <div className="finanztool-allbtn">
                            <Button label={`Zu allen ${cfg.allLabel}`} href={cfg.allHref} />
                          </div>
                        </section>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {query && results.length === 0 && !hasTools && (
              <div id="search-results" className="text-center py-12 mt-8" style={{ scrollMarginTop: 24 }}>
                <p className="text-lg text-gray-600">
                  Keine Ergebnisse für{" "}
                  <span style={{ fontFamily: "Merriweather, serif", fontSize: 23, fontStyle: "italic", fontWeight: 600, color: "var(--color-text-primary)" }}>
                    &ldquo;{query}&rdquo;
                  </span>{" "}
                  gefunden.
                </p>
                <p className="text-sm text-gray-500 mt-2">Versuchen Sie mit anderen Suchbegriffen.</p>
              </div>
            )}
          </PageAds>

          {/* Passende Dokumente — volle Breite (wie auf den Unterkategorie-Seiten), max 4. */}
          {query && dokSlugs.length > 0 && (
            <section className="category-dokumente">
              <DokumenteHead headingId="search-dokumente-head" />
              <DokumenteEmbed slugs={dokSlugs} />
            </section>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
