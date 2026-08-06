// 410-Ziel für endgültig entfernte Alt-Inhalte (per rewrites() in next.config.ts
// zugeordnet — die URL bleibt dabei erhalten, nur der Status ist 410 Gone).
// 410 deindexiert bei Google schneller als 404 (GSC-Arbeitsliste 2026-08-06).
export const dynamic = "force-static";

export async function GET() {
  return new Response("Diese Seite existiert nicht mehr.", {
    status: 410,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
