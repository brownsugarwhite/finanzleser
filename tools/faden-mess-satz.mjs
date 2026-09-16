/**
 * Messsonde für den Satz: Wie viele verschiedene Schriftgrade, Abstände und Radien
 * stehen am Ende wirklich im Bild — und wo ist etwas gequetscht?
 *
 * Läuft als EIN Client sequenziell gegen einen laufenden Server:
 *   BASE=http://localhost:3000 node tools/faden-mess-satz.mjs
 *   node tools/faden-mess-satz.mjs --seiten /schaukasten,/schaukasten/ratgeber
 *
 * 🚨 Nur EIN Prozess gegen den Dev-Server (Memory feedback-parallele-agenten-dev-server).
 * 🚨 Gemessen wird der GERENDERTE Baum, nicht das Stylesheet — token-wache.mjs macht das
 *    andere Ende. Erst beides zusammen zeigt, ob eine Vereinheitlichung wirklich ankommt.
 *
 * Gequetscht heißt hier eines von vieren:
 *   1. Der Text läuft über seinen Kasten hinaus und wird abgeschnitten.
 *   2. Ein Element ragt aus dem Innenmaß seines Elternteils heraus.
 *   3. Zwei Geschwister im selben Kasten überlappen sich waagerecht.
 *   4. Eine Zeile steht enger als 1,15 — bei Fließtext ein sicheres Zeichen.
 */
const { chromium } = await import("playwright-core");
const BASE = process.env.BASE || "http://localhost:3000";
const argSeiten = process.argv.indexOf("--seiten");
const SEITEN = argSeiten > -1
  ? process.argv[argSeiten + 1].split(",")
  : ["/schaukasten", "/schaukasten/ratgeber", "/schaukasten/statistiken", "/entwurf/kursblatt"];

const SAMMLER = `(() => {
  const zahl = (s) => { const m = String(s).match(/^-?\\d+(?:\\.\\d+)?px$/); return m ? s : null; };
  const grade = new Map(), luft = new Map(), radien = new Map(), farben = new Map();
  const quetsch = [];
  const zaehl = (m, k, el) => { if (!k) return; const v = m.get(k) || { n: 0, bsp: "" }; v.n++; if (!v.bsp) v.bsp = (el.tagName.toLowerCase() + "." + String(el.className || "").split(" ").filter(Boolean).slice(0,2).join(".")).slice(0, 48); m.set(k, v); };
  const sichtbar = (el, r) => r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
  const textVon = (el) => [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(" ").trim();

  // 🚨 Nur der Faden selbst. Ein klassenloses DIV direkt unter body ist im Dev-Modus
  // die Next-Overlay: die ragt immer 12 px heraus und hat mit dem Satz nichts zu tun.
  const wurzeln = document.querySelectorAll(".faden-shell, main, .kb, .cookie-bar");
  const knoten = new Set();
  for (const w of wurzeln) { knoten.add(w); for (const k of w.querySelectorAll("*")) knoten.add(k); }
  for (const el of knoten) {
    const r = el.getBoundingClientRect();
    if (!sichtbar(el, r)) continue;
    const s = getComputedStyle(el);
    if (el.closest(".schau-anzeigen, .token, .inv")) continue;   // die Tafeln zeigen Tokens, die zählen nicht mit
    // 🚨 Absichtlich Verborgenes ist nicht gequetscht: Vorleser-Text steht per Absicht in
    // einem 1-px-Kasten, und in einem <svg> misst clientWidth ohnehin nichts Sinnvolles.
    if (el.ownerSVGElement || el.tagName === "svg") continue;
    if (el.closest(".sr, .nur-vorlesen, [aria-hidden='true'], [hidden]")) continue;
    if (el.clientWidth <= 2 || el.clientHeight <= 2) continue;
    const eigenerText = textVon(el).length > 0;

    if (eigenerText) zaehl(grade, zahl(s.fontSize), el);
    for (const p of ["marginTop","marginBottom","marginLeft","marginRight","paddingTop","paddingBottom","paddingLeft","paddingRight","rowGap","columnGap"]) {
      const v = zahl(s[p]); if (v && v !== "0px") zaehl(luft, v, el);
    }
    if (s.borderRadius && s.borderRadius !== "0px") zaehl(radien, s.borderRadius.replace(/\\s+/g, " "), el);
    for (const p of ["color","backgroundColor","borderTopColor"]) {
      const v = s[p]; if (v && v !== "rgba(0, 0, 0, 0)" && !(p !== "color" && v === "rgb(0, 0, 0)")) zaehl(farben, v, el);
    }

    // ── gequetscht? ──
    const wo = (el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + "." + String(el.className||"").split(" ").filter(Boolean).slice(0,3).join(".")).slice(0, 70);
    const text = (el.textContent || "").trim().slice(0, 45);
    if (eigenerText && el.scrollWidth > el.clientWidth + 1 && /hidden|clip|auto|scroll/.test(s.overflowX))
      quetsch.push({ art: "abgeschnitten", wo, text, ist: el.scrollWidth, soll: el.clientWidth });
    const p = el.parentElement;
    if (p && p !== document.body) {
      const ps = getComputedStyle(p), pr = p.getBoundingClientRect();
      const li = pr.left + parseFloat(ps.paddingLeft||0), re = pr.right - parseFloat(ps.paddingRight||0);
      // Nur waagerecht, nur bei Elementen im normalen Fluss, und nur wenn der Elternteil
      // wirklich abschneidet — ein absolut gesetzter Überhang ist gewollt.
      const raus = Math.round(Math.max(li - r.left, r.right - re));
      // Ein verschobenes Element ist die Bahn eines Sliders — die ragt mit Absicht heraus.
      const faehrt = s.transform !== "none" || ps.transform !== "none";
      if (r.width > 0 && raus > 1.5 && !faehrt && s.position === "static" && /hidden|clip/.test(ps.overflowX))
        quetsch.push({ art: "ragt heraus", wo, text, ist: raus, soll: 0 });
    }
    if (eigenerText && parseFloat(s.fontSize) >= 13 && s.lineHeight !== "normal" && parseFloat(s.lineHeight) / parseFloat(s.fontSize) < 1.15 && (el.textContent||"").trim().length > 60)
      quetsch.push({ art: "Zeile zu eng", wo, text, ist: (parseFloat(s.lineHeight)/parseFloat(s.fontSize)).toFixed(2), soll: "1.15" });
  }
  const raus = (m) => [...m.entries()].map(([wert, v]) => ({ wert, n: v.n, bsp: v.bsp })).sort((a,b) => b.n - a.n);
  return { grade: raus(grade), luft: raus(luft), radien: raus(radien), farben: raus(farben), quetsch };
})()`;

