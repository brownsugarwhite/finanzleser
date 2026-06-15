import "server-only";
import { getChecklisteBySlug } from "@/lib/wordpress";
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
 * Cache via ISR (1h) + On-Demand-Revalidate — ein ungecachtes fetch() wäre in Next 15
 * `no-store` und würde JEDEN Artikel mit Checkliste dynamisch machen (kein SSG).
 */
export async function loadChecklisteData(slug: string): Promise<ChecklisteInlineData | null> {
  const checkliste = await getChecklisteBySlug(slug);
  const pdfUrl = checkliste?.checklisten?.checklistePdf?.node?.mediaItemUrl;
  if (!pdfUrl) return null;

  const response = await fetch(pdfUrl, { next: { revalidate: 3600 } });
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const { data, checkboxPositions } = await parsePDF(buffer);
  return { data, checkboxPositions, pdfUrl };
}
