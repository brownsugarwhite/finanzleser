import { NextRequest, NextResponse } from "next/server";
import { viewsAdd, searchentryCreate } from "@/lib/financeads/client";

/**
 * Sichtkontakt einer Vergleichsliste an financeads melden (views/add; bei geänderten
 * Parametern zusätzlich searchentry/create mit search_default=0). Kommt per sendBeacon
 * aus components/vergleich/sichtbeacon.ts. Antwortet immer 204 — eine verpasste Meldung
 * darf nie zum Fehler für den Leser werden. Keine Nutzerdaten, nur Produkt-IDs.
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { kennung?: unknown; ids?: unknown; standard?: unknown } = {};
  try { body = await request.json(); } catch { return new NextResponse(null, { status: 204 }); }
  const kennung = typeof body.kennung === "string" ? body.kennung.replace(/[^a-z0-9_]/gi, "").slice(0, 60) : "";
  const ids = Array.isArray(body.ids) ? body.ids.filter((x): x is number => Number.isInteger(x) && x > 0).slice(0, 40) : [];
  if (!kennung || !ids.length) return new NextResponse(null, { status: 204 });
  try {
    if (body.standard === false) await searchentryCreate(kennung, false);
    await viewsAdd(kennung, ids);
  } catch (e) {
    console.warn("[vergleich-sicht]", e instanceof Error ? e.message : e);
  }
  return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
