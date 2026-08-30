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
