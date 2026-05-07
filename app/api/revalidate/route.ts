import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

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

  const revalidated: string[] = [];

  // Layout-Bust (für globale Layout-Elemente wie TopBanner) — bustet ALLE Pages
  if (body.layout) {
    revalidatePath("/", "layout");
    revalidated.push("/ (layout: alle Pages)");
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

  return NextResponse.json({
    ok: true,
    revalidated,
    type: body.type,
    slug: body.slug,
    timestamp: Date.now(),
  });
}
