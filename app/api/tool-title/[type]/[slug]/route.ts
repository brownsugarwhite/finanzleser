import { NextRequest, NextResponse } from "next/server";
import { getRechnerBySlug, getChecklisteBySlug } from "@/lib/wordpress";
import { VERGLEICH_DESCRIPTIONS } from "@/lib/vergleichDescriptions";
import { cacheHeaders } from "@/lib/httpCache";

// Tool-Titel/-Beschreibung ändern sich selten → 1h cachen (vorher ungecacht,
// jeder Tool-Embed im Artikel löste einen frischen WP-Roundtrip aus).
export const revalidate = 86400;

const TT_HEADERS = cacheHeaders(3600, 86400);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ type: string; slug: string }> }
) {
  const { type, slug } = await params;

  if (type === "rechner") {
    const rechner = await getRechnerBySlug(slug);
    // Natives excerpt bevorzugt (ACF-Ablösung), ACF-Feld als Fallback.
    const excerpt = rechner?.excerpt || rechner?.beschreibung || "";
    return NextResponse.json({ title: rechner?.title || "", excerpt }, { headers: TT_HEADERS });
  }

  if (type === "checkliste") {
    const checkliste = await getChecklisteBySlug(slug);
    // Beschreibung wird nach der Tool-Überschrift im Artikel angezeigt. Quelle:
    // natives excerpt bevorzugt (Ziel der ACF-Ablösung), ACF-Feld als Fallback.
    const excerpt = checkliste?.excerpt || checkliste?.beschreibung || "";
    return NextResponse.json({ title: checkliste?.title || "", excerpt }, { headers: TT_HEADERS });
  }

  if (type === "vergleich") {
    // Fetch title from WordPress REST API
    const wpUrl = (process.env.WORDPRESS_API_URL || "http://finanzleser.local/graphql").replace("/graphql", "");
    // Beschreibung kommt aus dem Code-Map (Vergleich-CPT unterstützt kein
    // WP-Excerpt); ein evtl. doch vorhandenes WP-Excerpt hat Vorrang.
    const fallback = VERGLEICH_DESCRIPTIONS[slug] || "";
    try {
      // Ohne next.revalidate wäre dieser Fetch in Next 15 no-store → WP-Roundtrip pro Aufruf.
      const res = await fetch(`${wpUrl}/wp-json/wp/v2/vergleich?slug=${encodeURIComponent(slug)}&_fields=title,excerpt`, { next: { revalidate: 3600 } });
      const posts = await res.json();
      const wpExcerpt = (posts[0]?.excerpt?.rendered || "").trim();
      return NextResponse.json({
        title: posts[0]?.title?.rendered || "",
        excerpt: wpExcerpt || fallback,
      }, { headers: TT_HEADERS });
    } catch {
      return NextResponse.json({ title: "", excerpt: fallback }, { headers: { "Cache-Control": "no-store" } });
    }
  }

  return NextResponse.json({ title: "" }, { headers: TT_HEADERS });
}
