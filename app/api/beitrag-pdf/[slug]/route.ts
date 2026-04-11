import { NextResponse } from "next/server";

const WP_URL = (process.env.WORDPRESS_API_URL || "http://finanzleser.local/graphql").replace("/graphql", "");

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    // Get post by slug with ACF fields
    const res = await fetch(
      `${WP_URL}/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&_fields=id,acf`,
      { next: { revalidate: 60 } }
    );
    const posts = await res.json();
    if (!posts.length || !posts[0].acf?.beitrag_pdf) {
      return NextResponse.json({ pdfUrl: null });
    }

    const attachmentId = posts[0].acf.beitrag_pdf;

    // Get attachment URL
    const attachRes = await fetch(
      `${WP_URL}/wp-json/wp/v2/media/${attachmentId}?_fields=source_url,title,mime_type`,
      { next: { revalidate: 60 } }
    );
    const attachment = await attachRes.json();

    return NextResponse.json({
      pdfUrl: attachment.source_url || null,
      pdfTitle: attachment.title?.rendered || null,
    });
  } catch {
    return NextResponse.json({ pdfUrl: null });
  }
}
