/**
 * Medien-URLs des Klons auf die öffentlichen Dateien umschreiben.
 *
 * cms-dev.finanzleser.de liegt hinter Basic-Auth; /graphql und /wp-json sind
 * ausgenommen, /wp-content nicht. Die Uploads des Klons sind mit denen von
 * cms.finanzleser.de identisch (tools/clone-cms.sh symlinkt sie), deshalb zeigen
 * Bilder und PDFs auf den öffentlichen Host. tools/faden-export.mjs macht dasselbe.
 *
 * Aktiv nur, wenn WORDPRESS_API_URL auf den Klon zeigt; sonst Durchreichen.
 * Überschreibbar per MEDIEN_HOST (z. B. für einen zweiten Klon).
 */
const KLON_HOSTS = ["cms-dev.finanzleser.de"];

function zielHost(): string | null {
  const api = process.env.WORDPRESS_API_URL || "";
  const aktiv = KLON_HOSTS.some((h) => api.includes(h));
  if (!aktiv) return null;
  return process.env.MEDIEN_HOST || "cms.finanzleser.de";
}

/** Eine einzelne URL (Bild, PDF) auf den öffentlichen Medien-Host umschreiben. */
export function medienUrl<T extends string | null | undefined>(url: T): T {
  if (!url) return url;
  const ziel = zielHost();
  if (!ziel) return url;
  let out: string = url;
  for (const h of KLON_HOSTS) {
    out = out.split(`https://${h}/wp-content/`).join(`https://${ziel}/wp-content/`);
    out = out.split(`http://${h}/wp-content/`).join(`https://${ziel}/wp-content/`);
  }
  return out as T;
}

/** Alle Medien-Verweise in einem HTML-Fragment umschreiben (src, srcset, href, url()). */
export function medienHtml(html: string): string {
  if (!html) return html;
  const ziel = zielHost();
  if (!ziel) return html;
  let out = html;
  for (const h of KLON_HOSTS) {
    out = out.split(`https://${h}/wp-content/`).join(`https://${ziel}/wp-content/`);
    out = out.split(`http://${h}/wp-content/`).join(`https://${ziel}/wp-content/`);
  }
  return out;
}
