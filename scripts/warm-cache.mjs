/**
 * Cache-Warming für das Netlify-Frontend.
 *
 * Problem: Wenn der Build wegen IONOS-Flakiness nicht alle Seiten prerendert,
 * werden die fehlenden beim ERSTEN Besuch on-demand erzeugt (4–9 s, blockierender
 * WP-Fetch). Dieses Script ruft nach dem Deploy einmal alle URLs aus der Sitemap auf
 * → Netlix generiert/cacht sie vorab → der erste echte Besucher bekommt warme Seiten.
 *
 * Nutzung:
 *   node scripts/warm-cache.mjs [BASE_URL] [--concurrency=6]
 *   BASE_URL default: $WARM_BASE | $DEPLOY_PRIME_URL | $URL | finanzleser-staging.netlify.app
 *
 * Quelle der URLs: <BASE>/sitemap.xml (die <loc>-Pfade, Host auf BASE umgebogen).
 */

const DEFAULT_BASE = "https://finanzleser-staging.netlify.app";

export async function warm(baseInput, opts = {}) {
  const base = (baseInput || DEFAULT_BASE).replace(/\/$/, "");
  const concurrency = opts.concurrency ?? 6;
  const perRequestTimeoutMs = opts.timeoutMs ?? 20000;

  const paths = await loadSitemapPaths(base);
  // Landing immer mit aufnehmen.
  if (!paths.includes("/")) paths.unshift("/");

  const stats = { total: paths.length, ok: 0, cold: 0, warm: 0, failed: 0 };
  const t0 = Date.now();
  console.log(`[warm] ${stats.total} URLs auf ${base} (concurrency ${concurrency})`);

  let idx = 0;
  async function worker() {
    while (idx < paths.length) {
      const i = idx++;
      const p = paths[i];
      const url = `${base}${p}`;
      let done = false;
      for (let attempt = 0; attempt < 2 && !done; attempt++) {
        try {
          const res = await fetchWithTimeout(url, perRequestTimeoutMs);
          const cs = res.headers.get("cache-status") || "";
          const nextMiss = /"Next\.js"[^,]*fwd=miss/i.test(cs);
          if (res.ok) {
            stats.ok++;
            if (nextMiss) stats.cold++; else stats.warm++;
            done = true;
          } else if (attempt === 1) {
            stats.failed++;
            console.warn(`[warm] ${res.status} ${p}`);
          }
        } catch (e) {
          if (attempt === 1) {
            stats.failed++;
            console.warn(`[warm] FAIL ${p} — ${e?.message || e}`);
          } else {
            await new Promise((r) => setTimeout(r, 600));
          }
        }
      }
      if ((stats.ok + stats.failed) % 50 === 0) {
        console.log(`[warm] ${stats.ok + stats.failed}/${stats.total} …`);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(
    `[warm] fertig in ${secs}s — ok=${stats.ok} (kalt-erzeugt=${stats.cold}, schon-warm=${stats.warm}), fehlgeschlagen=${stats.failed}`
  );
  return stats;
}

async function loadSitemapPaths(base) {
  const res = await fetchWithTimeout(`${base}/sitemap.xml`, 30000);
  if (!res.ok) throw new Error(`sitemap.xml → HTTP ${res.status}`);
  const xml = await res.text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const paths = new Set();
  for (const loc of locs) {
    try {
      paths.add(new URL(loc).pathname);
    } catch {
      /* ignore */
    }
  }
  return [...paths];
}

async function fetchWithTimeout(url, ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    // Kein Body nötig — wir wollen nur den Server-Render/Cache triggern.
    return await fetch(url, { signal: ctrl.signal, headers: { "user-agent": "finanzleser-cache-warmer" } });
  } finally {
    clearTimeout(t);
  }
}

// CLI
const isCli = import.meta.url === `file://${process.argv[1]}`;
if (isCli) {
  const args = process.argv.slice(2);
  const baseArg = args.find((a) => !a.startsWith("--"));
  const concArg = args.find((a) => a.startsWith("--concurrency="));
  const base = baseArg || process.env.WARM_BASE || process.env.DEPLOY_PRIME_URL || process.env.URL;
  const concurrency = concArg ? parseInt(concArg.split("=")[1], 10) : undefined;
  warm(base, { concurrency })
    .then((s) => process.exit(s.failed > 0 ? 0 : 0)) // Warming-Fehler sollen den Deploy nicht kippen
    .catch((e) => {
      console.error("[warm] Abbruch:", e?.message || e);
      process.exit(0);
    });
}