const browser = await chromium.launch();
const gesamt = { grade: new Map(), luft: new Map(), radien: new Map(), farben: new Map() };
let quetschen = 0;

for (const [breite, hoehe] of [[1440, 900], [390, 844]]) {
  console.log(`\n══ ${breite} × ${hoehe} ${breite < 760 ? "(mobil)" : ""} ══════════════════════════════`);
  const ctx = await browser.newContext({ viewport: { width: breite, height: hoehe } });
  const page = await ctx.newPage();
  for (const pfad of SEITEN) {
    try {
      await page.goto(BASE + pfad, { waitUntil: "networkidle", timeout: 120000 });
    } catch { console.log(`   ⚠ ${pfad} lädt nicht`); continue; }
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(700);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    const d = await page.evaluate(SAMMLER);
    for (const k of ["grade", "luft", "radien", "farben"])
      for (const x of d[k]) gesamt[k].set(x.wert, (gesamt[k].get(x.wert) || 0) + x.n);
    console.log(`\n── ${pfad} ──`);
    console.log(`   Schriftgrade ${d.grade.length} · Abstände ${d.luft.length} · Radien ${d.radien.length} · Farben ${d.farben.length}`);
    if (d.quetsch.length) {
      quetschen += d.quetsch.length;
      const nach = {};
      for (const q of d.quetsch) (nach[q.art] ||= []).push(q);
      for (const [art, liste] of Object.entries(nach)) {
        console.log(`   ✗ ${liste.length} × ${art}`);
        for (const q of liste.slice(0, 8)) console.log(`       ${q.wo}\n         „${q.text}"  ist ${q.ist} / soll ${q.soll}`);
        if (liste.length > 8) console.log(`       … und ${liste.length - 8} weitere`);
      }
    } else console.log("   ✓ nichts gequetscht");
  }
  await ctx.close();
}
await browser.close();

console.log("\n══ Über alle Seiten und Breiten ══════════════════════════════");
for (const k of ["grade", "luft", "radien", "farben"]) {
  const l = [...gesamt[k].entries()].sort((a, b) => b[1] - a[1]);
  console.log(`\n${k}: ${l.length} verschiedene`);
  console.log("   " + l.slice(0, 22).map(([w, n]) => `${w}×${n}`).join("  "));
  if (l.length > 22) console.log("   … " + l.slice(22).map(([w]) => w).join("  "));
}
console.log(`\nGequetschte Stellen insgesamt: ${quetschen}`);
process.exit(quetschen > 0 ? 1 : 0);
