import { NextRequest, NextResponse } from "next/server";
import { getPostBySlug } from "@/lib/wordpress";
import { getFirstParagraph, getReadingTimeMinutes, detectToolTypes } from "@/lib/content-utils";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  const post = await getPostBySlug(slug);
  if (!post) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const content = post.content || "";
  return NextResponse.json({
    firstParagraph: getFirstParagraph(content),
    readingTime: getReadingTimeMinutes(content),
    tools: detectToolTypes(content),
  });
}
