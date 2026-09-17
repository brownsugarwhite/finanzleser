/**
 * Solitär — Brett, Züge und Bewertung.
 *
 * Vorlage: `Finanzleser Solitär - Rätselseite.dc.html` (Handoff „Finanzleser Chat-Design
 * Phase 2_solitär", 17.09.2026). Diese Datei trägt alles, was sich ohne React sagen
 * lässt; das Spiel steht in `components/faden/spiele/Solitaer.tsx`, sein Aussehen in
 * `app/solitaer.css`.
 *
 * 🚨 Hier stand bis zum 17.09.2026 eine andere Fassung: Murmeln als Halbtonraster aus
 * SVG-Kreisen, mit Sprungparabel, Spielraum-Kurve und rechnendem Tipp. Sie ist ersetzt,
 * nicht ergänzt — die neue Vorlage baut die Murmel als Glaskörper aus CSS-Verläufen und
 * das Brett als Prozentraster ohne SVG. Wer die alte Fassung sucht: `git log lib/faden/solitaer.ts`.
 *
 * ── Die drei Bretter ────────────────────────────────────────────────────────────────
 * Alle drei sind nachgerechnet (Löser, 17.09.2026):
 *
 *   englisch    7 × 7 ohne die vier 2 × 2-Ecken, 33 Löcher, 32 Murmeln.
 *               Mitte leer → auf EINE Murmel in der Mitte lösbar (31 Züge, nachgespielt).
 *   europäisch  zusätzlich die vier Diagonalfelder, 37 Löcher, 36 Murmeln.
 *   dreieck     fünf Reihen, 15 Löcher, 14 Murmeln — das Einsteigerbrett.
 *               Spitze leer → auf eine Murmel lösbar, und zwar NUR in der Spitze selbst.
 *
 * 🚨 Das Dreieck steht auf einem DREIECKSGITTER: sechs Sprungrichtungen statt vier, und
 * die Reihen sind um eine halbe Zelle gegeneinander versetzt. Alles, was nach Geometrie
 * fragt — Richtungen, Rasterweite, Lage eines Lochs — geht deshalb über `art`.
 *
 * 🚨 Ein „kleines Kreuz" (5 × 5 ohne Ecken, 21 Löcher) lag als Einsteigerbrett nahe und
 * ist genau daran gescheitert: es lässt sich NIE auf eine Murmel bringen, es bleiben
 * mindestens vier. Ein Brett, das man nicht gewinnen kann, ist kein leichtes Brett.
 */

export type Brettart = "englisch" | "europäisch" | "dreieck";
export type Zelle = { r: number; c: number };
export type Murmel = { id: number; r: number; c: number; weg: boolean; faellt: boolean; rot: number };
/** Ein Sprung: Murmel `id` springt über `mid` auf (r, c). */
export type Zug = { id: number; mid: number; r: number; c: number };
export type Ergebnis = { n: number; mitte: boolean };

export const MITTE = 3;

/** Die Wahl, die im Spiel angeboten wird — Name, Kurzform, Lochzahl. */
export const BRETTER: { art: Brettart; name: string; loecher: number }[] = [
  { art: "englisch", name: "Englisch", loecher: 33 },
  { art: "europäisch", name: "Europäisch", loecher: 37 },
  { art: "dreieck", name: "Dreieck", loecher: 15 },
];

/** Das Loch, das zu Beginn frei bleibt — und in dem die letzte Murmel stehen soll. */
export const zielLoch = (art: Brettart): Zelle => (art === "dreieck" ? { r: 0, c: 0 } : { r: MITTE, c: MITTE });

/** Sprungrichtungen: vier auf dem Quadratgitter, sechs auf dem Dreiecksgitter. */
const RICHTUNGEN: Record<"quadrat" | "dreieck", [number, number][]> = {
  quadrat: [[1, 0], [-1, 0], [0, 1], [0, -1]],
  dreieck: [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, -1]],
};

/**
 * Rasterweite und Murmelgröße je Brett, in ZELLEN.
 *
 * Das Brett ist immer ein Quadrat und immer prozentual besetzt; nur die Zahl der Zellen
 * ändert sich. Die Murmel behält ihren Anteil an der Zelle (0,728), damit sie auf dem
 * Dreieck nicht plötzlich verloren wirkt — 15 Murmeln auf derselben Fläche wie 33
 * brauchen mehr Durchmesser, nicht mehr Luft.
 */
const MURMEL_JE_ZELLE = 0.728;
export function raster(art: Brettart) {
  const spalten = art === "dreieck" ? 5 : 7;
  return { spalten, zelle: 100 / spalten, murmel: (100 / spalten) * MURMEL_JE_ZELLE };
}

/** Lage eines Lochs im Brett, in Prozent — die einzige Stelle, die Geometrie kennt. */
export function platz(art: Brettart, r: number, c: number): { left: string; top: string } {
  const { spalten } = raster(art);
  let sx: number;
  let sy: number;
  if (art === "dreieck") {
    // Reihe r trägt r+1 Löcher, um eine halbe Zelle nach rechts gerückt je Reihe weniger.
    // Die Höhe einer Dreiecksreihe ist √3/2 einer Zelle; der Satz wird darin zentriert.
    const hoch = Math.sqrt(3) / 2;
    sx = 0.5 + c + (4 - r) / 2;
    sy = (spalten - (4 * hoch + 1)) / 2 + 0.5 + r * hoch;
  } else {
    sx = c + 0.5;
    sy = r + 0.5;
  }
  return { left: `${(sx / spalten * 100).toFixed(3)}%`, top: `${(sy / spalten * 100).toFixed(3)}%` };
}

