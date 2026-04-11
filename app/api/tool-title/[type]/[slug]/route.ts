import { NextRequest, NextResponse } from "next/server";
import { getRechnerBySlug, getChecklisteBySlug } from "@/lib/wordpress";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; slug: string }> }
) {
  const { type, slug } = await params;

  if (type === "rechner") {
    const rechner = await getRechnerBySlug(slug);
    const excerpt = rechner?.rechnerFelder?.beschreibung || rechner?.excerpt || "";
    return NextResponse.json({ title: rechner?.title || "", excerpt });
  }

  if (type === "checkliste") {
    const checkliste = await getChecklisteBySlug(slug);
    return NextResponse.json({ title: checkliste?.title || "" });
  }

  if (type === "vergleich") {
    // Fetch title from WordPress REST API
    const wpUrl = (process.env.WORDPRESS_API_URL || "http://finanzleser.local/graphql").replace("/graphql", "");
    try {
      const res = await fetch(`${wpUrl}/wp-json/wp/v2/vergleich?slug=${encodeURIComponent(slug)}&_fields=title`);
      const posts = await res.json();
      return NextResponse.json({ title: posts[0]?.title?.rendered || "" });
    } catch {
      return NextResponse.json({ title: "" });
    }
  }

  return NextResponse.json({ title: "" });
}
