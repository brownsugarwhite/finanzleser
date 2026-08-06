// Alte Blog-Paginierung (/page/2 … /page/19) der Vorgänger-Seite: Inhalte existieren
// nicht mehr und haben keine Entsprechung → 410 Gone (deindexiert schneller als 404,
// GSC-Arbeitsliste 2026-08-06).
export const dynamic = "force-static";

export async function GET() {
  return new Response("Diese Seite existiert nicht mehr.", {
    status: 410,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export function generateStaticParams() {
  return Array.from({ length: 20 }, (_, i) => ({ n: String(i + 1) }));
}
