import { NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// Vergleich-Embed-Config
//
// Quelle der Wahrheit = das vergleich-CPT in WordPress: dort liegt die Config in
// einem Gutenberg-Block (finanzleser/vergleich-quelle), dessen save()-Markup ein
//   <div data-fl-vergleich-src data-config="<base64-JSON>"></div>
// in den post_content schreibt. So kann ein Redakteur einen Vergleich rein im
// Backend anlegen – er erscheint im Dropdown UND rendert, ohne Code-Commit.
//
// Fallback: die frühere hardcodierte Map, solange ein CPT noch keinen Config-Block
// trägt (kein Bruch während der Migration). Wird entfernt, sobald alle CPTs Config haben.
// ─────────────────────────────────────────────────────────────────────────────

type EmbedConfig = {
  embedType?: string;
  iframeUrl?: string;
  scriptConfig?: Record<string, string>;
  rawHtml?: string;
};

const VERGLEICH_DATA: Record<string, EmbedConfig> = {
  "private-haftpflichtversicherung-vergleich": { iframeUrl: "https://tools.financeads.net/privathaftpflichtrechner.php?tp=dif&wf=24770&ntpl=responsive&h=1" },
  "festgeldvergleich": { iframeUrl: "https://tools.financeads.net/festgeldrechner.php?tp=dif&wf=24770&ntpl=responsive&h=1" },
  "tagesgeldvergleich": { iframeUrl: "https://tools.financeads.net/tagesgeldrechner.php?tp=dif&wf=24770&ntpl=responsive&h=1" },
  "autokredit-vergleich": { iframeUrl: "https://tools.financeads.net/autokreditrechner.php?tp=dif&wf=24770&ntpl=responsive&h=1" },
  "ratenkredit-vergleich": { iframeUrl: "https://tools.financeads.net/ratenkreditrechner.php?tp=dif&wf=24770&ntpl=responsive&h=1" },
  "bausparen-vergleich": { iframeUrl: "https://tools.financeads.net/bausparrechner.php?tp=dif&wf=24770&ntpl=responsive&h=1" },
  "baufinanzierung-vergleich": { iframeUrl: "https://tools.financeads.net/baufinanzierungrechner.php?tp=dif&wf=24770&ntpl=responsive&h=1" },
  "private-krankenversicherung-vergleich": { iframeUrl: "https://form.partner-versicherung.de/form.php?aid=1226&cid=1&partner_id=46986&insurance_id=1&scrollto=page&module=formv4" },
  "gaspreisvergleich": { iframeUrl: "https://koop.energie.check24.de/129535/default/gas/?tracking_id2=264&considerdeposit=no&considerdiscounts=yes&paymentperiod=month&priceguarantee=yes&guidelinematch=yes&packages=no&eco=no&mode=normal&deviceoutput=desktop" },
  "strompreisvergleich": { iframeUrl: "https://koop.energie.check24.de/129535/default/strom/?tracking_id2=264&considerdeposit=no&considerdiscounts=yes&paymentperiod=month&priceguarantee=yes&guidelinematch=yes&packages=no&eco=no&mode=normal&deviceoutput=desktop" },
  "risikolebensversicherung-vergleich": { iframeUrl: "https://tools.financeads.net/risikolebensrechner.php?tp=dif&wf=24770&ntpl=responsive&h=1" },
  "reisekrankenversicherung-vergleich": { iframeUrl: "https://tools.financeads.net/auslandskrankenrechner.php?tp=dif&wf=24770&ntpl=responsive&h=1" },
  "fahrradversicherung-vergleich": { iframeUrl: "https://rechner.covomo.de/bike?theme=covomo&r=eyJhZmZpbGlhdGVfaWQiOiI1MDAwMDA3MjkxIiwiYSI6IjUwMDAwMDcyOTEifQ%3D%3D&vehicle_type=11870&type_of_use=11875" },
  "haus-und-grundbesitzerhaftpflicht-vergleich": { iframeUrl: "https://www.mr-money.de/cookievgl.php?sp=hug&id=00204203" },
  "unfallversicherung-vergleich": { iframeUrl: "https://www.mr-money.de/cookievgl.php?sp=unf&id=00204203" },
  "gebaeudeversicherung-vergleich": { iframeUrl: "https://www.mr-money.de/cookievgl.php?sp=wg&id=00204203" },
  "rechtsschutzversicherung-vergleich": { iframeUrl: "https://tools.financeads.net/rechtsschutzrechner.php?tp=dif&wf=24770&ntpl=responsive&h=1" },
  "hausratversicherung-vergleich": { iframeUrl: "https://tools.financeads.net/hausratrechner.php?tp=dif&wf=24770&ntpl=responsive&h=1" },
  "kfz-versicherung-vergleich": { iframeUrl: "https://kfz.check24.de/auto/rechner/web/rechner?appSettings=44b37067-61a3-408f-946c-72505fc56de4" },
  "rentenversicherung-vergleich": { iframeUrl: "https://form.partner-versicherung.de/383ebb4ad0b6436d692cfca05cef2c89/form.php?aid=1226&cid=2&partner_id=46986&insurance_id=2&scrollto=page&module=formv4" },
  "lebensversicherung-vergleich": { scriptConfig: { type: "finanzen-de", slotId: "1721399007", siteKey: "httpswwwfinanzleserde", designId: "11912", productId: "38", scriptSrc: "https://vue-singlepage.am.fgrp.net/de/fdeam.nocache.module.js" } },
  "photovoltaik-versicherung-vergleich": { iframeUrl: "https://rechner.covomo.de/photovoltaik?theme=covomo&r=eyJhZmZpbGlhdGVfaWQiOiI1MDAwMDA3MjkxIiwiYSI6IjUwMDAwMDcyOTEifQ%3D%3D" },
  "bussgeldrechner-vergleich": { scriptConfig: { type: "bussgeld", publisherId: "66dec4e85e311", scriptSrc: "https://widget.bussgeldrechner.org/3" } },
};

function titleFromSlug(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Liest die Embed-Config aus dem vergleich-CPT (Gutenberg-Block-Markup im content).
async function getConfigFromCpt(slug: string): Promise<{ config: EmbedConfig; title: string } | null> {
  const apiUrl = process.env.WORDPRESS_API_URL;
  if (!apiUrl) return null;
  const base = apiUrl.replace(/\/graphql\/?$/, "");

  try {
    const res = await fetch(
      `${base}/wp-json/wp/v2/vergleich?slug=${encodeURIComponent(slug)}&_fields=title,content`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const posts = await res.json();
    const post = Array.isArray(posts) ? posts[0] : null;
    if (!post) return null;

    const html: string = post.content?.rendered || "";
    const title: string = (post.title?.rendered || "").trim();

    // Der finanzleser/vergleich-quelle-Block rendert <div class="fl-vergleich-src" data-config="<b64>">
    const m = html.match(/data-config="([A-Za-z0-9+/=]+)"/);
    if (!m) return { config: {}, title };

    try {
      const json = Buffer.from(m[1], "base64").toString("utf-8");
      return { config: JSON.parse(json) as EmbedConfig, title };
    } catch {
      return { config: {}, title };
    }
  } catch {
    return null;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const fromCpt = await getConfigFromCpt(slug);
  const cptConfig = fromCpt?.config;
  const hasCptConfig =
    cptConfig && (cptConfig.iframeUrl || cptConfig.scriptConfig || cptConfig.rawHtml);

  const data: EmbedConfig | undefined = hasCptConfig ? cptConfig : VERGLEICH_DATA[slug];
  if (!data) {
    return NextResponse.json({ error: "Vergleich nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json({
    title: fromCpt?.title || titleFromSlug(slug),
    iframeUrl: data.iframeUrl || "",
    scriptConfig: data.scriptConfig || null,
    rawHtml: data.rawHtml || "",
  });
}
