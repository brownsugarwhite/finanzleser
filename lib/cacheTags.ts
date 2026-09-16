/**
 * Next.js Data-Cache-Tags.
 *
 * Zweck: gezielt invalidieren statt pauschal. `revalidatePath` bustet den Route-Cache;
 * für die Data-Cache-Einträge der darin laufenden Fetches ist bei langen Intervallen
 * kein Verlass darauf. Wo Aktualität zählt, taggen wir den Fetch und der Save-Webhook
 * (app/api/revalidate) revalidiert Pfad UND Tag.
 */

/** WP-Rechner-Konfiguration (Mindestlohn, Kindergeld, BBG …) → /api/rates */
export const RECHNER_CONFIG_TAG = "rechner-config";

/**
 * Die abgeleiteten Faden-Indizes (Beiträge, Werkzeuge, Glossar) — siehe
 * lib/faden/titel.ts, werkzeugIndex.ts, glossar.ts. Sie fassen die großen Listen-Getter
 * zu kompakten Nachschlagetabellen zusammen und liegen im Data-Cache; der Save-Webhook
 * bustet sie, sobald irgendein Inhalt gespeichert wird.
 */
export const FADEN_INDEX_TAG = "faden-index";

/**
 * Der financeads-Snapshot (WP-Option `finanzleser_vergleich_daten`, gelesen über
 * lib/financeads/laden.ts). Der Refresh (tools/financeads-refresh.mjs) bustet ihn nach
 * jedem erfolgreichen Lauf über app/api/revalidate — die Vergleichsseiten holen die
 * Daten dann beim nächsten Render frisch aus WordPress, nie von financeads.
 */
export const VERGLEICH_DATEN_TAG = "vergleich-daten";
