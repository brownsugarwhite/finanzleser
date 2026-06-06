import { NextRequest, NextResponse } from "next/server";
import { getPostContentBySlug } from "@/lib/wordpress";
import { getFirstParagraph, getReadingTimeMinutes, detectToolTypes } from "@/lib/content-utils";

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

  return NextResponse.json({
    firstParagraph: getFirstParagraph(content),
    readingTime: getReadingTimeMinutes(content),
    tools: detectToolTypes(content),
  });
}
