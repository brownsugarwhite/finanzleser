#!/usr/bin/env node
/**
 * Abnahme des Kursblatt-Satzes gegen die Maße der Übergabe
 * (design_handoff_finanzleser_kursblatt/).
 *
 *   node tools/kursblatt-mess.mjs [--base http://localhost:3000]
 *
 * Braucht `NEXT_PUBLIC_KURSBLATT=1`; die alte Liste misst tools/vergleich-mess.mjs.
 *
 * Geprüft wird, was man ansehen kann und was man nicht sieht:
 *   1–5   SSR: der richtige Satz, eine h1, Lineal-Versatz im HTML, Insel-Schalter
 *   6–9   Kopf: Kicker, Titel, Vorspann mit lebenden Zahlen
 *  10–14  Ihre Angaben: Einhänger, pulsender Punkt, Bausteine je Parameter
 *  15–18  Bedienen: Marke setzt den Wert, ein Abruf, Hash, Daten passen zum Satz
 *  19–30  Marktüberblick: Band, Bestwert, Durchschnitt, Stapelung, Kennzahlen
 *  31–34  schmaler Satz und Konsole
 */
import { chromium } from "playwright";

const baseArg = process.argv.indexOf("--base");
const BASE = (baseArg > 0 ? process.argv[baseArg + 1] : "http://localhost:3000").replace(/\/$/, "");
const KREDIT = "/finanztools/vergleiche/autokredit-vergleich";
const FESTGELD = "/finanztools/vergleiche/festgeldvergleich";

const ergebnisse = [];
const ok = (n, gut, notiz = "") => { ergebnisse.push({ n, gut, notiz }); console.log(`${gut ? "✓" : "✗"} ${n}${notiz ? "  → " + notiz : ""}`); };

const html = await (await fetch(BASE + KREDIT)).text();
if (!/class="kb kb--vergleich"/.test(html)) {
  console.log("\n⏭  Übersprungen: die Seiten rendern noch die alte Liste. Mit NEXT_PUBLIC_KURSBLATT=1 starten.");
  process.exit(0);
}

ok("SSR: Kursblatt-Satz statt alter Liste", !/class="vgl vgl--faden/.test(html));
ok("SSR: genau eine h1", (html.match(/<h1/g) || []).length === 1, String((html.match(/<h1/g) || []).length));
ok("SSR: Lineal-Versatz im HTML (ohne JavaScript richtig gesetzt)", /--kb-x:\s*\d+px/.test(html), (html.match(/--kb-x:\s*\d+px/g) || []).join(" "));
ok("SSR: Insel trägt den Kursblatt-Schalter", /&quot;kursblatt&quot;:true/.test(html) || /"kursblatt":true/.test(html));
ok("SSR: Streuband und Kennzahlen im HTML", /kb-band__punkt/.test(html) && /kb-kennzahl__wert/.test(html));
ok("SSR: Kennzahlen zeigen Beträge, keine Null", !/kb-kennzahl__wert">0 €/.test(html), (html.match(/kb-kennzahl__wert">[^<]*/g) || []).slice(0, 3).join(" | "));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1200 }, locale: "de-DE" });
const page = await ctx.newPage();
const fehler = [];
page.on("console", (m) => { if (m.type() === "error") fehler.push(m.text()); });
page.on("response", (r) => { if (r.status() >= 500) fehler.push(`HTTP ${r.status()} ${r.url().replace(BASE, "")}`); });
const abrufe = [];
page.on("request", (r) => { if (r.url().includes("vergleich-daten")) abrufe.push(r.url()); });

await page.goto(BASE + KREDIT, { waitUntil: "networkidle" });
const nur = page.locator('button:has-text("Nur notwendig")');
if (await nur.count()) { await nur.first().click(); await page.waitForTimeout(300); }

// ── Kopf ──────────────────────────────────────────────────────────────────────────
const kopf = await page.evaluate(() => {
  const c = getComputedStyle(document.querySelector(".kb__anzeige"));
  return { farbe: c.color, stil: c.fontStyle, titel: document.querySelector(".kb__titel").textContent,
           gewicht: getComputedStyle(document.querySelector(".kb__titel")).fontWeight,
           vorspann: document.querySelector(".kb__vorspann").textContent,
           zahlFarbe: getComputedStyle(document.querySelector(".kb__vorspann b")).color };
});
ok("Kicker „Anzeige“ magenta und kursiv", kopf.farbe === "rgb(211, 0, 94)" && kopf.stil === "italic");
ok("H1 in 900", kopf.gewicht === "900", kopf.gewicht + " · " + kopf.titel);
ok("Vorspann nennt Anzahl, Bestwert und Stand", /\d+ \S+ im Vergleich/.test(kopf.vorspann) && /Bestwert/.test(kopf.vorspann) && /Stand/.test(kopf.vorspann), kopf.vorspann.slice(0, 80));
ok("Zahlen im Vorspann in Türkis", kopf.zahlFarbe === "rgb(11, 127, 102)", kopf.zahlFarbe);

