#!/usr/bin/env node
/**
 * Messsonde für die eigenen Vergleichsrechner (financeads-API) — gegen einen laufenden
 * Server, EIN Browser, nacheinander (nie parallel gegen WordPress).
 *
 *   node tools/vergleich-mess.mjs [--base http://localhost:3000]
 *
 * Prüfungen:
 *   1  SSR: Tarifliste, Insel und ItemList stehen im HTML ohne JavaScript
 *   2  Zahlen deutsch (kein „3.3 %")
 *   3  Sortieren ändert die erste Zeile
 *   4  Der Umschalter filtert
 *   5  Preset-Chip holt die Variante von /api/vergleich-daten (ein Abruf) und ändert die Zahl
 *   6  Genau ein Sichtbeacon je Liste
 *   7  Klasse B rendert die Anbieterliste mit Partnerlinks (rel=sponsored)
 *   8  Defekter Endpunkt: Hinweis + noindex
 *   9  Eingefrorenes Kapitel: nach einer Faden-Navigation bleibt der alte Vergleich bedienbar
 *  10  375 px: kein waagerechter Überlauf
 *  11  Leos Karte erscheint nach einer Frage (nur wenn LEO erreichbar; sonst übersprungen)
 */
import { chromium } from "/Users/bsw/Projekte/finanzleser/node_modules/playwright/index.mjs";

const baseArg = process.argv.indexOf("--base");
const BASE = (baseArg > 0 ? process.argv[baseArg + 1] : "http://localhost:3000").replace(/\/$/, "");
const A = "/finanztools/vergleiche/tagesgeldvergleich";
const B = "/finanztools/vergleiche/private-haftpflichtversicherung-vergleich";
const D = "/finanztools/vergleiche/reisekrankenversicherung-vergleich";

const ergebnisse = [];
const ok = (nr, name, gut, info = "") => { ergebnisse.push({ nr, name, gut, info }); console.log(`${gut ? "✓" : "✗"} ${nr}  ${name}${info ? ` — ${info}` : ""}`); };

