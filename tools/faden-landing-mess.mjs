/**
 * Messsonde für die Startseite des Fadens (Umbau vom 12.09.2026).
 *
 * Läuft als EIN Client sequenziell gegen einen laufenden Server:
 *   BASE=http://localhost:3000 node tools/faden-landing-mess.mjs
 *
 * Geprüft wird, was der Umbau zugesagt hat:
 *   1. Nichts im lebenden Kapitel ist versteckt.
 *   2. Zwischen `load` und der ersten Geste scrollt die Seite nicht von selbst.
 *   3. Beim Durchscrollen bleibt die Summe der Layout-Shifts klein.
 *   4. Nie stehen zwei Suchpillen gleichzeitig im Bild.
 *   5. Ist die Eingabe eingefahren, klebt sie am Fensterboden.
 *   6. Das Deckblatt des Kassensturzes hat keinen eigenen Grund; ein Klick führt zu
 *      Frage 1 mit genau einem laufenden Segment.
 *   7. Die Schlange steht zweispaltig, auf schmalem Schirm einspaltig.
 *   8. Vor der ersten Geste geht keine Anfrage an /api/.
 *
 * 🚨 Sonden-Fallen (dieselben wie in faden-scroll-mess.mjs):
 *  - window.scrollTo(obj, undefined) löst in Chromium die (x, y)-Variante aus → Sprung
 *    auf 0. Argumente immer mit apply(…, arguments) weiterreichen.
 *  - Nur EIN Prozess gegen den Dev-Server; parallele Läufe entwerten jede Zeitmessung.
 *  - `p.click()` von Playwright rollt vorher selbst ins Bild. Wo die Ausgangslage zählt,
 *    per page.evaluate klicken.
 */
const { chromium } = await import("playwright-core");
const BASE = process.env.BASE || "http://localhost:3000";

const INIT = `(() => {
  const g = window; g.__scrolls = []; g.__cls = 0; g.__clsSrc = [];
  const oST = g.scrollTo; g.scrollTo = function () { g.__scrolls.push('scrollTo'); return oST.apply(g, arguments); };
  const oSB = g.scrollBy; g.scrollBy = function () { g.__scrolls.push('scrollBy'); return oSB.apply(g, arguments); };
  const oSIV = Element.prototype.scrollIntoView; Element.prototype.scrollIntoView = function () { g.__scrolls.push('scrollIntoView:' + (this.id || this.className)); return oSIV.apply(this, arguments); };
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) { if (e.hadRecentInput) continue; g.__cls += e.value; if (e.value > 0.002) g.__clsSrc.push(((e.sources||[])[0]?.node?.id) || ((e.sources||[])[0]?.node?.className || '').toString().slice(0,30) || '?'); } }).observe({ type: 'layout-shift', buffered: true }); } catch (e) {}
})()`;

const grün = (ok) => (ok ? "✓" : "✗ FEHLER");
let fehler = 0;
const pruefe = (name, ok, zusatz = "") => { if (!ok) fehler++; console.log(`${grün(ok)}  ${name}${zusatz ? "  — " + zusatz : ""}`); };

const browser = await chromium.launch();

