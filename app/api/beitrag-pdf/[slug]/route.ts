import { NextResponse } from "next/server";
import { cacheHeaders } from "@/lib/httpCache";

const WP_URL = (process.env.WORDPRESS_API_URL || "http://finanzleser.local/graphql").replace("/graphql", "");

// PdfPreview feuert auf JEDER Artikelseite — auch die „kein PDF"-Antwort muss
// aggressiv cachen, sonst ist jeder Artikel-View eine Function-Invocation.
export const revalidate = 86400;
const PDF_HEADERS = cacheHeaders(86400, 86400, 604800);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    // Get post by slug with ACF fields
    const res = await fetch(
      `${WP_URL}/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&_fields=id,acf`,
      { next: { revalidate: 3600 } }
    );
    const posts = await res.json();
    if (!posts.length || !posts[0].acf?.beitrag_pdf) {
      return NextResponse.json({ pdfUrl: null }, { headers: PDF_HEADERS });
    }

    const attachmentId = posts[0].acf.beitrag_pdf;

    // Get attachment URL
    const attachRes = await fetch(
      `${WP_URL}/wp-json/wp/v2/media/${attachmentId}?_fields=source_url,title,mime_type`,
      { next: { revalidate: 3600 } }
    );
    const attachment = await attachRes.json();

    return NextResponse.json({
      pdfUrl: attachment.source_url || null,
      pdfTitle: attachment.title?.rendered || null,
    }, { headers: PDF_HEADERS });
  } catch {
    // Transienter WP-Fehler → nicht cachen, sonst hängt „kein PDF" 24h fest.
    return NextResponse.json({ pdfUrl: null }, { headers: { "Cache-Control": "no-store" } });
  }
}
