import { NextRequest, NextResponse } from "next/server";
import { getDokumentBySlug } from "@/lib/wordpress";

export const revalidate = 3600;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const dokument = await getDokumentBySlug(slug);
  const pdfUrl = dokument?.pdfFile?.mediaItemUrl;

  if (!pdfUrl) {
    return NextResponse.json({ error: "PDF not found" }, { status: 404 });
  }

  const response = await fetch(pdfUrl);
  if (!response.ok) {
    return NextResponse.json({ error: "PDF fetch failed" }, { status: 502 });
  }
  const pdfBuffer = await response.arrayBuffer();

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${slug}.pdf"`,
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
