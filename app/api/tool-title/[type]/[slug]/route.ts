import { NextRequest, NextResponse } from "next/server";
import { getRechnerBySlug, getChecklisteBySlug } from "@/lib/wordpress";
import { VERGLEICH_DESCRIPTIONS } from "@/lib/vergleichDescriptions";

// Tool-Titel/-Beschreibung ändern sich selten → 1h cachen (vorher ungecacht,
// jeder Tool-Embed im Artikel löste einen frischen WP-Roundtrip aus).
export const revalidate = 86400;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; slug: string }> }
) {
  const { type, slug } = await params;

  if (type === "rechner") {
    const rechner = await getRechnerBySlug(slug);
    // Natives excerpt bevorzugt (ACF-Ablösung), ACF-Feld als Fallback.
    const excerpt = rechner?.excerpt || rechner?.rechnerFelder?.beschreibung || "";
    return NextResponse.json({ title: rechner?.title || "", excerpt });
  }

  if (type === "checkliste") {
    const checkliste = await getChecklisteBySlug(slug);
    // Beschreibung wird nach der Tool-Überschrift im Artikel angezeigt. Quelle:
    // natives excerpt bevorzugt (Ziel der ACF-Ablösung), ACF-Feld als Fallback.
    const excerpt = checkliste?.excerpt || checkliste?.checklisten?.checklistenBeschreibung || "";
    return NextResponse.json({ title: checkliste?.title || "", excerpt });
  }

  if (type === "vergleich") {
    // Fetch title from WordPress REST API
    const wpUrl = (process.env.WORDPRESS_API_URL || "http://finanzleser.local/graphql").replace("/graphql", "");
    // Beschreibung kommt aus dem Code-Map (Vergleich-CPT unterstützt kein
    // WP-Excerpt); ein evtl. doch vorhandenes WP-Excerpt hat Vorrang.
    const fallback = VERGLEICH_DESCRIPTIONS[slug] || "";
    try {
      const res = await fetch(`${wpUrl}/wp-json/wp/v2/vergleich?slug=${encodeURIComponent(slug)}&_fields=title,excerpt`);
      const posts = await res.json();
      const wpExcerpt = (posts[0]?.excerpt?.rendered || "").trim();
      return NextResponse.json({
        title: posts[0]?.title?.rendered || "",
        excerpt: wpExcerpt || fallback,
      });
    } catch {
      return NextResponse.json({ title: "", excerpt: fallback });
    }
  }

  return NextResponse.json({ title: "" });
}