// ── Ihre Angaben ──────────────────────────────────────────────────────────────────
const angaben = await page.evaluate(() => {
  const a = document.querySelector(".kb-angaben");
  return { rand: getComputedStyle(a).borderTopColor + " " + getComputedStyle(a).borderTopWidth,
           kicker: a.querySelector(".kb__kicker").textContent.trim(),
           puls: getComputedStyle(a.querySelector(".kb-angaben__sofort i")).animationName,
           lineale: a.querySelectorAll(".kb-lineal").length,
           breiten: [...a.querySelectorAll(".kb-lineal")].map((l) => Math.round(l.getBoundingClientRect().width)),
           striche: getComputedStyle(a.querySelector(".kb-lineal__striche")).backgroundSize };
});
ok("Einhänger 2 px türkis", angaben.rand === "rgb(11, 127, 102) 2px", angaben.rand);
ok("Kicker „Ihre Angaben“ mit pulsendem Punkt", angaben.kicker === "Ihre Angaben" && angaben.puls === "fl-punkt");
ok("Kredit: zwei Lineale über die volle Satzbreite", angaben.lineale === 2 && angaben.breiten.every((w) => w === 728), angaben.breiten.join("/"));
ok("Kreditsumme: Strichperioden 180/90/9 px wie K:380", angaben.striche.startsWith("180px 18px, 90px 12px, 9px 7px"), angaben.striche);

// ── Bedienen ──────────────────────────────────────────────────────────────────────
const vorAbrufe = abrufe.length;
await page.locator(".kb-lineal__marke").first().scrollIntoViewIfNeeded();
const wartet = page.waitForResponse((r) => r.url().includes("/api/vergleich-daten/"), { timeout: 20000 }).catch(() => null);
await page.locator(".kb-lineal__marke").nth(1).click();
await wartet;
await page.waitForTimeout(1500);
ok("Marke antippen löst höchstens einen Abruf aus", abrufe.length - vorAbrufe <= 1, `${abrufe.length - vorAbrufe}`);
ok("Hash trägt die Einstellung", (await page.evaluate(() => location.hash)).startsWith("#vgl:"), await page.evaluate(() => location.hash));
const passt = await page.evaluate(() => {
  const satz = document.querySelector(".kb__vorspann").textContent;
  return { zahl: Number((satz.match(/^(\d+)/) || [])[1]), zeilen: document.querySelectorAll(".nur-vorlesen tbody tr").length };
});
ok("Vorspann passt zu den geladenen Daten", passt.zahl > 0 && passt.zahl === passt.zeilen, `${passt.zahl} im Satz, ${passt.zeilen} in der Tabelle`);

