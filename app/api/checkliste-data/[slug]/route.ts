import { NextRequest, NextResponse } from "next/server";
import { getChecklisteBySlug } from "@/lib/wordpress";
import { parsePDF } from "@/lib/checklisteParser";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const checkliste = await getChecklisteBySlug(slug);
  const pdfUrl = checkliste?.checklisten?.checklistePdf?.node?.mediaItemUrl;

  if (!pdfUrl) {
    return NextResponse.json({ error: "PDF not found" }, { status: 404 });
  }

  try {
    const response = await fetch(pdfUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const { data, checkboxPositions } = await parsePDF(buffer);

    return NextResponse.json({ data, checkboxPositions, pdfUrl });
  } catch (error) {
    console.error(`Error parsing checkliste "${slug}":`, error);
    return NextResponse.json({ error: "Parse error" }, { status: 500 });
  }
}
