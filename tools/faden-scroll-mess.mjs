/**
 * Messsonde für das Scrollverhalten des Fadens (siehe docs/PLAN_faden_scroll.md).
 *
 * Läuft als EIN Client sequenziell gegen einen laufenden Server:
 *   BASE=http://localhost:3000 node tools/faden-scroll-mess.mjs        (Dev)
 *   BASE=http://localhost:3100 LEO=1 node tools/faden-scroll-mess.mjs  (next start, mit Leo-Frage)
 *
 * Protokolliert je Szenario: jeden scrollTo/scrollBy/scrollIntoView (Zwei-Zahlen-Aufrufe mit
 * Stack, um GSAP-Refreshes zu erkennen), Layout-Shifts, Umbauten des Verlaufs links, und je
 * Bild die Lage von Skelett (sk), lebendem Kapitel (live), Randspalte (rail) und Eingabe (ein).
 * Screenshots landen neben dem Skript.
 *
 * 🚨 Sonden-Fallen, die schon einmal einen ganzen Lauf entwertet haben:
 *  - window.scrollTo(obj, undefined) löst in Chromium die (x, y)-Variante aus → Sprung auf 0.
 *    Argumente deshalb IMMER mit apply(…, arguments) weiterreichen.
 *  - Verborgene Browser-Tabs rendern nicht (kein rAF, Timer auf 1/s) — headless Chromium
 *    über Playwright rendert vollständig, die eingebettete Vorschau nur, wenn sie sichtbar ist.
 */
const { chromium } = await import("playwright-core");
const BASE = process.env.BASE || "http://localhost:3000";
const LEO = process.env.LEO === "1";
const OUT = (process.env.OUT || process.cwd()).replace(/\/?$/, "/"); // Screenshots ins Arbeitsverzeichnis, nicht neben das Skript

