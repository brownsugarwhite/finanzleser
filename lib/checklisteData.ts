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
 * Bewusst kein Cache (Freshness — vgl. getChecklisteBySlug → getClient(0)).
 */
export async function loadChecklisteData(slug: string): Promise<ChecklisteInlineData | null> {
  const checkliste = await getChecklisteBySlug(slug);
  const pdfUrl = checkliste?.checklisten?.checklistePdf?.node?.mediaItemUrl;
  if (!pdfUrl) return null;

  const response = await fetch(pdfUrl);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const { data, checkboxPositions } = await parsePDF(buffer);
  return { data, checkboxPositions, pdfUrl };
}