/** Gehört (r, c) zum Brett? */
export function gueltig(art: Brettart, r: number, c: number): boolean {
  if (art === "dreieck") return r >= 0 && r <= 4 && c >= 0 && c <= r;
  if (r < 0 || c < 0 || r > 6 || c > 6) return false;
  if (art === "europäisch") {
    // Die Raute des europäischen Bretts: alles im Abstand 4, ohne die Spitzen der Arme.
    const dr = Math.abs(r - MITTE);
    const dc = Math.abs(c - MITTE);
    return dr + dc <= 4 && dr <= 3 && dc <= 3 && !(dr === 3 && dc >= 2) && !(dc === 3 && dr >= 2);
  }
  return (r >= 2 && r <= 4) || (c >= 2 && c <= 4);
}

export function zellen(art: Brettart): Zelle[] {
  const aus: Zelle[] = [];
  const n = art === "dreieck" ? 5 : 7;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (gueltig(art, r, c)) aus.push({ r, c });
  return aus;
}

/** Die Murmel auf einem Feld — geschlagene zählen nicht mit. */
export function bei(murmeln: Murmel[], r: number, c: number): Murmel | undefined {
  return murmeln.find((m) => !m.weg && m.r === r && m.c === c);
}

/** Alle Sprünge, die diese eine Murmel gerade machen kann. */
export function zuegeFuer(art: Brettart, m: Murmel, murmeln: Murmel[]): Zug[] {
  const aus: Zug[] = [];
  if (m.weg) return aus;
  for (const [dr, dc] of RICHTUNGEN[art === "dreieck" ? "dreieck" : "quadrat"]) {
    const mitte = bei(murmeln, m.r + dr, m.c + dc);
    const r = m.r + 2 * dr;
    const c = m.c + 2 * dc;
    if (mitte && gueltig(art, r, c) && !bei(murmeln, r, c)) aus.push({ id: m.id, mid: mitte.id, r, c });
  }
  return aus;
}

export function alleZuege(art: Brettart, murmeln: Murmel[]): Zug[] {
  return murmeln.flatMap((m) => zuegeFuer(art, m, murmeln));
}

/**
 * Die Ausgangsstellung: alle Löcher belegt außer der Mitte.
 *
 * `rot` ist der Winkel des Katzenauges — `(i · 47) mod 140 − 70`. Die 47 ist teilerfremd
 * zu 140, deshalb liegt keine zweite Murmel im selben Winkel wie ihre Nachbarin, und das
 * Brett sieht aus wie eine Handvoll echter Murmeln statt wie ein Stempelmuster.
 */
export function aufstellen(art: Brettart): Murmel[] {
  const leer = zielLoch(art);
  return zellen(art)
    .filter((z) => !(z.r === leer.r && z.c === leer.c))
    .map((z, i) => ({ id: i, r: z.r, c: z.c, weg: false, faellt: false, rot: ((i * 47) % 140) - 70 }));
}

/** Abstand zum Startloch — gibt beim Aufstellen den Takt, in dem die Murmeln fallen.
    Auf dem Quadrat ist das der Ring um die Mitte, auf dem Dreieck die Reihe unter der
    Spitze; beide Male rieseln die Murmeln von innen nach außen ins Brett. */
export const ringAbstand = (art: Brettart, r: number, c: number) =>
  art === "dreieck" ? r : Math.max(Math.abs(r - MITTE), Math.abs(c - MITTE));

/* ── Die Bewertung ────────────────────────────────────────────────────────────────
   Die Punktwerte sind die Vorschläge des Handoffs („an die Stempelkarte anzupassen").
   🚨 Eine Stempelkarte gibt es im Repo noch nicht — die Zeile wird gezeigt, aber nichts
   gutgeschrieben. Sobald es sie gibt, ist `punkte` der einzige Anknüpfungspunkt. */
export type Bewertung = {
  geloest: boolean;
  stempel: "Perfekt" | "Gelöst" | "Festgefahren";
  /** Der Stempel und der Rang stehen in Grün, wenn das Spiel gelöst ist. */
  gruen: boolean;
  rang: string;
  text: string;
  punkte: string;
};

export function bewerten(f: Ergebnis, art: Brettart = "englisch"): Bewertung {
  const geloest = f.n === 1;
  const gruen = geloest;
  // Auf dem Dreieck ist das Ziel nicht die Mitte, sondern die Spitze — dasselbe Loch,
  // das zu Beginn frei war. Der Text muss das sagen, sonst sucht der Leser eine Mitte.
  const ort = art === "dreieck" ? "in der Spitze" : "in der Mitte";
  if (f.n === 1 && f.mitte) return { geloest, gruen, stempel: "Perfekt", rang: "Experte · Perfekt", text: `Die eine Murmel, genau ${ort}. Das schaffen die wenigsten.`, punkte: "+30 Punkte" };
  if (f.n === 1) return { geloest, gruen, stempel: "Gelöst", rang: "Experte", text: `Eine Murmel übrig – nur nicht ${ort}. Fast die schönste Lösung.`, punkte: "+20 Punkte" };
  if (f.n === 2) return { geloest, gruen, stempel: "Festgefahren", rang: "Kenner", text: "Zwei Murmeln übrig. Sehr gut – die letzte ist die schwerste.", punkte: "+10 Punkte" };
  if (f.n <= 4) return { geloest, gruen, stempel: "Festgefahren", rang: "Leser", text: `${f.n} Murmeln übrig. Beim nächsten Mal eine weniger?`, punkte: "+5 Punkte" };
  return { geloest, gruen, stempel: "Festgefahren", rang: "Festgefahren", text: `${f.n} Murmeln übrig und kein Zug mehr. Aufstellen und noch einmal.`, punkte: "" };
}