// ── Marktüberblick ────────────────────────────────────────────────────────────────
await page.locator(".kb-band").scrollIntoViewIfNeeded();
await page.waitForTimeout(1600);
const band = await page.evaluate(() => {
  const b = document.querySelector(".kb-band");
  const g = (s) => getComputedStyle(b.querySelector(s));
  const punkte = [...b.querySelectorAll(".kb-band__punkt")];
  const best = b.querySelector('.kb-band__punkt[data-ist="an"]');
  const normal = punkte.find((x) => x.dataset.ist === "aus");
  return { hoehe: getComputedStyle(b).height, achse: g(".kb-band__achse").top,
           enden: [...b.querySelectorAll(".kb-band__ende")].map((e) => e.textContent).join("/"),
           punkte: punkte.length, zeilen: document.querySelectorAll(".nur-vorlesen tbody tr").length,
           best: best ? [getComputedStyle(best).width, getComputedStyle(best).backgroundColor, getComputedStyle(best).animationName].join(" ") : null,
           normal: getComputedStyle(normal).width,
           bestText: b.querySelector(".kb-band__best")?.textContent.trim(),
           faden: [g(".kb-band__faden").height, g(".kb-band__faden").backgroundColor].join(" "),
           schnitt: b.querySelector(".kb-band__schnitt-wert")?.textContent,
           etagen: [...new Set(punkte.map((x) => x.style.top))].length,
           kennzahlen: [...document.querySelectorAll(".kb-kennzahl")].map((k) => [k.querySelector(".kb-kennzahl__label").textContent, k.querySelector(".kb-kennzahl__wert").textContent.trim()]),
           kennCols: getComputedStyle(document.querySelector(".kb-kennzahlen")).gridTemplateColumns.split(" ").length,
           grossFarbe: getComputedStyle(document.querySelector('.kb-kennzahl[data-gross="an"] .kb-kennzahl__wert')).color };
});
ok("Band 172 px hoch, Achse bei 112", band.hoehe === "172px" && band.achse === "112px", band.hoehe + " / " + band.achse);
ok("Enden „günstig/teuer“ (weniger Zins ist besser)", band.enden === "günstig/teuer", band.enden);
ok("ein Punkt je Angebot", band.punkte === band.zeilen && band.punkte > 5, `${band.punkte} Punkte, ${band.zeilen} Angebote`);
ok("Bestwert 14 px, türkis, pulst", band.best === "14px rgb(11, 127, 102) fl-puls", String(band.best));
ok("übrige Punkte 10 px", band.normal === "10px", band.normal);
ok("Bestwert-Beschriftung mit Anbieter", /^Bestwert .+ · .+/.test(band.bestText || ""), band.bestText);
ok("Faden 68 px türkis zur Beschriftung", band.faden === "68px rgb(11, 127, 102)", band.faden);
ok("Durchschnitt als Ø beschriftet, ohne „ab“", /^Ø /.test(band.schnitt || "") && !/ab/.test(band.schnitt || ""), band.schnitt);
ok("gleiche Werte stapeln sich", band.etagen > 1, `${band.etagen} Etagen`);
ok("drei Kennzahlen mit Beträgen", band.kennzahlen.length === 3 && band.kennzahlen.every(([, w]) => /\d/.test(w)), band.kennzahlen.map((x) => x[1]).join(" · "));
ok("Kennzahlen 1fr 1fr 1.6fr, die große in Grün", band.kennCols === 3 && band.grossFarbe === "rgb(69, 161, 23)");

const punkt = page.locator('.kb-band__punkt[data-ist="aus"]').nth(2);
await punkt.hover();
await page.waitForTimeout(400);
const tip = await page.evaluate(() => { const t = document.querySelector(".kb-band__tip"); return { text: t.textContent, op: getComputedStyle(t).opacity, hell: document.querySelector('.kb-band__punkt[data-hell="an"]') ? getComputedStyle(document.querySelector('.kb-band__punkt[data-hell="an"]')).width : null }; });
ok("Punkt zeigt Anbieter und zwei Zahlen", tip.op === "1" && tip.text.split("·").length >= 2, tip.text);
ok("Punkt wächst beim Überfahren auf 16 px", tip.hell === "16px", String(tip.hell));

