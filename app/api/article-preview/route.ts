import { NextRequest, NextResponse } from "next/server";
import { getPostContentBySlug } from "@/lib/wordpress";
import { getFirstParagraph, getReadingTimeMinutes, detectToolTypes } from "@/lib/content-utils";
import { extractArticleHeader } from "@/lib/articleHeader";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  const content = await getPostContentBySlug(slug);
  if (content === null) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // Neue Konvention: echter Titel/Beschreibung stehen im Content (h1 + p) — das
  // WP-Untertitel-Feld ist veraltet. Hier ableiten, damit die Vorschau den
  // korrekten Titel zeigt.
  const header = extractArticleHeader(content);

  return NextResponse.json({
    title: header?.title ?? null,
    description: header?.description ?? null,
    firstParagraph: getFirstParagraph(content),
    readingTime: getReadingTimeMinutes(content),
    tools: detectToolTypes(content),
  });
}
