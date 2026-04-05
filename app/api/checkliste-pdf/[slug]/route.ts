import { NextRequest, NextResponse } from "next/server";
import { getChecklisteBySlug } from "@/lib/wordpress";

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

  const response = await fetch(pdfUrl);
  const pdfBuffer = await response.arrayBuffer();

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Checkliste_${slug}.pdf"`,
    },
  });
}