// ── Festgeld: andere Bausteine, Zinskurve statt Streuband ─────────────────────────
await page.goto(BASE + FESTGELD, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
const fg = await page.evaluate(() => {
  const a = document.querySelector(".kb-angaben");
  const k = document.querySelector(".kb-kurve");
  return { lineale: a.querySelectorAll(".kb-lineal").length, setz: a.querySelectorAll(".kb-setzzeile").length,
           reg: a.querySelectorAll(".kb-register").length,
           band: document.querySelectorAll(".kb-band").length,
           viewBox: k?.querySelector("svg")?.getAttribute("viewBox"),
           punkte: k ? k.querySelectorAll(".kb-kurve__punkt").length : 0,
           aktiv: k ? k.querySelectorAll('.kb-kurve__punkt[data-ist="an"]').length : 0,
           gross: document.querySelector(".kb-podest__zins")?.textContent,
           grossLabel: document.querySelector(".kb-podest__zins-label")?.textContent,
           plaetze: document.querySelectorAll(".kb-platz").length,
           satz: document.querySelector(".kb-markt h2").textContent.replace(/\s+/g, " ").trim() };
});
ok("Festgeld: Setzzeile und Register statt Lineal (F:63-64)", fg.lineale === 0 && fg.setz === 1 && fg.reg >= 1, `${fg.lineale} Lineale, ${fg.setz} Setzzeilen, ${fg.reg} Register`);
ok("Festgeld: Zinskurve 640×210 statt Streuband (F:75)", fg.band === 0 && fg.viewBox === "0 0 640 210", `${fg.band} Bänder, viewBox ${fg.viewBox}`);
ok("ein Punkt je Laufzeit, genau einer gewählt", fg.punkte >= 3 && fg.aktiv === 1, `${fg.punkte} Punkte, ${fg.aktiv} gewählt`);
ok("Überschrift fragt nach der Bindung (F:71)", /^Lohnt sich länger binden\?/.test(fg.satz), fg.satz.slice(0, 60));
ok("Gewinner: groß der Zins, nur ein Platz (F:118, F:105)", /^\d+,\d+ %$/.test(fg.gross || "") && /p\. a\./.test(fg.grossLabel || "") && fg.plaetze === 0, `${fg.gross} ${fg.grossLabel} · ${fg.plaetze} weitere`);

// Ein freier Betrag geht an die Datenroute; die Laufzeit danach ebenso. Währenddessen
// muss der letzte Stand stehen bleiben — nicht die Voreinstellung des Schnappschusses.
const feld = page.locator(".kb-setzzeile input").first();
await feld.click(); await feld.fill("23.500");
await Promise.all([page.waitForResponse((r) => r.url().includes("/api/vergleich-daten/") && r.status() === 200, { timeout: 30000 }), feld.press("Enter")]);
await page.waitForTimeout(900);
/**
 * Zeuge ist der Zinsertrag des Gewinners: er hängt an `aktuelle`, springt (statt wie ein
 * Zählwerk hochzuzählen) und unterscheidet alle drei Zustände — 23.500 € über 1 Jahr,
 * 23.500 € über 5 Jahre und die Voreinstellung 20.000 € über 1 Jahr.
 * Die Anzahl der Angebote taugt NICHT: sie ist bei 20.000 € und 23.500 € zufällig gleich.
 */
const gesamt = () => document.querySelector(".kb-podest__raster .kb__punktzeile-v").textContent.replace(/\D+/g, "");
const vorKlick = await page.evaluate(gesamt);
const zwischen = [];
const sammeln = setInterval(async () => {
  try { zwischen.push(await page.evaluate(gesamt)); } catch { /* Seite lädt */ }
}, 100);
await Promise.all([
  page.waitForResponse((r) => r.url().includes("/api/vergleich-daten/") && r.status() === 200, { timeout: 30000 }),
  page.locator('.kb-kurve__punkt[data-ist="aus"]').last().click(),
]);
clearInterval(sammeln);
await page.waitForTimeout(1000);
const nachKlick = await page.evaluate(() => ({
  gesamt: document.querySelector(".kb-podest__raster .kb__punktzeile-v").textContent.replace(/\D+/g, ""),
  betrag: document.querySelector(".kb-setzzeile input").value,
}));
ok("freier Betrag überlebt den Laufzeitwechsel", /23\.?500/.test(nachKlick.betrag), nachKlick.betrag);
ok("beim Nachladen bleibt der letzte Stand stehen, nicht die Voreinstellung",
  zwischen.length > 0 && zwischen.every((w) => w === vorKlick || w === nachKlick.gesamt),
  `${vorKlick} → ${[...new Set(zwischen)].join(" / ")} → ${nachKlick.gesamt} (${zwischen.length} Messungen)`);

// ── schmaler Satz ─────────────────────────────────────────────────────────────────
await page.setViewportSize({ width: 390, height: 1200 });
await page.waitForTimeout(700);
const eng = await page.evaluate(() => ({
  ueberlauf: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  kennCols: getComputedStyle(document.querySelector(".kb-kennzahlen")).gridTemplateColumns.split(" ").length,
  grossStart: getComputedStyle(document.querySelector('.kb-kennzahl[data-gross="an"]')).gridColumnStart,
  // Auf der Festgeldseite steht die Kurve; ihre Achsenbeschriftung ist der Kandidat, der
  // aus dem Satz laufen könnte (die Bestwert-Beschriftung des Bands prüft die Kreditseite).
  achseRechts: Math.round(Math.max(...[...document.querySelectorAll(".kb-kurve__achse")].map((e) => e.getBoundingClientRect().right))),
  achseKurz: [...document.querySelectorAll(".kb-kurve__achse")].every((e) => /\d (M|J)\.$/.test(e.textContent)),
}));
ok("390 px ohne waagerechten Überlauf", eng.ueberlauf === 0, `${eng.ueberlauf} px`);
ok("390 px: Kennzahlen zweispaltig, die große über beide", eng.kennCols === 2 && eng.grossStart === "1");
ok("390 px: Achsenbeschriftung kurz und im Satz (F:239)", eng.achseKurz && eng.achseRechts <= 390, `rechte Kante ${eng.achseRechts}`);
ok("keine Konsolenfehler", fehler.length === 0, fehler.slice(0, 2).join(" | "));

await browser.close();
const schlecht = ergebnisse.filter((e) => !e.gut);
console.log(`\n${ergebnisse.length - schlecht.length} von ${ergebnisse.length} Prüfungen bestanden.`);
process.exit(schlecht.length ? 1 : 0);
