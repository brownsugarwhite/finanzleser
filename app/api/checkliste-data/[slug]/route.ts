import { NextRequest, NextResponse } from "next/server";
import { loadChecklisteData } from "@/lib/checklisteData";

export const runtime = "nodejs";
// HINWEIS: Bewusst KEIN Cache hier. Die Checklisten sollen frisch bleiben (vgl.
// getChecklisteBySlug → getClient(0)), damit aktualisierte Checklisten-PDFs sofort
// erscheinen statt verzögert. (Frühere Cache-Idee zurückgenommen zugunsten Freshness.)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const result = await loadChecklisteData(slug);
    if (!result) {
      return NextResponse.json({ error: "PDF not found" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error(`Error parsing checkliste "${slug}":`, error);
    return NextResponse.json({ error: "Parse error" }, { status: 500 });
  }
}