const INIT = `(() => {
  const g = window; g.__log = []; g.__t0 = performance.now();
  const L = (art, d) => g.__log.push({ t: Math.round(performance.now() - g.__t0), art, ...(d || {}) });
  g.__L = L; g.__mark = (n) => { L('MARK', { n }); g.__markAt = g.__log.length; };
  const st = () => new Error().stack.split('\\n').slice(2, 7).map(s => s.trim().replace(/^at /, '').replace(/https?:\\/\\/localhost:\\d+\\/_next\\/static\\/chunks\\//g, '').replace(/webpack-internal:\\/\\/\\/\\(app-pages-browser\\)\\/\\.\\//g, '')).join(' < '); const oST = g.scrollTo; g.scrollTo = function () { const a = arguments[0], b = arguments[1]; const o = typeof a === 'object' ? a : { top: b, behavior: 'auto' }; L('scrollTo', { top: Math.round(o.top ?? 0), beh: o.behavior || 'auto', from: Math.round(scrollY), st: typeof a === 'object' ? undefined : st() }); return oST.apply(g, arguments); };
  const oSB = g.scrollBy; g.scrollBy = function () { const a = arguments[0], b = arguments[1]; const o = typeof a === 'object' ? a : { top: b }; L('scrollBy', { dy: Math.round(o.top ?? 0), from: Math.round(scrollY) }); return oSB.apply(g, arguments); };
  const oSIV = Element.prototype.scrollIntoView; Element.prototype.scrollIntoView = function () { L('scrollIntoView', { el: this.id || this.className, from: Math.round(scrollY) }); return oSIV.apply(this, arguments); };
  try { new PerformanceObserver(list => { for (const e of list.getEntries()) { if (e.value > 0.002) L('CLS', { v: +e.value.toFixed(3), input: e.hadRecentInput, src: (e.sources || []).slice(0, 2).map(s => s.node && (s.node.id || (typeof s.node.className === 'string' && s.node.className.slice(0, 28)) || s.node.tagName)).join('|') }); } }).observe({ type: 'layout-shift', buffered: true }); } catch (e) {}
  let attached = false, last = null, hb = 0;
  const tocTxt = (liste) => Array.from(liste.querySelectorAll(':scope > li')).map(li => (li.className || '-') + ':' + (li.querySelector(':scope > button > span:last-child')?.textContent || '').slice(0, 22) + (li.querySelector('ol') ? ' [+' + li.querySelectorAll('ol li').length + ']' : '')).join(' / ');
  const attach = () => {
    const liste = document.getElementById('kapitelListe'); const strom = document.getElementById('strom');
    if (!liste || !strom) return;
    attached = true;
    L('TOC0', { txt: tocTxt(liste) });
    new MutationObserver(() => L('TOC', { txt: tocTxt(liste) })).observe(liste, { childList: true, subtree: true, characterData: true });
    new MutationObserver(ms => { for (const m of ms) { for (const n of m.addedNodes) if (n.nodeType === 1) L('add', { id: n.id || n.className }); for (const n of m.removedNodes) if (n.nodeType === 1) L('rm', { id: n.id || n.className }); } }).observe(strom, { childList: true });
  };
  const sample = (ts) => {
    if (!attached) attach();
    const live = document.getElementById('kapitel-live'); const sk = document.querySelector('.kapitel--skelett'); const rl = document.querySelector('#randLinks .rand__innen'); const ein = document.querySelector('.eingabe'); const strom = document.getElementById('strom');
    const s = { y: Math.round(scrollY), doc: document.documentElement.scrollHeight, live: live ? Math.round(live.getBoundingClientRect().top) : null, sk: sk ? Math.round(sk.getBoundingClientRect().top) : null, rail: rl ? Math.round(rl.getBoundingClientRect().top) : null, ein: ein ? Math.round(ein.getBoundingClientRect().bottom) : null, laedt: !!(strom && strom.classList.contains('strom--laedt')), alt: document.querySelectorAll('.kapitel--alt').length, altOffen: document.querySelectorAll('.kapitel--alt:not(.zu)').length };
    if (last) {
      const d = [];
      if (s.y !== last.y) d.push((Math.abs(s.y - last.y) > 40 ? 'JUMP' : 'y') + ' dy=' + (s.y - last.y));
      if (s.doc !== last.doc) d.push('doc ' + last.doc + '→' + s.doc);
      if (s.live !== null && last.live !== null && s.live !== last.live && s.y === last.y) d.push('liveShift ' + last.live + '→' + s.live);
      if (s.rail !== last.rail) d.push('rail ' + last.rail + '→' + s.rail);
      if (s.ein !== last.ein) d.push('ein ' + last.ein + '→' + s.ein);
      if (s.laedt !== last.laedt) d.push('laedt=' + s.laedt);
      if (s.alt !== last.alt || s.altOffen !== last.altOffen) d.push('alt=' + s.alt + '/' + s.altOffen);
      if (d.length) L('Δ', { d: d.join('; '), y: s.y, live: s.live, sk: s.sk });
    } else L('s0', s);
    if (ts - hb > 500) { hb = ts; L('hb', s); }
    last = s;
    requestAnimationFrame(sample);
  };
  requestAnimationFrame(sample);
  g.__dump = () => { const from = g.__markAt || 0; return g.__log.slice(from).map(e => String(e.t).padStart(6) + ' ' + e.art.padEnd(14) + ' ' + JSON.stringify(Object.fromEntries(Object.entries(e).filter(([k]) => k !== 't' && k !== 'art')))).join('\\n'); };
})();`;

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1, reducedMotion: "no-preference" });
await ctx.addInitScript(INIT);
const page = await ctx.newPage();
page.on("console", (m) => { if (m.type() === "error") console.log("  [console.error]", m.text().slice(0, 200)); });
page.on("pageerror", (e) => console.log("  [pageerror]", e.message.slice(0, 300)));
// Dev-Server: Routen vorwärmen (Kompilieren dauert sonst bis 5 s je Ziel und verfälscht die Zeiten).
// Ein Client, nacheinander. WARM="/a,/b" — Standard sind die Ziele des Messpfads vom 10.09.2026.
// Vorwärmen im BROWSER (page.goto), nicht per fetch: Erst so baut der Dev-Server auch die
// Client-Chunks der Route; ein fetch wärmt nur die Server-Seite, und die erste echte
// Navigation kompiliert dann noch 4–10 s im Browser.
for (const pfad of (process.env.WARM ?? "/finanzen/energiekosten/vorlage-test,/finanzen/energiekosten/strompreise,/finanzen/energiekosten/gaspreise,/finanztools/checklisten/gaspreise-vergleichen").split(",").filter(Boolean)) {
  const t = Date.now(); try { await page.goto(BASE + pfad, { waitUntil: "networkidle", timeout: 90000 }); } catch { /* egal */ } console.log("warm", pfad, Date.now() - t, "ms");
}
await page.evaluate(() => { try { sessionStorage.clear(); } catch { /* egal */ } });
const out = (title, txt) => { console.log("\n===== " + title + " =====\n" + txt); };
const dump = async (title) => out(title, await page.evaluate(() => window.__dump()));
const mark = (n) => page.evaluate((n) => window.__mark(n), n);
const wheel = async (dy, steps = 8) => { for (let i = 0; i < steps; i++) { await page.mouse.wheel(0, dy / steps); await page.waitForTimeout(40); } };
const shot = (name) => page.screenshot({ path: OUT + name + ".png" });
const stat = () => page.evaluate(() => ({ url: location.pathname, y: Math.round(scrollY), doc: document.documentElement.scrollHeight, live: document.getElementById("kapitel-live")?.dataset.titel, alt: document.querySelectorAll(".kapitel--alt").length }));

