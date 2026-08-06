// Google-AdSense-Konfiguration. Client/Slot sind öffentlich (stehen in ads.txt
// bzw. im ausgelieferten Markup) — deshalb Konstanten im Code, keine Secrets.
// Der Kunde liefert aktuell EINEN responsiven Anzeigenblock für alle Positionen.
export const ADSENSE_CLIENT = "ca-pub-7578368429882132";
export const ADSENSE_SLOT = "2049258663";

// Build-Flag: echte Ads nur, wenn der Netlify-Kontext (bzw. .env.local) es setzt.
// Ohne Flag rendern alle Slots exakt die bisherigen grauen Platzhalter.
export const ADSENSE_ENABLED = process.env.NEXT_PUBLIC_ADSENSE === "1";

// Testmodus (data-adtest="on") überall außer Production — gleiche env-basierte
// Staging-Erkennung wie der noindex-Header in next.config.ts.
export const ADSENSE_TEST =
  !process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL.includes("staging.");

// IAB-Standardgrößen (2026). Bei echten Ads dient h als minHeight (CLS-Schutz),
// die responsive Auto-Ad wählt ihre Höhe selbst.
export type AdFormat =
  | "billboard"
  | "superleaderboard"
  | "leaderboard"
  | "skyscraper"
  | "halfpage"
  | "rectangle"
  | "mobile";

export const AD_SIZES: Record<AdFormat, { w: number; h: number }> = {
  billboard: { w: 970, h: 250 },
  superleaderboard: { w: 970, h: 90 },
  leaderboard: { w: 728, h: 90 },
  skyscraper: { w: 160, h: 600 },
  halfpage: { w: 300, h: 600 },
  rectangle: { w: 300, h: 250 },
  mobile: { w: 320, h: 100 },
};
