import { NextRequest, NextResponse } from "next/server";
import { getDokumenteBySlugs } from "@/lib/wordpress";
import { stripHtml } from "@/lib/seo";

// Dokument-Kartendaten für den Dokumente-Block im Artikel (≤4). 1h Cache wie tool-title.
export const revalidate = 86400;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slugs: string }> }
) {
  const { slugs } = await params;
  const slugList = decodeURIComponent(slugs)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const dokumente = await getDokumenteBySlugs(slugList);

  const cards = dokumente.map((d) => ({
    slug: d.slug,
    title: d.title,
    beschreibung: stripHtml(d.excerpt),
    pdfUrl: d.pdfFile?.mediaItemUrl || "",
    fileName: d.pdfFile?.mediaDetails?.file?.split("/").pop(),
    fileSize: d.pdfFile?.fileSize,
    kategorie: d.dokumentKategorien?.nodes?.[0]?.name || "",
  }));

  return NextResponse.json({ dokumente: cards });
}