// ---- A: Landing → Begrüßung
let t = Date.now();
await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 90000 });
console.log("A geladen in", Date.now() - t, "ms");
await mark("A-begruessung");
await page.mouse.move(800, 500);
await wheel(1400, 14);
await page.waitForTimeout(5000);
await dump("A: Landing, zum Faden gescrollt, Begrüßung"); 
console.log("stat", JSON.stringify(await stat()));
await shot("A");

// ---- B: Landing → Ratgeber (Klick auf einen Beitragslink im lebenden Kapitel)
const hrefB = await page.evaluate(() => { const kat = ["finanzen", "steuern", "versicherungen", "recht"]; for (const a of document.querySelectorAll("#kapitel-live a[href]")) { const p = a.getAttribute("href") || ""; const seg = p.split("/").filter(Boolean); if (seg.length === 3 && kat.includes(seg[0])) { a.scrollIntoView({ block: "center" }); return p; } } return null; });
console.log("B Ziel:", hrefB);
await page.waitForTimeout(600);
await mark("B-klick");
t = Date.now();
await page.click(`#kapitel-live a[href="${hrefB}"]`);
await page.waitForTimeout(20000);
await dump("B: Landing → Ratgeber " + hrefB);
console.log("stat", JSON.stringify(await stat()));
await shot("B");

// ---- C: Ratgeber → Ratgeber über „Dazu passt“ (Leser steht am Ende, Heute-Kapitel oben noch offen)
const hrefC = await page.evaluate(() => { const a = document.querySelector("#kapitel-live .dazu a.dazu__eintrag"); if (!a) return null; a.scrollIntoView({ block: "center" }); return a.getAttribute("href"); });
console.log("C Ziel:", hrefC);
await page.waitForTimeout(600);
await mark("C-klick");
await page.click(`#kapitel-live .dazu a[href="${hrefC}"]`);
await page.waitForTimeout(20000);
await dump("C: Ratgeber → Ratgeber (Dazu passt) " + hrefC);
console.log("stat", JSON.stringify(await stat()));
await shot("C");

// ---- C2: Ratgeber → Ratgeber aus der MITTE des Beitrags (Lesestelle mitten im Text, Inhaltsverzeichnis-Link)
const hrefC2 = await page.evaluate(() => { const kat = ["finanzen", "steuern", "versicherungen", "recht"]; const links = Array.from(document.querySelectorAll("#kapitel-live .fliess a[href], #kapitel-live .dazu a[href]")); for (const a of links) { const p = a.getAttribute("href") || ""; const seg = p.split("/").filter(Boolean); if (seg.length === 3 && kat.includes(seg[0]) && p !== location.pathname) { a.scrollIntoView({ block: "center" }); return p; } } return null; });
console.log("C2 Ziel:", hrefC2);
if (hrefC2) {
  await page.waitForTimeout(600);
  await mark("C2-klick");
  await page.click(`#kapitel-live a[href="${hrefC2}"]`);
  await page.waitForTimeout(20000);
  await dump("C2: Ratgeber → Ratgeber aus der Mitte " + hrefC2);
  console.log("stat", JSON.stringify(await stat()));
}

