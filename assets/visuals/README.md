# Visuals — SVG-Master + Raster-Pipeline

Zentrale Quelle für alle Illustrations-Visuals (Titelbilder, Kategorie-Bilder, Pool-Grafiken).
**Master = SVG** (verlustfrei, beliebig skalierbar); alle Raster-Formate werden daraus generiert.

## Struktur
```
assets/visuals/
  titelbilder/<slug>.svg     Artikel-Titelbilder (slug = Artikel-/png_1920-Slug, z. B. 0007_arbeitgeberzuschuss…)
  categories/<slug>.svg      Kategorie-/Subkategorie-Visuals (cat_*, subcat_*, *_wide; „-alt" = Alternativ-Motiv)
  general/<name>.svg         Thematischer Pool (money, calculator, animal-dog, …) für Artikel ohne eigenes Bild
  _unassigned/<name>.svg      Noch keinem Artikel zugeordnet — dekorativ/Maskottchen (Dino, Kostenmonster, Checkliste …)
  manifest.json              Single Source of Truth: file, type, slug, altText, status, source{origSvg, matchedPng, matchDist}
  README.md

assets/visuals-build/        ← GENERIERT (gitignored, ~230 MB, regenerierbar). NICHT von Hand bearbeiten.
  <type>/<slug>/
    <slug>-1920.png   <slug>-728.png     transparent (Master-Raster / Mobil-Größe)
    <slug>-1920.webp  <slug>-728.webp    transparent, Q80 — Web-Auslieferung
    <slug>-1920-white.jpg                weißer Hintergrund (Social/OG, E-Mail, externe Einbettung)
    <slug>-1920-page.jpg                 Seiten-BG #faf9f6 (nahtlos auf der eigenen Seite ohne Transparenz)
```

## Neues Visual hinzufügen
1. SVG in den passenden Unterordner legen, **slug-benannt** (kleinbuchstaben, `-`/`_`, keine Umlaute/Leerzeichen/`&`).
   - Titelbild → `titelbilder/<artikel-slug>.svg` · Kategorie → `categories/…` · Pool → `general/…`.
2. Eintrag in `manifest.json` ergänzen (`file`, `type`, `slug`, `altText`, `status:"used"`).
3. `node scripts/build-visuals.mjs` — erzeugt die 6 Derivate (idempotent; nur Neues/Geändertes). `--force` erzwingt alles neu.

## Formate — wann welches
- **WebP 1920/728** → Standard-Web-Auslieferung (kleinste Datei, Transparenz).
- **PNG 1920/728** → verlustfreies Master-Raster, Transparenz, flexibler Hintergrund.
- **JPEG white** → Kontexte ohne Transparenz/WebP (Social/OG-Sharing, E-Mail).
- **JPEG page (#faf9f6)** → wenn die Grafik ohne Transparenz direkt auf dem Seiten-Hintergrund sitzen soll.

## Scripts
- `scripts/build-visuals.mjs` — **wiederverwendbar**: Derivate aus den SVG-Mastern (liest `manifest.json`).
- `scripts/match-visuals.mjs` / `scripts/organize-visuals.mjs` — **einmalige Bootstrap-Scripts**: haben die 162 Figma-Export-SVGs per Bildinhalt gegen `assets/png_1920/` abgeglichen (dHash+MSE, visuell verifiziert), umbenannt/einsortiert und dieses Manifest erzeugt. Für neue Visuals nicht mehr nötig.

## WordPress-Anbindung (Folgeschritt, separat)
Diese Pipeline bereitet Visuals nur lokal auf. Der Upload nach WordPress (Media + `featured_media`) läuft
weiterhin über `scripts/optimize-images.js` → `upload-media.js` → `assign-featured-images.js`. Die generierten
PNGs/WebPs aus `assets/visuals-build/` können dort als Quelle dienen (statt der alten `assets/png_1920/`).

## Herkunft / Status
- 162 SVG-Master gesamt: **150** entsprechen bereits genutzten Visuals (per Bildinhalt zu `png_1920` gematcht,
  `status:"used"`), **12** sind neu/dekorativ (`status:"pool"`, in `_unassigned/`) und keinem Artikel zugeordnet.
- `assets/png_1920/` bleibt als Referenz erhalten, ist aber nicht mehr die Master-Quelle.
