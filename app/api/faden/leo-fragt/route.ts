import { NextResponse } from "next/server";
import { getFadenOptionen, type FadenZiel, type LeoFragtEintrag } from "@/lib/faden/optionen";
import { getBeitragsIndex } from "@/lib/faden/titel";
import { buildRechnerUrl, buildVergleichUrl, buildChecklisteUrl, buildDokumentUrl, buildGlossarUrl } from "@/lib/urls";
import { cacheHeaders } from "@/lib/httpCache";

export const revalidate = 86400;

/**
 * „Leo fragt“ aus dem CMS (Optionen des mu-plugins finanzleser-faden): die Liste der
 * Fragen, jedes Ziel um seine Adresse im Frontend ergänzt (lib/urls.ts; Beiträge über
 * den gecachten Beitragsindex). ISR-gecacht, der Client holt sie einmal je Sitzung.
 * Ziele ohne Adresse im Faden (keins, kassensturz, whatsapp, wochenbrief) bleiben ohne href.
 */
export async function GET() {
  try {
    const { leoFragt } = await getFadenOptionen();
    const brauchtBeitraege = leoFragt.some((f) => f.ziel?.typ === "post" || f.chips?.some((c) => c.ziel?.typ === "post"));
    const beitraege = brauchtBeitraege ? await getBeitragsIndex() : null;
    const mitHref = (z?: FadenZiel): FadenZiel | undefined => {
      if (!z) return undefined;
      const slug = z.slug || "";
      let href: string | undefined;
      if (!slug) href = undefined;
      else if (z.typ === "rechner") href = buildRechnerUrl(slug);
      else if (z.typ === "vergleich") href = buildVergleichUrl(slug);
      else if (z.typ === "checkliste") href = buildChecklisteUrl(slug);
      else if (z.typ === "dokumente" || z.typ === "dokument") href = buildDokumentUrl(slug);
      else if (z.typ === "glossar" || z.typ === "begriff") href = buildGlossarUrl(slug);
      else if (z.typ === "post") href = beitraege?.get(slug)?.href;
      return href ? { ...z, href } : z;
    };
    const fragen: LeoFragtEintrag[] = leoFragt.map((f) => ({
      ...f,
      ziel: mitHref(f.ziel),
      chips: f.chips?.map((c) => ({ ...c, ziel: mitHref(c.ziel) })),
    }));
    return NextResponse.json({ fragen, total: fragen.length }, { headers: cacheHeaders(86400, 86400) });
  } catch (error) {
    console.error("[api/faden/leo-fragt]", error);
    return NextResponse.json({ error: "Failed to load Leo fragt" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
