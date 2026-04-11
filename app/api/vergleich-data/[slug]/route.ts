import { NextResponse } from "next/server";

// Vergleich-Daten: iFrame-URLs und Script-Configs
// Bis ACF die Felder über REST/GraphQL exponiert, direkte Lookup-Map
const VERGLEICH_DATA: Record<string, { iframeUrl?: string; scriptConfig?: Record<string, string> }> = {
  "private-haftpflichtversicherung-vergleich": {
    iframeUrl: "https://tools.financeads.net/privathaftpflichtrechner.php?tp=dif&wf=24770&ntpl=responsive&h=1",
  },
  "festgeldvergleich": {
    iframeUrl: "https://tools.financeads.net/festgeldrechner.php?tp=dif&wf=24770&ntpl=responsive&h=1",
  },
  "tagesgeldvergleich": {
    iframeUrl: "https://tools.financeads.net/tagesgeldrechner.php?tp=dif&wf=24770&ntpl=responsive&h=1",
  },
  "autokredit-vergleich": {
    iframeUrl: "https://tools.financeads.net/autokreditrechner.php?tp=dif&wf=24770&ntpl=responsive&h=1",
  },
  "ratenkredit-vergleich": {
    iframeUrl: "https://tools.financeads.net/ratenkreditrechner.php?tp=dif&wf=24770&ntpl=responsive&h=1",
  },
  "bausparen-vergleich": {
    iframeUrl: "https://tools.financeads.net/bausparrechner.php?tp=dif&wf=24770&ntpl=responsive&h=1",
  },
  "baufinanzierung-vergleich": {
    iframeUrl: "https://tools.financeads.net/baufinanzierungrechner.php?tp=dif&wf=24770&ntpl=responsive&h=1",
  },
  "private-krankenversicherung-vergleich": {
    iframeUrl: "https://form.partner-versicherung.de/form.php?aid=1226&cid=1&partner_id=46986&insurance_id=1&scrollto=page&module=formv4",
  },
  "gaspreisvergleich": {
    iframeUrl: "https://koop.energie.check24.de/129535/default/gas/?tracking_id2=264&considerdeposit=no&considerdiscounts=yes&paymentperiod=month&priceguarantee=yes&guidelinematch=yes&packages=no&eco=no&mode=normal&deviceoutput=desktop",
  },
  "strompreisvergleich": {
    iframeUrl: "https://koop.energie.check24.de/129535/default/strom/?tracking_id2=264&considerdeposit=no&considerdiscounts=yes&paymentperiod=month&priceguarantee=yes&guidelinematch=yes&packages=no&eco=no&mode=normal&deviceoutput=desktop",
  },
  "risikolebensversicherung-vergleich": {
    scriptConfig: {
      slotId: "1721399007",
      siteKey: "httpswwwfinanzleserde",
      designId: "11912",
      productId: "38",
      scriptSrc: "https://vue-singlepage.am.fgrp.net/de/fdeam.nocache.module.js",
    },
  },
  "reisekrankenversicherung-vergleich": {
    iframeUrl: "https://tools.financeads.net/auslandskrankenrechner.php?tp=dif&wf=24770&ntpl=responsive&h=1",
  },
  "fahrradversicherung-vergleich": {
    iframeUrl: "https://rechner.covomo.de/bike?theme=covomo&r=eyJhZmZpbGlhdGVfaWQiOiI1MDAwMDA3MjkxIiwiYSI6IjUwMDAwMDcyOTEifQ%3D%3D&vehicle_type=11870&type_of_use=11875",
  },
  "haus-und-grundbesitzerhaftpflicht-vergleich": {
    iframeUrl: "https://www.mr-money.de/cookievgl.php?sp=hug&id=00204203",
  },
  "unfallversicherung-vergleich": {
    iframeUrl: "https://www.mr-money.de/cookievgl.php?sp=unf&id=00204203",
  },
  "gebaeudeversicherung-vergleich": {
    iframeUrl: "https://www.mr-money.de/cookievgl.php?sp=wg&id=00204203",
  },
  "rechtsschutzversicherung-vergleich": {
    iframeUrl: "https://tools.financeads.net/rechtsschutzrechner.php?tp=dif&wf=24770&ntpl=responsive&h=1",
  },
  "hausratversicherung-vergleich": {
    iframeUrl: "https://tools.financeads.net/hausratrechner.php?tp=dif&wf=24770&ntpl=responsive&h=1",
  },
  "kfz-versicherung-vergleich": {
    iframeUrl: "https://kfz.check24.de/auto/rechner/web/rechner?appSettings=44b37067-61a3-408f-946c-72505fc56de4",
  },
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const data = VERGLEICH_DATA[slug];
  if (!data) {
    return NextResponse.json({ error: "Vergleich nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json({
    title: slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    iframeUrl: data.iframeUrl || "",
    scriptConfig: data.scriptConfig || null,
  });
}
