/**
 * Messsonde für eingefrorene Kapitel: Bleibt alles bedienbar, egal wie weit der Leser
 * den Faden schon geladen hat?
 *
 *   BASE=http://localhost:3000 node tools/faden-kapitel-mess.mjs
 *
 * Geprüft werden die vier Wege, auf denen der User am 13.09.2026 tote Elemente gefunden
 * hat: nach einer Navigation · nach Zuklappen und Wiederaufklappen · nach einem Neuladen
 * mit anschließendem Aufklappen · und ob irgendwo wieder ein weißer Kasten steht.
 *
 * 🚨 `el.click()` per page.evaluate reicht für eine Prüfung der BEDIENBARKEIT nicht immer
 * — die Bildschirmtastatur des Finanzworts hängt an einer echten Mausfolge. Wo es um
 * „reagiert das Ding?" geht, mit Playwright klicken, nicht per evaluate.
 *
 * 🚨 Nur EIN Prozess gegen den Dev-Server (Memory feedback_parallele_agenten_dev_server).
 */
const { chromium } = await import("playwright-core");
const BASE = process.env.BASE || "http://localhost:3000";

let fehler = 0;
const pruefe = (name, ok, zusatz = "") => { if (!ok) fehler++; console.log(`${ok ? "✓" : "✗ FEHLER"}  ${name}${zusatz ? "  — " + zusatz : ""}`); };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await ctx.newPage();

/** Was im eingefrorenen Kapitel lebt. */
const stand = () => page.evaluate(() => {
  const alt = document.querySelector("#strom .kapitel--alt");
  if (!alt) return null;
  const q = (s) => alt.querySelectorAll(s).length;
  // Weißes Papier ist nur an drei Stellen erlaubt: Kioskblatt, Anzeige, Eingabefeld.
  const weiss = Array.from(alt.querySelectorAll("*")).filter((e) => {
    const bg = getComputedStyle(e).backgroundColor;
    return bg === "rgb(253, 253, 251)" && !e.closest(".kiosk-blatt, .einschub, .neueste") && e.tagName !== "INPUT";
  }).map((e) => (e.className || e.tagName).toString().slice(0, 30));
  return {
    wortspiel: q(".wortspiel"), ksDeck: q(".ks-deck"), leoKarten: q(".leo-empfiehlt__reihe .vgl-karte"),
    chips: q(".weiterreden .chip"), schlange: q(".schlange__feld"), kioskBlatt: q(".kiosk-blatt"),
    wbFeld: q(".wb-teaser input"), weiss: [...new Set(weiss)],
  };
});
const vollstaendig = (s) => !!s && s.wortspiel > 0 && s.ksDeck > 0 && s.leoKarten > 0 && s.chips > 0 && s.schlange > 0 && s.kioskBlatt > 0 && s.wbFeld > 0;
const klappen = () => page.evaluate(() => document.querySelector("#strom .kapitel--alt .kapitel__kopf button")?.click());

await page.goto(BASE, { waitUntil: "load" });
const nn = page.getByRole("button", { name: "Nur notwendig" });
if (await nn.count()) await nn.first().click().catch(() => {});
await page.waitForTimeout(2500);

// Einen Ratgeber aus dem Kiosk öffnen — die Startseite friert dabei ein.
await page.evaluate(() => document.querySelector("#strom .kiosk a[href^='/']")?.click());
await page.waitForTimeout(3500);
let s = await stand();
pruefe("nach der Navigation lebt alles", vollstaendig(s), JSON.stringify(s));
pruefe("kein weißer Kasten im alten Kapitel", !!s && s.weiss.length === 0, (s?.weiss || []).join(", ") || "keiner");

await klappen(); await page.waitForTimeout(1000);
await klappen(); await page.waitForTimeout(2500);
s = await stand();
pruefe("nach Zuklappen und Aufklappen lebt alles", vollstaendig(s), JSON.stringify(s));

await page.reload({ waitUntil: "load" }); await page.waitForTimeout(4000);
await klappen(); await page.waitForTimeout(3000);
s = await stand();
pruefe("nach dem Neuladen lebt alles", vollstaendig(s), JSON.stringify(s));
pruefe("auch dort kein weißer Kasten", !!s && s.weiss.length === 0, (s?.weiss || []).join(", ") || "keiner");

// Bedienbarkeit: eine Bildschirmtaste (echte Maus) und das Deckblatt des Kassensturzes.
const taste = page.locator("#strom .kapitel--alt .wortspiel .taste").first();
if (await taste.count()) { await taste.scrollIntoViewIfNeeded(); await taste.click(); await page.waitForTimeout(400); }
pruefe("das Finanzwort nimmt Eingaben an", await page.evaluate(() => document.querySelectorAll("#strom .kapitel--alt .wortspiel .zelle.voll").length > 0));

const deck = page.locator("#strom .kapitel--alt .ks-deck__start button").first();
if (await deck.count()) { await deck.scrollIntoViewIfNeeded(); await deck.click(); await page.waitForTimeout(900); }
pruefe("der Kassensturz startet", await page.evaluate(() => document.querySelectorAll("#strom .kapitel--alt .ks__karte").length > 0));

await browser.close();
console.log(fehler ? `\n${fehler} Prüfung(en) fehlgeschlagen.` : "\nAlle Prüfungen bestanden.");
process.exit(fehler ? 1 : 0);
