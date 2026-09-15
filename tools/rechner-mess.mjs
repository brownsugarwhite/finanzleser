#!/usr/bin/env node
/**
 * Abnahme eines Rechners im Kursblatt-Satz gegen die Maße der Übergabe
 * (design_handoff_finanzleser_kursblatt/, Seite 2 und 4).
 *
 *   node tools/rechner-mess.mjs [--base http://localhost:3000] [--slug kredit]
 *
 * Braucht `NEXT_PUBLIC_KURSBLATT=1`. Zeigt die Seite noch den alten Satz, überspringt
 * sich die Sonde — genauso wie tools/vergleich-mess.mjs es umgekehrt tut.
 *
 * Zwei Gruppen:
 *   allgemein  — gilt für JEDEN migrierten Rechner und wächst mit den Tranchen mit:
 *                SSR mit geschlossenem Ergebnis, Bausteine je Feldart, „Leo rechnet mit“,
 *                Ausrechnen öffnet und scrollt, danach veraltet das Ergebnis, 390 px
 *   kredit     — die Zahlen und Mechaniken, die der Handoff namentlich nennt
 *                (05/06-kursblatt.jpg): 382 € · 2.921 € · 22.921 €, Drehring auf 6er,
 *                Zählwerk beim Halten, Scrubber, Jahresübersicht, Brücke, Aktenkoffer
 *
 * 🚨 Nur EIN Prozess zur Zeit gegen den Dev-Server (Memory `feedback_mess_disziplin_ionos`).
 */
import { chromium } from "playwright";
import { readdirSync } from "node:fs";

/** Alle migrierten Rechner — die Dateien sind die Wahrheit, nicht eine zweite Liste. */
const ALLE = readdirSync(new URL("../lib/rechner/schemata", import.meta.url))
  .filter((f) => f.endsWith(".tsx")).map((f) => f.slice(0, -4)).sort();

const arg = (name, standard) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : standard; };
const BASE = arg("base", "http://localhost:3000").replace(/\/$/, "");
const SLUG = arg("slug", "kredit");
const URL = `${BASE}/finanztools/rechner/${SLUG}`;

const ergebnisse = [];
const ok = (n, gut, notiz = "") => { ergebnisse.push({ n, gut, notiz }); console.log(`${gut ? "✓" : "✗"} ${n}${notiz ? "  → " + notiz : ""}`); };

const html = await (await fetch(URL)).text();
if (!/class="kb kb--rechner"/.test(html)) {
  console.log(`\n⏭  Übersprungen: /finanztools/rechner/${SLUG} rendert noch den alten Satz.`);
  console.log("   Mit NEXT_PUBLIC_KURSBLATT=1 starten, oder einen migrierten Rechner mit --slug wählen.");
  process.exit(0);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1400 } });
const fehler = [];
page.on("console", (m) => { if (m.type() === "error") fehler.push(m.text()); });
page.on("response", (r) => { if (r.status() >= 500) fehler.push(`HTTP ${r.status()} ${r.url().replace(BASE, "")}`); });
const abrufe = [];
page.on("request", (r) => { if (r.url().includes("/api/vergleich-daten/")) abrufe.push(r.url().split("/api/")[1]); });

