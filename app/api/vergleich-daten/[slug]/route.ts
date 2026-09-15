import { NextRequest, NextResponse } from "next/server";
import { cacheHeaders } from "@/lib/httpCache";
import { holeVergleich } from "@/lib/financeads/holeVergleich";
import { defLite } from "@/lib/financeads/registry";
import { apiParams, wirksameParams } from "@/lib/financeads/quelle";
import { fetchVergleich } from "@/lib/financeads/client";
import { normalisiereVariante, paramSchluessel } from "@/lib/financeads/normalisieren";
import { formatKennwert } from "@/lib/financeads/format";

/**
 * Daten eines Vergleichs für den Client.
 *
 *   GET /api/vergleich-daten/<slug>?average_balance=7000&months=12
 *       → { variante } — aus dem Snapshot, wenn die Kombination vorliegt; sonst live von
 *         financeads (1–8 s, deshalb am CDN 6 h gehalten, Netlify-Vary auf die Query).
 *         Parameter laufen durch die Registry-Allowlist und werden auf Schema geklemmt —
 *         eine unbekannte oder feste Größe wird still auf den Standard gesetzt.
 *   GET /api/vergleich-daten/<slug>?kurz=1
 *       → { slug, titel, produkte: Top 3 der Voreinstellung, stand, href } für Leos Karte.
 *
 * 🚨 Der Live-Abruf ist die einzige Stelle, an der eine Netlify-Function auf financeads
 * wartet. Timeout 9 s wegen des 10-s-Function-Limits; Girokonto braucht 8–11 s — dort
 * greift der Skeleton mit Meldung, die Presets kommen aus dem Snapshot.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 26;

const KEIN_CACHE = { "Cache-Control": "no-store" };

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const v = await holeVergleich(slug);
  if (!v || v.art !== "financeads") {
    return NextResponse.json({ error: "kein financeads-Vergleich" }, { status: 404, headers: KEIN_CACHE });
  }
  const q = request.nextUrl.searchParams;
  const kopf = { ...cacheHeaders(300, 21600), "Netlify-Vary": "query" };

  if (q.get("kurz") === "1") {
    const standard = v.daten?.varianten[0];
    const def = defLite(v.def);
    const haupt = def.spalten.find((s) => s.key === def.bestwert?.key) || def.spalten[def.spalten.length - 1];
    return NextResponse.json({
      slug, titel: def.titel, klasse: def.klasse, anzahl: v.daten?.anzahl || 0, stand: v.daten?.stand || null,
      href: `/finanztools/vergleiche/${slug}`,
      hauptLabel: def.totalLabel || haupt?.label || "",
      produkte: (standard?.produkte || []).slice(0, 3).map((p) => ({ id: p.id, anbieter: p.anbieter, tarif: p.tarif, wert: haupt ? formatKennwert(haupt, p.kennzahlen[haupt.key]) : "", best: p.id === standard?.bestwert })),
      grund: standard?.bestwertGrund || null,
    }, { headers: kopf });
  }

  const eingabe: Record<string, string> = {};
  for (const [k, w] of q.entries()) if (k !== "kurz") eingabe[k] = w;
  const wirksam = wirksameParams(v.def, v.quelle, eingabe);
  const schluessel = paramSchluessel(Object.fromEntries(Object.entries(wirksam).map(([k, w]) => [k, String(w)])));
  const imSnapshot = v.daten?.varianten.find((x) => x.schluessel === schluessel);
  if (imSnapshot) return NextResponse.json({ variante: imSnapshot, quelle: "snapshot" }, { headers: kopf });
  if (v.def.defekt) return NextResponse.json({ error: "Endpunkt defekt" }, { status: 503, headers: KEIN_CACHE });

  try {
    const antwort = await fetchVergleich(v.def.version, v.def.kategorie, apiParams(v.def, wirksam), { timeoutMs: 9000, versuche: 1 });
    const variante = normalisiereVariante(v.def, wirksam, antwort, v.quelle.limit);
    return NextResponse.json({ variante, quelle: "live" }, { headers: kopf });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "financeads nicht erreichbar" }, { status: 503, headers: KEIN_CACHE });
  }
}