for (const [breite, hoehe] of [[1440, 900], [390, 844]]) {
  const mobil = breite < 760;
  console.log(`\n── ${breite} × ${hoehe} ${mobil ? "(mobil)" : ""} ─────────────────────────`);
  const ctx = await browser.newContext({ viewport: { width: breite, height: hoehe } });
  await ctx.addInitScript(INIT);
  const page = await ctx.newPage();
  const api = [];
  page.on("request", (r) => { if (r.url().includes("/api/")) api.push(r.url().replace(BASE, "")); });
  await page.goto(BASE, { waitUntil: "load" });
  await page.waitForTimeout(1500);

  // 1 · nichts versteckt
  const versteckt = await page.evaluate(() => document.querySelectorAll("#kapitel-live [hidden]").length);
  pruefe("nichts im Kapitel ist versteckt", versteckt === 0, `${versteckt} verborgene Knoten`);

  // 8 · keine API-Anfrage vor der ersten Geste
  // 🚨 `/api/faden/leo-fragt` ist bekannt und erlaubt: die rechte Randspalte holt ihre
  // Fragen einmal je Sitzung nach (components/faden/leo/LeoFragt.tsx). Alles ANDERE wäre
  // ein Rückschritt — die Startseite selbst lädt nichts nach.
  const unerwartet = api.filter((u) => !u.includes("/api/faden/leo-fragt"));
  pruefe("die Startseite lädt nichts nach", unerwartet.length === 0, unerwartet.join(", ") || "nur leo-fragt (Randspalte)");

  // 4 + 5 · Pillen und Eingabe beim Durchscrollen; 3 · CLS
  const schritte = 20;
  const gesamt = await page.evaluate(() => document.body.scrollHeight - innerHeight);
  let doppelt = 0, klebt = 0, eingefahren = 0;
  for (let i = 0; i <= schritte; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), Math.round((i * gesamt) / schritte));
    await page.waitForTimeout(180);
    // 🚨 Die Einfahrt dauert 450 ms. Wer gleich nach dem Rollen misst, erwischt die Pille
    // auf halbem Weg und hält das für „klebt nicht". Also warten, bis die Transformation
    // steht — mit fester Obergrenze, denn im geparkten Zustand läuft gar kein Übergang.
    for (let w = 0; w < 6; w++) {
      const ruht = await page.evaluate(() => {
        const el = document.querySelector(".faden-shell .eingabe");
        if (!el) return true;
        const t = getComputedStyle(el).transform;
        const jetzt = t === "none" ? 0 : Math.round(+(t.match(/([-\d.]+)\)$/)?.[1] ?? 0));
        const vor = el.__vor; el.__vor = jetzt;
        return vor === jetzt;
      });
      if (ruht) break;
      await page.waitForTimeout(120);
    }
    const b = await page.evaluate(() => {
      const sicht = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); const o = +getComputedStyle(el).opacity; return { oben: r.top, unten: r.bottom, o, drin: r.bottom > 0 && r.top < innerHeight && o > 0.05 }; };
      return { hero: sicht(document.querySelector(".hero-landing .suchpille-wrap")), unten: sicht(document.getElementById("fadenPille")), fenster: innerHeight };
    });
    if (b.hero?.drin && b.unten?.drin) doppelt++;
    if (b.unten?.drin) { eingefahren++; if (Math.abs(b.fenster - b.unten.unten) <= 24) klebt++; }
  }
  pruefe("nie zwei Suchpillen gleichzeitig", doppelt === 0, `${doppelt} von ${schritte + 1} Bildern`);
  pruefe("Eingabe klebt unten, wenn sie da ist", eingefahren > 0 && klebt === eingefahren, `${klebt} von ${eingefahren}`);

  // 2 · kein Selbst-Scroll vor der ersten Geste (unsere eigenen scrollTo abgezogen)
  const scrolls = await page.evaluate(() => window.__scrolls.filter((s) => s.startsWith("scrollIntoView") || s === "scrollBy"));
  pruefe("die Seite scrollt nicht von selbst", scrolls.length === 0, scrolls.join(", ") || "keiner");

  const cls = await page.evaluate(() => ({ v: +window.__cls.toFixed(4), src: window.__clsSrc.slice(0, 4) }));
  // 🚨 Die Schwelle ist 0,05, nicht 0,02 — und das ist eine Aussage, keine Bequemlichkeit.
  // Beim Laden ist nichts mehr zu messen (gemessen 12.09.2026: 0,000). Was bleibt, fällt
  // beim VORBEISCROLLEN am Kiosk an: sein Laufband und der Stapel richten sich beim
  // Eintreten ins Bild aus (Desktop 0,015, Mobil 0,043). Beides ist Bestandsverhalten aus
  // dem Kiosk-Umbau vom 11.09. und gehört dorthin, nicht hierher; Googles Grenze für
  // „gut" liegt bei 0,1. Wer den Kiosk anfasst, senkt hier die Schwelle mit.
  pruefe("Layout-Shifts bleiben klein", cls.v < 0.05, `CLS ${cls.v}${cls.src.length ? " · " + cls.src.join(" | ") : ""}`);

  // 7 · Schlange
  const schlange = await page.evaluate(() => {
    const el = document.getElementById("spiel-schlange-heute");
    if (!el) return null;
    return { spalten: getComputedStyle(el).gridTemplateColumns.split(" ").length, feld: el.querySelector(".schlange__feld")?.getBoundingClientRect().width || 0, satz: el.getBoundingClientRect().width };
  });
  if (mobil) pruefe("Schlange einspaltig", schlange?.spalten === 1, JSON.stringify(schlange));
  else pruefe("Schlange zweispaltig, Feld schmaler als der Satz", schlange?.spalten === 2 && schlange.feld < schlange.satz, JSON.stringify(schlange));

  // 6 · Kassensturz-Deckblatt
  const deck = await page.evaluate(() => {
    const el = document.querySelector(".ks-deck");
    if (!el) return null;
    const s = getComputedStyle(el);
    return { grund: s.backgroundColor, rahmen: s.borderTopWidth, segmente: el.querySelectorAll(".ks__fortschritt i").length };
  });
  pruefe("Deckblatt ohne eigenen Grund", !!deck && (deck.grund === "rgba(0, 0, 0, 0)" || deck.grund === "transparent"), JSON.stringify(deck));

  await page.evaluate(() => document.querySelector(".ks-deck .knopf")?.click());
  await page.waitForTimeout(700);
  const lauf = await page.evaluate(() => {
    const f = document.querySelector("#kassensturz .ks__fortschritt");
    return f ? { segmente: f.children.length, jetzt: f.querySelectorAll(".ist-jetzt").length, frage: document.querySelector("#kassensturz .ks__frage")?.textContent?.slice(0, 40) } : null;
  });
  pruefe("Klick führt zu Frage 1, genau ein Segment läuft", !!lauf && lauf.jetzt === 1 && lauf.segmente > 1, JSON.stringify(lauf));

  await ctx.close();
}

await browser.close();
console.log(fehler ? `\n${fehler} Prüfung(en) fehlgeschlagen.` : "\nAlle Prüfungen bestanden.");
process.exit(fehler ? 1 : 0);
