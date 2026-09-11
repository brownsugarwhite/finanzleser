/**
 * Wie ein Spiel im Beitrag gesetzt wird: allein über die volle Breite, neben einer
 * Anzeige, oder als Paar neben einem zweiten Spiel.
 *
 * 🚨 Diese Entscheidung gehört ins Datenmodell, nicht in den Render. `InselnBeleben` baut
 * eingefrorene Kapitel aus der Insel-Nutzlast wieder auf; entstünde die Seite (links oder
 * rechts) beim Rendern aus einem Laufindex, sähe ein wiederbelebtes Kapitel anders aus als
 * beim ersten Mal.
 *
 * Alles hier ist rein: kein Math.random, kein Date, keine Fensterbreite. Der Startpunkt
 * kommt aus dem Slug des Beitrags — so variiert die Abfolge zwischen den Beiträgen, bleibt
 * innerhalb eines Beitrags aber über Server und Client identisch. Es gibt nichts zu
 * hydrieren.
 */

export type SpielForm = "voll" | "anzeige-rechts" | "anzeige-links" | "paar";

export interface SpielSatz {
  form: SpielForm;
  /** Welches Anzeigenmotiv — damit zwei Anzeigen im selben Beitrag nicht dasselbe zeigen. */
  anzeigeNr: number;
}

/**
 * Die Abfolge. Sechs Schritte, damit sich das Muster bei den üblichen zwei bis vier
 * Spielen je Beitrag nicht wiederholt.
 */
const MUSTER: SpielForm[] = ["voll", "anzeige-rechts", "voll", "anzeige-links", "anzeige-rechts", "voll"];

/** Höchstens so viele Anzeigen-Paarungen je Beitrag — sonst bekäme die Werbung mehr Platz als der Text. */
const MAX_ANZEIGEN = 2;

/** Stabiler Summenhash über den Slug. Gleiche Eingabe, gleicher Startpunkt. */
export function saat(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return h % MUSTER.length;
}

/**
 * Satzformen für alle Spiele eines Beitrags, in Dokumentreihenfolge.
 *
 * `nachbarn[i] === true` heißt: unmittelbar nach Spiel i folgt ein weiteres Spiel, ohne
 * Text dazwischen. Die beiden werden dann ein Paar und teilen sich die Zeile.
 */
export function satzFolge(anzahl: number, nachbarn: boolean[], slug: string): SpielSatz[] {
  const start = saat(slug);
  const raus: SpielSatz[] = [];
  let anzeigen = 0;
  for (let i = 0; i < anzahl; i++) {
    // Zwei Spiele hintereinander stehen nebeneinander — das ist die Rätselseite des
    // Handoffs (Zeile 1043) und braucht keine Anzeige dazwischen.
    if (nachbarn[i]) { raus.push({ form: "paar", anzeigeNr: 0 }); continue; }
    if (i > 0 && raus[i - 1]?.form === "paar") { raus.push({ form: "paar", anzeigeNr: 0 }); continue; }
    const gewuenscht = MUSTER[(i + start) % MUSTER.length];
    const form = gewuenscht !== "voll" && anzeigen >= MAX_ANZEIGEN ? "voll" : gewuenscht;
    if (form !== "voll") anzeigen++;
    raus.push({ form, anzeigeNr: anzeigen });
  }
  return raus;
}
