import { NextRequest, NextResponse } from "next/server";
import { getDokumentBySlug } from "@/lib/wordpress";
import { cacheHeaders } from "@/lib/httpCache";

export const revalidate = 86400;

// Same-Origin-Proxy fuer die PDF-Vorschau (components/dokument/DokumentPreview.tsx).
// KEIN Redirect auf die WP-Media-URL: pdf.js laedt hier mit Range-Requests, und die
// Uploads auf dem WP liefern keine CORS-Header — ein Cross-Origin-Redirect wuerde die
// Vorschau brechen. Die Bytes muessen also durch die Function; die Kosten holt statt-
// dessen der Durable Cache raus (vorher fehlte Netlify-CDN-Cache-Control komplett,
// s-maxage allein cached nur pro Edge-Node = jeder neue Node eine Invocation).

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const dokument = await getDokumentBySlug(slug);
  const pdfUrl = dokument?.pdfFile?.mediaItemUrl;

  // Fehler NICHT cachen — sonst friert ein WP-Aussetzer die Vorschau fuer 24h ein.
  if (!pdfUrl) {
    return NextResponse.json({ error: "PDF not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  const response = await fetch(pdfUrl);
  if (!response.ok) {
    return NextResponse.json({ error: "PDF fetch failed" }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
  const pdfBuffer = await response.arrayBuffer();

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${slug}.pdf"`,
      ...cacheHeaders(86400, 86400),
    },
  });
}
