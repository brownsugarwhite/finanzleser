/**
 * Ablesepunkt des temporären WP-Abfrage-Zählers (M7-Abnahme).
 *
 * Nur mit `FADEN_DEBUG=1` liefert er Zahlen, sonst 404 — die Route soll in
 * einer normalen Umgebung nicht existieren.
 *
 *   curl -s "localhost:3000/api/faden/wp-zaehler?reset=1" >/dev/null
 *   curl -s "localhost:3000/beitrag" >/dev/null
 *   curl -s "localhost:3000/api/faden/wp-zaehler"   → { seite: N }
 */
import { NextResponse } from "next/server";
import { wpZaehlerLesen } from "@/lib/faden/wpZaehler";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse> {
  const reset = new URL(request.url).searchParams.get("reset") === "1";
  const stand = wpZaehlerLesen(reset);
  if (!stand.aktiv) return new NextResponse("Not found", { status: 404 });
  return NextResponse.json(stand);
}
