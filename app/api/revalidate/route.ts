import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Nach dem Invalidieren die betroffenen Seiten EINMAL server-seitig neu holen →
// sie sind warm (regeneriert + gecacht), bevor ein echter Besucher kommt. Sonst
// träfe der erste Besucher nach jeder Änderung eine Kaltgenerierung (2–9 s via WP).
async function rewarm(base: string, paths: string[]): Promise<void> {
  const unique = [...new Set(paths.filter((p) => p.startsWith("/") && !p.includes(" ")))];
  await Promise.allSettled(
    unique.map((p) => {
      // 7s-Cap je Seite (Fetches laufen parallel → Gesamt ≈ langsamste Seite),
      // damit der Webhook sicher unter dem Netlify-Function-Limit bleibt. Nicht
      // rechtzeitig gewärmte Seiten wärmen beim nächsten Besuch (wie bisher).
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 7000);
      return fetch(base + p, { cache: "no-store", signal: ctrl.signal })
        .catch(() => {})
        .finally(() => clearTimeout(t));
    })
  );
}

/**
 * On-Demand Revalidation
 * Wird vom WP-mu-plugin `finanzleser-headless` bei save_post / delete_post /
 * transition_post_status aufgerufen. Bustet den ISR-Cache der betroffenen
 * URL — Änderungen erscheinen innerhalb von Sekunden auf dem Frontend.
 */
export async function POST(request: NextRequest) {
  if (!process.env.WP_REVALIDATE_SECRET) {
    return NextResponse.json(
      { error: "WP_REVALIDATE_SECRET not configured" },
      { status: 500 }
    );
  }

  let body: { secret?: string; path?: string; type?: string; slug?: string; status?: string; layout?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.secret !== process.env.WP_REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const revalidated: string[] = [];

  // Layout-Bust (für globale Layout-Elemente wie TopBanner) — bustet ALLE Pages
  if (body.layout) {
    revalidatePath("/", "layout");
    revalidated.push("/ (layout: alle Pages)");
    // Layout-Bust trifft alle Seiten — nur die Startseite re-warmen (Rest wärmt beim
    // nächsten Besuch/eigenen Webhook; alles zu warmen wäre zu teuer).
    await rewarm(base, ["/"]);
    return NextResponse.json({
      ok: true,
      revalidated,
      type: body.type,
      slug: body.slug,
      timestamp: Date.now(),
    });
  }

  // Hauptpfad
  if (body.path && body.path.startsWith("/")) {
    revalidatePath(body.path);
    revalidated.push(body.path);
  }

  // Eltern-Listen mit revalidieren (Kategorie-Listen, Tool-Übersichten)
  if (body.type === "post" && body.path) {
    // Sub-Kategorie-Listing: alles außer dem letzten Slash-Segment
    const parts = body.path.split("/").filter(Boolean);
    if (parts.length >= 2) {
      const cat = "/" + parts.slice(0, -1).join("/");
      revalidatePath(cat);
      revalidated.push(cat);
    }
    if (parts.length >= 1) {
      const main = "/" + parts[0];
      revalidatePath(main);
      revalidated.push(main);
    }
  }
  if (body.type === "rechner") {
    revalidatePath("/finanztools/rechner");
    revalidatePath("/finanztools");
    revalidatePath("/");
    revalidated.push("/finanztools/rechner", "/finanztools", "/");
  }
  if (body.type === "vergleich") {
    revalidatePath("/finanztools/vergleiche");
    revalidatePath("/finanztools");
    revalidated.push("/finanztools/vergleiche", "/finanztools");
  }
  if (body.type === "checkliste") {
    revalidatePath("/finanztools/checklisten");
    revalidatePath("/finanztools");
    revalidated.push("/finanztools/checklisten", "/finanztools");
  }

  // Sitemap immer mit revalidieren
  revalidatePath("/sitemap.xml");
  revalidated.push("/sitemap.xml");

  // Betroffene Seiten sofort wieder warmlaufen lassen (kein Kaltstart für den ersten Besucher).
  await rewarm(base, revalidated);

  return NextResponse.json({
    ok: true,
    revalidated,
    type: body.type,
    slug: body.slug,
    timestamp: Date.now(),
  });
}
