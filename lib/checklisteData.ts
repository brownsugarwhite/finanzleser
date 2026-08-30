import "server-only";
import { getChecklisteBySlug, CONTENT_REVALIDATE } from "@/lib/wordpress";
import { parsePDF, type CheckboxPosition } from "@/lib/checklisteParser";
import type { ChecklisteData } from "@/components/checkliste/types";

export interface ChecklisteInlineData {
  data: ChecklisteData;
  checkboxPositions: CheckboxPosition[];
  pdfUrl: string;
}

/**
 * Lädt + parst die Checklisten-PDF serverseitig. Wird sowohl vom API-Endpoint
 * (Client-Fallback) als auch vom serverseitigen Artikel-Prefetch genutzt, damit
 * die Checkliste ohne Client-Roundtrip sofort gerendert werden kann.
 * Cache via ISR + On-Demand-Revalidate — ein ungecachtes fetch() wäre in Next 15
 * `no-store` und würde JEDEN Artikel mit Checkliste dynamisch machen (kein SSG).
 * CONTENT_REVALIDATE (nicht 3600), sonst zieht dieser Fetch das Segment-Intervall der
 * 207 Checklisten-Routen nach unten — Next nimmt das Minimum aus Segment und Fetches.
 */
export async function loadChecklisteData(slug: string): Promise<ChecklisteInlineData | null> {
  const checkliste = await getChecklisteBySlug(slug);
  const pdfUrl = checkliste?.checklisten?.checklistePdf?.node?.mediaItemUrl;
  if (!pdfUrl) return null;

  const response = await fetch(pdfUrl, { next: { revalidate: CONTENT_REVALIDATE } });
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const { data, checkboxPositions } = await parsePDF(buffer);
  return { data, checkboxPositions, pdfUrl };
}