// ---- D: Ratgeber → kurze Seite (Rechner/Checkliste/Kassensturz)
const hrefD = await page.evaluate(() => { const sel = ['#kapitel-live a[href^="/finanztools/rechner/"]', '#kapitel-live a[href^="/finanztools/checklisten/"]', '#kapitel-live a[href^="/finanztools/vergleiche/"]', '#kapitel-live a[href="/kassensturz"]', '#kapitel-live .krumen a']; for (const s of sel) { const a = document.querySelector(s); if (a) { a.scrollIntoView({ block: "center" }); return { href: a.getAttribute("href"), sel: s }; } } return null; });
console.log("D Ziel:", JSON.stringify(hrefD));
if (hrefD) {
  await page.waitForTimeout(600);
  await mark("D-klick");
  await page.click(`#kapitel-live a[href="${hrefD.href}"]`);
  await page.waitForTimeout(20000);
  await dump("D: Ratgeber → kurze Seite " + hrefD.href);
  console.log("stat", JSON.stringify(await stat()));
  await shot("D");
}

// ---- E: Neuladen auf der aktuellen URL (Verlauf aus sessionStorage)
const urlE = page.url();
await mark("E-reload");
const yVor = await page.evaluate(() => scrollY);
console.log("E: reload", urlE, "y vorher", yVor);
await page.reload({ waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(3000);
await dump("E: nach Neuladen");
console.log("stat", JSON.stringify(await stat()), "sessionStorage verlauf KB:", await page.evaluate(() => Math.round((sessionStorage.getItem("faden-verlauf") || "").length / 1024)));
await shot("E");

// ---- F: Erstes altes Kapitel aufklappen (Inseln beleben), dann per Verlauf anspringen
await mark("F-aufklappen");
const f = await page.evaluate(() => { const k = document.querySelector(".kapitel--alt.zu"); if (!k) return null; k.querySelector(".toggle-k")?.scrollIntoView({ block: "center" }); return k.id; });
console.log("F Kapitel:", f);
if (f) {
  await page.waitForTimeout(500);
  await page.click(`#${f} .toggle-k`);
  await page.waitForTimeout(4000);
  await dump("F: altes Kapitel aufgeklappt");
  console.log("stat", JSON.stringify(await stat()), "inseln:", await page.evaluate((id) => ({ marker: document.querySelectorAll(`#${id} [data-insel]`).length, gefuellt: Array.from(document.querySelectorAll(`#${id} [data-insel]`)).filter(e => e.children.length > 1 || (e.children.length === 1 && e.firstElementChild.tagName !== "SCRIPT")).length, wieder: !!document.querySelector(`#${id} .kapitel__wieder`) }), f));
  // Dann zum lebenden Kapitel hinunter und das offene alte Kapitel wieder einklappen → Sprung?
  await page.evaluate(() => document.getElementById("kapitel-live")?.scrollIntoView({ block: "start" }));
  await page.waitForTimeout(800);
  await mark("F2-einklappen-oben");
  await page.evaluate((id) => { const b = document.querySelector(`#${id} .toggle-k`); b && b.click(); }, f);
  await page.waitForTimeout(2500);
  await dump("F2: Kapitel OBERHALB der Lesestelle eingeklappt");
  console.log("stat", JSON.stringify(await stat()));
}

// ---- G: Leo fragen (Streaming)
if (LEO) {
  await page.evaluate(() => document.getElementById("strom-ende")?.scrollIntoView({ block: "end" }));
  await page.waitForTimeout(800);
  await mark("G-leo");
  await page.evaluate(() => { document.querySelector(".cookie-bar")?.remove(); });
  await page.click("#frage");
  await page.keyboard.type("Was ist eine Einspeisevergütung?");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(16000);
  await dump("G: Leo-Antwort (Streaming)");
  console.log("stat", JSON.stringify(await stat()), await page.evaluate(() => { const l = document.querySelector("#leo-strom > div:last-of-type"); const r = l?.getBoundingClientRect(); return JSON.stringify({ letzteAntwortBottom: r && Math.round(r.bottom), innerH: innerHeight, textLen: l?.textContent?.length }); }));
  await shot("G");
}

await browser.close();