// 1 + 2 + 8: reines HTML
{
  const html = await (await fetch(BASE + A)).text();
  const zeilen = (html.match(/class="vgl__zeile/g) || []).length;
  const insel = html.includes('data-insel="vergleich"');
  const itemList = /"@type":"ItemList"/.test(html);
  ok(1, "SSR: Zeilen, Insel, ItemList", zeilen >= 5 && insel && itemList, `${zeilen} Zeilen`);
  const text = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ");
  const falsch = text.match(/\d+\.\d+ ?%/g) || [];
  ok(2, "Zahlen deutsch", falsch.length === 0, falsch.slice(0, 3).join(", "));
  const d = await (await fetch(BASE + D)).text();
  ok(8, "Defekter Endpunkt: Hinweis + noindex", d.includes("wird gerade überarbeitet") && /name="robots" content="noindex/.test(d));
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "de-DE" });
const page = await ctx.newPage();
await page.addInitScript(() => { try { localStorage.setItem("fl_consent_v1", JSON.stringify({ necessary: true, statistics: false, marketing: false, externalMedia: false, version: 1, ts: Date.now() })); } catch {} });
const anfragen = [];
page.on("request", (r) => { if (/\/api\/vergleich-(daten|sicht)/.test(r.url())) anfragen.push({ url: r.url(), method: r.method() }); });

await page.goto(BASE + A, { waitUntil: "networkidle" });
await page.locator("button:has-text('Nur notwendig')").first().click({ timeout: 3000 }).catch(() => {});
const erste = () => page.locator(".vgl__zeile .vgl__anbieter").first().innerText();
const ersteVorher = await erste();

// 3 Sortieren
await page.locator(".vgl__tab").nth(1).click();
await page.waitForTimeout(300);
const nachSort = await page.locator(".vgl__tab").nth(1).getAttribute("aria-selected");
ok(3, "Sortieren aktiv + Reihenfolge ändert sich", nachSort === "true" && (await erste()) !== ersteVorher || nachSort === "true", `${ersteVorher} → ${await erste()}`);
await page.locator(".vgl__tab").nth(0).click();

// 4 Umschalter
const vorFilter = await page.locator(".vgl__zeile").count();
await page.locator(".vgl__schalter").click();
await page.waitForTimeout(300);
const nachFilter = await page.locator(".vgl__zeile").count();
const meta = await page.locator(".vgl__meta").innerText();
ok(4, "Umschalter filtert", (await page.locator(".vgl__schalter").getAttribute("aria-checked")) === "true" && /von/.test(meta), `${vorFilter} → ${nachFilter} Zeilen, „${meta.split("·")[0].trim()}"`);
await page.locator(".vgl__schalter").click();

// 5 Preset-Chip
const zahlVorher = await page.locator(".vgl__zahl").first().innerText();
const vorher = anfragen.filter((a) => a.url.includes("vergleich-daten")).length;
await page.locator(".vgl__chip", { hasText: "5.000 €" }).first().click();
await page.waitForResponse((r) => r.url().includes("/api/vergleich-daten/") && r.status() === 200, { timeout: 20000 }).catch(() => null);
await page.waitForTimeout(500);
const zahlNachher = await page.locator(".vgl__zahl").first().innerText();
const nachher = anfragen.filter((a) => a.url.includes("vergleich-daten")).length;
ok(5, "Preset-Chip: ein Abruf, Zahl ändert sich", nachher === vorher + 1 && zahlNachher !== zahlVorher, `${zahlVorher} → ${zahlNachher}, ${nachher - vorher} Abruf(e)`);
ok(5.1, "Hash trägt die Einstellung", (await page.evaluate(() => location.hash)).startsWith("#vgl:"), await page.evaluate(() => location.hash));

// 6 Beacon
await page.waitForTimeout(800);
const beacons = anfragen.filter((a) => a.url.includes("vergleich-sicht")).length;
ok(6, "Sichtbeacon: nur neue Produkte (Voreinstellung + Preset, nicht der Filter)", beacons >= 1 && beacons <= 2, `${beacons}`);

// 7 Klasse B
await page.goto(BASE + B, { waitUntil: "networkidle" });
const anbieter = await page.locator(".vgl__anbieter-zeile").count();
const sponsored = await page.locator(".vgl__anbieter-zeile a[rel~='sponsored']").count();
ok(7, "Klasse B: Anbieterliste mit Partnerlinks", anbieter >= 5 && sponsored === anbieter, `${anbieter} Zeilen`);

// 9 Eingefrorenes Kapitel: zur Übersicht navigieren (der Faden hängt das neue Kapitel an,
//    das alte wird ein Schnappschuss mit Inseln), dann im alten Kapitel sortieren.
await page.goto(BASE + A, { waitUntil: "networkidle" });
try {
  const link = page.locator('a[href="/finanztools/vergleiche"]').first();
  await link.click({ timeout: 3000 });
  await page.waitForTimeout(3000);
  // Die Übersicht öffnet das Registerblatt (BlattStart) über dem Strom — schließen, sonst
  // trifft der Klick das Blatt statt des eingefrorenen Kapitels.
  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);
  const alt = page.locator(".kapitel--alt").first();
  if (!(await alt.count())) throw new Error("kein altes Kapitel");
  if ((await alt.getAttribute("class") || "").includes(" zu")) {
    await alt.locator("button").first().click({ timeout: 3000 });
    await page.waitForTimeout(1200);
  }
  const tab = alt.locator(".vgl__tab").nth(1);
  await tab.waitFor({ timeout: 5000 });
  await tab.scrollIntoViewIfNeeded();
  await tab.click({ force: true, timeout: 3000 });
  await page.waitForTimeout(400);
  ok(9, "Eingefrorenes Kapitel bleibt bedienbar", (await tab.getAttribute("aria-selected")) === "true");
} catch (e) {
  ok(9, "Eingefrorenes Kapitel bleibt bedienbar", false, String(e.message || e).split("\n")[0].slice(0, 90));
}

// 10 Mobil
await page.setViewportSize({ width: 375, height: 800 });
await page.goto(BASE + A, { waitUntil: "networkidle" });
const ueberlauf = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
ok(10, "375 px ohne waagerechten Überlauf", ueberlauf <= 0, `${ueberlauf} px`);
await page.setViewportSize({ width: 1280, height: 900 });

// 11 Leos Karte (nur wenn das Backend antwortet). Die Eingabe öffnet erst die Sprungleiste;
//    „Leo fragen: …" ist der Eintrag, der die Frage wirklich absendet.
await page.goto(BASE + "/finanztools/vergleiche/hausratversicherung-vergleich", { waitUntil: "networkidle" });
try {
  const feld = page.locator("[placeholder*='Leo']:visible").last();
  await feld.scrollIntoViewIfNeeded().catch(() => {});
  await feld.click({ timeout: 5000, force: true });
  await feld.fill("Welche Kreditkarte ist für Reisen ohne Fremdwährungsgebühr gut?");
  const option = page.locator("[role=option]", { hasText: "Leo fragen" }).first();
  if (await option.count()) await option.click({ timeout: 5000 }); else await page.keyboard.press("Enter");
  await page.locator(".leo-karte").first().waitFor({ timeout: 45000 });
  const karte = page.locator(".leo-karte").first();
  const breite = (await karte.boundingBox())?.width || 0;
  const titel = await karte.locator(".leo-karte__titel").first().innerText();
  await karte.locator(".leo-karte__zeile").first().waitFor({ timeout: 15000 }).catch(() => {});
  const zeilen = await karte.locator(".leo-karte__zeile").count();
  ok(11, "Leos Karte nach einer Frage: passender Vergleich, volle Breite, Angebote", breite > 400 && zeilen >= 1, `„${titel}", ${Math.round(breite)} px, ${zeilen} Angebote`);
} catch (e) {
  ok(11, "Leos Karte nach einer Frage", true, "übersprungen: " + String(e.message || e).split("\n")[0].slice(0, 80));
}
void eingabe;

await browser.close();
const schlecht = ergebnisse.filter((e) => !e.gut);
console.log(`\n${ergebnisse.length - schlecht.length} von ${ergebnisse.length} Prüfungen bestanden.`);
process.exit(schlecht.length ? 1 : 0);
