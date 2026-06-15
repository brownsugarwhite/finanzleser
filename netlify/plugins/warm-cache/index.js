// Netlify Build-Plugin: wärmt nach erfolgreichem Deploy die Edge-/ISR-Caches vor,
// indem es einmal alle Sitemap-URLs des frisch deployten Sites aufruft. So bekommt
// der erste echte Besucher auch dann eine schnelle Seite, wenn der Build (IONOS-
// Flakiness) nicht alles prerendern konnte.
//
// Deaktivieren:  WARM_CACHE=false  (Netlify-Env)
// Concurrency:   WARM_CONCURRENCY=6 (Default)
// Hinweis: läuft im Build-Container → kostet Build-Minuten. Bei Bedarf abschalten.
module.exports = {
  async onSuccess() {
    if (process.env.WARM_CACHE === "false") {
      console.log("[warm-cache] übersprungen (WARM_CACHE=false)");
      return;
    }
    const base = process.env.DEPLOY_PRIME_URL || process.env.URL;
    if (!base) {
      console.log("[warm-cache] keine Deploy-URL gefunden — übersprungen");
      return;
    }
    try {
      const { warm } = await import("../../../scripts/warm-cache.mjs");
      await warm(base, { concurrency: Number(process.env.WARM_CONCURRENCY) || 6 });
    } catch (e) {
      // Warming-Fehler dürfen den Deploy NICHT kippen.
      console.warn("[warm-cache] Fehler (Deploy unbeeinträchtigt):", (e && e.message) || e);
    }
  },
};
