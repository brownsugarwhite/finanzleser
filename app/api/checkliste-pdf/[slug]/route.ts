import { NextRequest, NextResponse } from "next/server";
import { getChecklisteBySlug } from "@/lib/wordpress";
import { cacheHeaders } from "@/lib/httpCache";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const checkliste = await getChecklisteBySlug(slug);
  const pdfUrl = checkliste?.pdfUrl;

  if (!pdfUrl) {
    return NextResponse.json({ error: "PDF not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  const response = await fetch(pdfUrl);
  const pdfBuffer = await response.arrayBuffer();

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Checkliste_${slug}.pdf"`,
      ...cacheHeaders(86400, 86400),
    },
  });
}