// ── 1–4 · SSR: der Wert steht im HTML, das Ergebnis ist zu ────────────────────────
ok("SSR: Kursblatt-Satz statt rechner-layout", !/rechner-layout|rechner-container/.test(html));
ok("SSR: Ergebnis geschlossen ausgeliefert", /data-offen="aus"/.test(html));
// 🚨 Der Textauszug muss die Zahl zeigen, nicht den Zeichensatz der Odometer-Walzen.
const klartext = (html.match(/kb-odo__klartext">[^<]*/g) || []).map((t) => t.split(">").pop());
ok("SSR: Odometer liefert Klartext, keine Walzenkette",
  klartext.length > 0 && klartext.every((t) => !/0123456789/.test(t)), klartext.slice(0, 3).join(" | "));
ok("SSR: „Leo rechnet mit“ steht mit Zahl im HTML", /kb-rechner__leo/.test(html) && klartext.some((t) => /\d/.test(t)), klartext.slice(0, 2).join(" | "));

await page.goto(URL, { waitUntil: "networkidle" });
const nur = page.locator('button:has-text("Nur notwendig")');
if (await nur.count()) { await nur.first().click(); await page.waitForTimeout(300); }

// ── 5–7 · Eingaben: jeder Baustein steht da, wo das Schema ihn hinstellt ──────────
const bausteine = await page.evaluate(() => ({
  lineal: document.querySelectorAll(".kb-lineal").length,
  ring: document.querySelectorAll(".kb-drehring").length,
  zaehl: document.querySelectorAll(".kb-zaehlwerk").length,
  setz: document.querySelectorAll(".kb-setzzeile").length,
  reg: document.querySelectorAll(".kb-register").length,
  schalter: document.querySelectorAll(".kb-schalter").length,
  felder: document.querySelectorAll(".kb-rechner__felder > *").length,
  linealBreit: document.querySelector(".kb-lineal") ? Math.round(document.querySelector(".kb-lineal").getBoundingClientRect().width) : null,
}));
const summe = bausteine.lineal + bausteine.ring + bausteine.zaehl + bausteine.setz + bausteine.reg + bausteine.schalter;
ok("jedes Feld trägt einen Kursblatt-Baustein", summe > 0 && summe >= bausteine.felder,
  `${summe} Bausteine: Lineal ${bausteine.lineal} · Ring ${bausteine.ring} · Zählwerk ${bausteine.zaehl} · Setzzeile ${bausteine.setz} · Register ${bausteine.reg} · Schalter ${bausteine.schalter}`);
ok("kein Feld aus dem alten Satz", (await page.locator(".rechner-input, .rechner-select, .rechner-checkbox").count()) === 0);
if (bausteine.lineal) ok("Lineal nimmt die volle Satzbreite (728 px)", bausteine.linealBreit === 728, `${bausteine.linealBreit} px`);

// ── 8–9 · Stempel-Presets und die lebende Vorschau ───────────────────────────────
const stempel = page.locator(".kb-presets__stempel");
if (await stempel.count()) {
  const vorher = await page.evaluate(() => [...document.querySelectorAll(".kb-rechner__felder input, .kb-drehring__mitte b, .kb-zaehlwerk__wert .kb-odo__klartext")].map((e) => e.value ?? e.textContent).join("|"));
  await stempel.nth(await stempel.count() - 1).click();
  await page.waitForTimeout(700);
  const nachher = await page.evaluate(() => [...document.querySelectorAll(".kb-rechner__felder input, .kb-drehring__mitte b, .kb-zaehlwerk__wert .kb-odo__klartext")].map((e) => e.value ?? e.textContent).join("|"));
  ok("ein Stempel setzt die Werte des Presets", vorher !== nachher, `${vorher.slice(0, 40)} → ${nachher.slice(0, 40)}`);
  await stempel.nth(0).click();
  await page.waitForTimeout(700);
}

const leo = () => page.locator(".kb-rechner__leo-zahl .kb-odo__klartext").first().textContent();
const vor1 = await leo();
await page.locator(".kb-zaehlwerk__knopf, .kb-drehring__pfeil, .kb-setzzeile__knopf").nth(1).click();
await page.waitForTimeout(450);
const vor2 = await leo();
ok("„Leo rechnet mit“ folgt jeder Eingabe", vor1 !== vor2, `${vor1} → ${vor2}`);

// ── 10–12 · Ausrechnen: öffnet, scrollt mit 90 px Abstand, veraltet danach ────────
ok("vor dem Knopfdruck ist das Ergebnis zu",
  (await page.evaluate(() => getComputedStyle(document.querySelector(".kb-ergebnis")).gridTemplateRows)) === "0px");
// 🚨 Playwright scrollt den Knopf vor dem Klick selbst in den Blick — an der Position
// allein ist der eigene Sprung des Rechners nicht zu erkennen. Deshalb wird `scrollTo`
// belauscht: erst wenn DIESER Aufruf gelaufen und ausgelaufen ist, wird gemessen.
await page.evaluate(() => {
  window.__gesprungen = false;
  const echt = window.scrollTo.bind(window);
  window.scrollTo = (o) => { window.__gesprungen = true; return echt(o); };
});
await page.locator('.kb-pille:has-text("Ausrechnen")').first().click();
// Erst öffnet sich das Ergebnis (.52 s Verzug + .75 s Transition), dann scrollt die Seite
// weich dorthin. Beides abwarten, nicht auf eine Uhr messen.
// 🚨 Der Stillstand allein reicht nicht: vor dem Scroll steht die Seite auch still, und
// eine Prüfung „zweimal derselbe Wert" wäre sofort erfüllt. Deshalb erst das offene
// Ergebnis, dann ein Stillstand bei y > 0.
await page.waitForFunction(() => getComputedStyle(document.querySelector(".kb-ergebnis")).gridTemplateRows !== "0px", null, { timeout: 15000 });
// Der Sprung setzt erst am Ende der Aufklapp-Transition an und läuft dann weich.
await page.evaluate(() => { window.__letztesY = -1; });
await page.waitForFunction(() => {
  if (!window.__gesprungen) return false;
  const y = Math.round(window.scrollY);
  const steht = window.__letztesY === y;
  window.__letztesY = y;
  return steht;
}, null, { timeout: 15000, polling: 300 });
await page.waitForTimeout(400);
const offen = await page.evaluate(() => ({
  rows: getComputedStyle(document.querySelector(".kb-ergebnis")).gridTemplateRows,
  kopf: document.querySelector(".kb-ergebnis__kopf span")?.textContent,
  // K:454 — nach dem Öffnen steht der Ergebniskopf 90 px unter dem oberen Rand.
  abstand: Math.round(document.querySelector(".kb-ergebnis__kopf").getBoundingClientRect().top),
  kacheln: document.querySelectorAll(".kb-kachel").length,
}));
ok("Ergebnis offen, „ERGEBNIS“ zwischen Punktlinien", offen.rows !== "0px" && offen.kopf === "ERGEBNIS", `${offen.rows} · ${offen.kopf}`);
ok("Ergebnis steht 90 px unter dem oberen Rand", Math.abs(offen.abstand - 90) <= 6, `${offen.abstand} px`);
ok("mindestens eine Kachel", offen.kacheln >= 1, String(offen.kacheln));

await page.locator(".kb-zaehlwerk__knopf, .kb-drehring__pfeil, .kb-setzzeile__knopf").nth(1).click();
await page.waitForTimeout(500);
const veraltet = await page.evaluate(() => ({
  op: getComputedStyle(document.querySelector(".kb-ergebnis__innen")).opacity,
  label: document.querySelector(".kb-pille .kb-pille__text")?.textContent,
}));
ok("nach einer Eingabe: Ergebnis blass, Knopf heißt „Neu ausrechnen“",
  veraltet.op === "0.45" && veraltet.label === "Neu ausrechnen", `${veraltet.op} · ${veraltet.label}`);
await page.locator('.kb-pille:has-text("ausrechnen")').first().click();
await page.waitForTimeout(1800);

// ── 13–22 · Was der Handoff für den Kreditrechner namentlich nennt ───────────────
if (SLUG === "kredit") {
  // 🚨 Frisch laden: die Prüfungen oben haben Zins und Laufzeit verstellt, und die Zahlen
  // aus 05-kursblatt.jpg gelten für die Startwerte 20.000 € / 60 Monate / 5,5 %.
  await page.goto(URL, { waitUntil: "networkidle" });
  const nur2 = page.locator('button:has-text("Nur notwendig")');
  if (await nur2.count()) { await nur2.first().click(); await page.waitForTimeout(300); }
  abrufe.length = 0;
  await page.locator('.kb-pille:has-text("Ausrechnen")').first().click();
  await page.waitForTimeout(2200);

  const k = await page.evaluate(() => {
    const kacheln = [...document.querySelectorAll(".kb-kachel")];
    const zeilen = [...document.querySelectorAll(".kb-tabelle__zeile")];
    return {
      werte: kacheln.map((x) => x.querySelector(".kb-kachel__wert").textContent),
      hauptOutline: [getComputedStyle(kacheln[0]).outlineWidth, getComputedStyle(kacheln[0]).outlineOffset, getComputedStyle(kacheln[0]).outlineColor].join(" "),
      hauptFarbe: getComputedStyle(kacheln[0].querySelector(".kb-kachel__wert")).color,
      legende: document.querySelector(".kb-anteil__legende")?.textContent,
      kurve: document.querySelector(".kb-kurve__linie")?.getAttribute("d").split("L").length,
      jahre: zeilen.length,
      letzteRand: zeilen.length ? getComputedStyle(zeilen[zeilen.length - 1]).borderTopWidth : null,
      ring: document.querySelector(".kb-drehring__mitte b")?.textContent,
    };
  });
  ok("Kacheln 382 € · 2.921 € · 22.921 € (05-kursblatt.jpg)", k.werte.join(" | ") === "382 € | 2.921 € | 22.921 €", k.werte.join(" | "));
  ok("Monatsrate magenta, Outline 2 px #999 mit 3 px Abstand",
    k.hauptFarbe === "rgb(211, 0, 94)" && k.hauptOutline === "2px 3px rgb(153, 153, 153)", `${k.hauptFarbe} · ${k.hauptOutline}`);
  ok("Anteilsband 87 % Tilgung / 13 % Zinsen", /87\s*%/.test(k.legende || "") && /13\s*%/.test(k.legende || ""), k.legende);
  ok("Restschuldkurve mit einem Punkt je Monat", k.kurve === 61, String(k.kurve));
  ok("Jahresübersicht: eine Zeile je angefangenem Jahr, letzte betont",
    k.jahre === Math.ceil(Number(k.ring) / 12) && k.letzteRand === "2px", `${k.jahre} Zeilen bei ${k.ring} Monaten · ${k.letzteRand}`);

  // Scrubber: die Fahne klappt rechts der Mitte um
  await page.locator(".kb-kurve__bild").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const bild = await page.locator(".kb-kurve__bild").boundingBox();
  await page.mouse.move(bild.x + bild.width * 0.25, bild.y + bild.height / 2);
  await page.waitForTimeout(350);
  const links = await page.evaluate(() => { const f = document.querySelector(".kb-kurve__fahne"); return f ? { t: f.textContent, x: f.style.transform } : null; });
  await page.mouse.move(bild.x + bild.width * 0.8, bild.y + bild.height / 2);
  await page.waitForTimeout(350);
  const rechts = await page.evaluate(() => document.querySelector(".kb-kurve__fahne")?.style.transform);
  ok("Scrubber nennt Monat und Restschuld", /^Monat \d+ · Restschuld [\d.]+ €$/.test(links?.t || ""), links?.t);
  ok("Fahne klappt erst rechts der Mitte um", links?.x === "none" && rechts === "translateX(-100%)", `${links?.x} → ${rechts}`);

  // Drehring rastet auf 6er-Schritte
  const ring = await page.locator(".kb-drehring").boundingBox();
  await page.mouse.move(ring.x + ring.width / 2, ring.y + ring.height / 2);
  await page.mouse.down();
  await page.mouse.move(ring.x + ring.width * 0.92, ring.y + ring.height * 0.62, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(400);
  const monate = Number(await page.locator(".kb-drehring__mitte b").first().textContent());
  ok("Drehring rastet auf 6er-Schritte (K:381)", monate % 6 === 0, String(monate));

  // Zählwerk beim Halten: 380 ms Verzug, dann alle 70 ms
  const vorHalten = await page.locator(".kb-zaehlwerk__wert .kb-odo__klartext").textContent();
  await page.locator(".kb-zaehlwerk__knopf").nth(1).hover();
  await page.mouse.down();
  await page.waitForTimeout(900);
  await page.mouse.up();
  await page.waitForTimeout(300);
  const nachHalten = await page.locator(".kb-zaehlwerk__wert .kb-odo__klartext").textContent();
  const schritte = Math.round((parseFloat(nachHalten.replace(",", ".")) - parseFloat(vorHalten.replace(",", "."))) * 10);
  ok("gedrückt halten zählt weiter (380 ms, dann alle 70 ms)", schritte >= 5 && schritte <= 10, `${vorHalten} → ${nachHalten} (${schritte} Schritte)`);

  // ── Brücke: echte Marktzahlen, Hash, Aktenkoffer ──
  await page.waitForTimeout(1500);
  const br = await page.evaluate(() => {
    const b = document.querySelector(".kb-bruecke");
    return b ? {
      satz: b.querySelector(".kb-bruecke__satz")?.textContent.replace(/\s+/g, " ").trim(),
      fett: [...b.querySelectorAll(".kb-bruecke__satz b")].map((e) => e.textContent),
      href: b.querySelector("a.kb-pille")?.getAttribute("href"),
      strich: b.querySelector("button.kb-strich")?.textContent.trim(),
      oberlinie: `${getComputedStyle(b).borderTopColor} ${getComputedStyle(b).borderTopWidth}`,
    } : null;
  });
  ok("Brücke: 2-px-Türkis-Oberlinie", br?.oberlinie === "rgb(11, 127, 102) 2px", br?.oberlinie);
  ok("Brücke nennt die Zahlen des Vergleichs für DIESE Eingaben",
    (br?.fett?.length ?? 0) >= 2 && /aktuell/.test(br?.satz || ""), br?.fett?.join(" | "));
  ok("Brücke fragt genau ein Ziel ab, mit den Werten des Rechners",
    new Set(abrufe).size === 1 && /kurz=1/.test(abrufe[0] || "") && /loan=/.test(abrufe[0] || ""),
    `${abrufe.length} Aufrufe, ${new Set(abrufe).size} Ziel`);
  ok("Pille übergibt Summe und Laufzeit im Hash",
    /^\/finanztools\/vergleiche\/[a-z-]+#vgl:loan=\d+&duration_months=\d+$/.test(br?.href || ""), br?.href);

  if (br?.strich === "In den Aktenkoffer") {
    await page.locator(".kb-bruecke button.kb-strich").click();
    await page.waitForTimeout(900);
    const koffer = await page.evaluate(() => ({
      text: document.querySelector(".kb-bruecke button.kb-strich")?.textContent.trim(),
      erledigt: document.querySelector(".kb-bruecke button.kb-strich")?.dataset.erledigt,
      inhalt: JSON.parse(localStorage.getItem("faden-koffer") || "[]"),
    }));
    ok("„In den Aktenkoffer“ → „Im Aktenkoffer ✓“, Eintrag liegt drin",
      /Im Aktenkoffer/.test(koffer.text || "") && koffer.erledigt === "an" && koffer.inhalt.length === 1,
      `${koffer.text} · ${JSON.stringify(koffer.inhalt)}`);
  } else {
    ok("Brücke bietet „Alle Rechner“, wo kein Faden darüber liegt", br?.strich === undefined, String(br?.strich));
  }

  // Der Hash setzt den Vergleich sofort auf die Werte des Rechners.
  await page.goto(BASE + br.href, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const satz = await page.evaluate(() => document.querySelector(".kb-markt h2")?.textContent.replace(/\s+/g, " ").trim());
  ok("der Vergleich steht sofort auf Summe und Laufzeit", /20\.000 €/.test(satz || "") && /60 Monate/.test(satz || ""), satz);
  await page.goto(URL, { waitUntil: "networkidle" });
}

// ── schmaler Satz und die 55 anderen Rechner ─────────────────────────────────────
await page.setViewportSize({ width: 390, height: 1200 });
await page.waitForTimeout(700);
ok("390 px ohne waagerechten Überlauf",
  (await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) === 0);

// Seit der letzten Tranche sind ALLE Rechner im Kursblatt. Die Sonde prüft deshalb nicht
// mehr, ob ein alter noch alt ist, sondern dass keiner zurückgefallen ist.
const KEINE = [];
for (const s of ALLE) {
  const h = await (await fetch(`${BASE}/finanztools/rechner/${s}`)).text();
  if (!/class="kb kb--rechner"/.test(h) || /rechner-container/.test(h)) KEINE.push(s);
}
ok(`alle ${ALLE.length} Rechner stehen im Kursblatt-Satz`, KEINE.length === 0, KEINE.join(", "));

ok("keine Konsolenfehler, keine 500er", fehler.length === 0, fehler.slice(0, 3).join(" | "));

await browser.close();
const schlecht = ergebnisse.filter((e) => !e.gut);
console.log(`\n${ergebnisse.length - schlecht.length} von ${ergebnisse.length} Prüfungen bestanden.`);
process.exit(schlecht.length ? 1 : 0);
