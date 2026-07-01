// Netlify Build-Plugin: wärmt nach erfolgreichem Deploy die Edge-/ISR-Caches der
// Hub-Seiten vor (Landing, Haupt-/Subkategorien, Tool-Übersichten — siehe isHubPath
// in scripts/warm-cache.mjs; WARM_FULL=true würde die ganze Sitemap wärmen). So bekommt
// der erste echte Besucher der meistbesuchten Einstiege eine schnelle Seite, auch wenn
// der Build (IONOS-Flakiness) nicht alles prerendern konnte.
// Voraussetzung: NODE_VERSION >= 22 (Netlify-Plugin-Mindestversion), siehe netlify.toml.
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
