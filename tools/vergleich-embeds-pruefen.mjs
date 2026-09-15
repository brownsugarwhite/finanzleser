#!/usr/bin/env node
/**
 * Prüft, ob die Fremd-Embeds der Vergleiche wirklich laden — vor jeder Migration und
 * in jeder Abnahme (Wunsch vom 15.09.2026: „manche laden nicht").
 *
 *   node tools/vergleich-embeds-pruefen.mjs [--cms https://cms-dev.finanzleser.de]
 *
 * Liest alle Vergleich-CPTs (öffentliche REST), entschlüsselt die Block-Config und ruft je
 * Fremdquelle die iframe-URL / das Script / die erste URL des Roh-Embeds ab: Status,
 * Größe, Content-Type, X-Frame-Options / frame-ancestors (Einbettung möglich?), Dauer.
 * financeads-Vergleiche (API) werden gezählt, nicht abgerufen — sie sind keine iframes mehr.
 * Ein Abruf per HTTP beweist nicht, dass der Rechner im Browser erscheint; dafür gibt es
 * tools/vergleich-mess.mjs. Exit 1, wenn eine Quelle nicht antwortet.
 */
const cmsArg = process.argv.indexOf("--cms");
const CMS = (cmsArg > 0 ? process.argv[cmsArg + 1] : (process.env.CMS_URL || "https://cms-dev.finanzleser.de")).replace(/\/$/, "");
const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 Chrome/128 Safari/537.36", "Accept-Language": "de", Referer: "https://www.finanzleser.de/" };

const res = await fetch(`${CMS}/wp-json/wp/v2/vergleich?per_page=100&_fields=slug,content`);
if (!res.ok) { console.error(`CMS ${CMS}: HTTP ${res.status}`); process.exit(1); }
const cpts = await res.json();

function config(html) {
  const m = (html || "").match(/data-config="([A-Za-z0-9+/=]+)"/);
  if (!m) return null;
  try { return JSON.parse(Buffer.from(m[1], "base64").toString("utf8")); } catch { return null; }
}
function quelleVon(cfg) {
  if (!cfg) return null;
  if (cfg.embedType === "financeads") return { art: "financeads" };
  if (cfg.iframeUrl) return { art: "iframe", url: cfg.iframeUrl };
  if (cfg.scriptConfig?.scriptSrc) return { art: "script", url: cfg.scriptConfig.scriptSrc };
  if (cfg.rawHtml) { const m = cfg.rawHtml.match(/(?:src|href)=["'](https?:\/\/[^"']+)/); return m ? { art: "raw", url: m[1] } : { art: "raw", url: null }; }
  return null;
}

let financeads = 0, ohne = 0, fehler = 0;
const zeilen = [];
for (const c of cpts.sort((a, b) => a.slug.localeCompare(b.slug))) {
  const q = quelleVon(config(c.content?.rendered));
  if (!q) { ohne++; zeilen.push([c.slug, "—", "KEINE QUELLE", ""]); fehler++; continue; }
  if (q.art === "financeads") { financeads++; continue; }
  if (!q.url) { zeilen.push([c.slug, q.art, "Roh-Embed ohne URL", ""]); continue; }
  const t = Date.now();
  let status = "", info = "";
  try {
    const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 20000);
    const r = await fetch(q.url, { headers: UA, redirect: "follow", signal: ctrl.signal });
    clearTimeout(timer);
    const body = await r.text();
    const sperre = [r.headers.get("x-frame-options"), (r.headers.get("content-security-policy") || "").match(/frame-ancestors[^;]*/)?.[0]].filter(Boolean).join(" ");
    status = String(r.status);
    info = `${(body.length / 1024).toFixed(0)} KB · ${(r.headers.get("content-type") || "").split(";")[0]}${sperre ? ` · 🚨 ${sperre}` : ""}`;
    if (!r.ok) fehler++;
    if (/x-frame-options/i.test(sperre) && /deny|sameorigin/i.test(sperre) && q.art === "iframe") fehler++;
  } catch (e) {
    status = "FEHLER"; info = String(e.message || e).slice(0, 60); fehler++;
  }
  zeilen.push([c.slug, `${q.art} ${new URL(q.url).host}`, status, `${info} · ${((Date.now() - t) / 1000).toFixed(1)} s`]);
  await new Promise((r) => setTimeout(r, 300));
}
console.log(`${cpts.length} Vergleich-CPTs auf ${CMS}: ${financeads} über die financeads-API, ${zeilen.length} Fremd-Embeds geprüft\n`);
for (const z of zeilen) console.log(`  ${z[0].padEnd(44)} ${z[1].padEnd(40)} ${String(z[2]).padStart(6)}  ${z[3]}`);
console.log(fehler ? `\n🚨 ${fehler} Quelle(n) auffällig — nicht ausliefern, sondern klären.` : "\n✓ Alle Fremdquellen antworten ohne Frame-Sperre.");
process.exit(fehler ? 1 : 0);
