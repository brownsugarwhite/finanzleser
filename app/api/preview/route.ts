import { NextRequest, NextResponse } from "next/server";
import { draftMode } from "next/headers";

export const dynamic = "force-dynamic";

/**
 * Headless-Preview-Endpoint
 * Wird vom WP-mu-plugin `finanzleser-headless` aufgerufen, wenn der Editor
 * im WP-Admin auf "Vorschau" klickt. Setzt den Next.js Draft-Mode und
 * leitet auf die Frontend-Seite weiter.
 *
 * Hinweis: Echte Draft-Inhalte werden erst angezeigt, wenn lib/wordpress.ts
 * draftMode() respektiert + GraphQL mit Auth fetcht. Phase 1 zeigt erstmal
 * die published Version unter der korrekten Frontend-URL — Editor sieht
 * sofort sein "echtes" Layout statt das nackte WP-Theme.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const redirectPath = searchParams.get("redirect") || "/";

  if (!process.env.WP_PREVIEW_SECRET) {
    return NextResponse.json(
      { error: "WP_PREVIEW_SECRET not configured" },
      { status: 500 }
    );
  }
  if (secret !== process.env.WP_PREVIEW_SECRET) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // Sanity: redirect-Pfad muss relativ sein (kein Open-Redirect)
  if (!redirectPath.startsWith("/")) {
    return NextResponse.json({ error: "Invalid redirect path" }, { status: 400 });
  }

  (await draftMode()).enable();

  // 307 damit Browser den Cookie behält
  const target = new URL(redirectPath, request.url);
  return NextResponse.redirect(target, 307);
}
