/**
 * Solitär — die Bretter, die Züge und die Halbton-Murmel.
 *
 * Wie `lib/faden/schlange.ts` trägt diese Datei alles, was sich ohne React sagen lässt:
 * Geometrie, Regelwerk, Zeichenvorschrift. Das Spiel steht in
 * `components/faden/spiele/Solitaer.tsx`, sein Aussehen in `app/solitaer.css`.
 *
 * ── Die Murmel ───────────────────────────────────────────────────────────────────────
 * Eine Murmel ist keine Scheibe mit Verlauf, sondern eine GEDRUCKTE Kugel: ein
 * Halbtonraster aus lauter Kreisen, deren Größe die Beleuchtung trägt. Groß im Schatten,
 * winzig im Licht, weg im Glanzpunkt. Damit besteht das ganze Brett aus einer einzigen
 * Grundform — dem Kreis — und sieht trotzdem plastisch aus. Das Raster steht wie im
 * Zeitungsdruck auf 45°.
 *
 * 🚨 Die Deckung ist FLÄCHENTREU: `r = halbeTeilung · √Deckung`. Wer den Halbmesser
 * stattdessen linear an die Helligkeit hängt, bekommt eine Kugel, die in der Mitte
 * ausgewaschen und am Rand verstopft ist — der Druckfehler, den jede Rasterweite kennt.
 *
 * ── Die Drehung ──────────────────────────────────────────────────────────────────────
 * Eine gewählte Murmel DREHT sich. Gedreht wird aber nicht das Raster, sondern die
 * MASERUNG: die Punkte bleiben, wo sie sind, und nur ihre Deckung wird von einem Muster
 * moduliert, das auf der Kugelfläche sitzt. Jeder Punkt kennt seine Länge und Breite
 * (`lon`, `lat`) auf der Kugel; die Länge wandert mit dem Drehwinkel, und weil sich die
 * Länge am Rand viel schneller ändert als in der Mitte, staucht sich das Muster genau
 * dort — die Verkürzung, an der das Auge eine Drehung erkennt.
 *
 * 🚨 Zwei Irrwege, beide ausprobiert und beide falsch:
 *
 *  1. **Zweite Rasterlage, langsam gedreht (Moiré).** Zwei Raster übereinander sind kein
 *     Glanz, sondern Unruhe — das Grundraster der Murmel verschwand darin.
 *  2. **Das Raster als Punktwolke auf der Kugel wirklich drehen.** Klingt richtig, ergibt
 *     aber einen RING: ein Gitter, das auf dem PAPIER gleichmäßig liegt, liegt auf der
 *     KUGEL nicht gleichmäßig — zur Silhouette hin deckt derselbe Papierfleck immer mehr
 *     Kugelfläche ab. Nach einer Vierteldrehung sitzen deshalb alle dichten Punkte am
 *     Rand und die Mitte ist leer. Wer die Wolke dreht, braucht ein kugelgleichmäßiges
 *     Gitter — und hat dann nicht mehr das Halbtonraster, das die Murmel ausmacht.
 *
 * Die Maserung ist außerdem umsonst zu haben: die Punkte behalten ihren Platz, je Bild
 * ändert sich nur ihr Halbmesser. Ein Schreibvorgang je Punkt statt dreier.
 *
 * Die Stärke fährt beim Anfassen von 0 hoch. Bei Stärke 0 steht exakt das ruhende Bild
 * da — der Übergang vom Liegen zum Drehen hat deshalb keinen Sprung.
 *
 * ── Die Bretter ──────────────────────────────────────────────────────────────────────
 * Zwei, und beide sind nachgerechnet (Löser, 17.09.2026):
 *
 *   Kreuz 33    Mitte leer  → auf EINE Murmel in der Mitte lösbar (31 Züge, nachgespielt).
 *   Dreieck 15  Spitze leer → auf eine lösbar, und zwar NUR in der Spitze selbst.
 *
 * 🚨 Ein drittes, „leichteres" Brett lag nahe und ist genau daran gescheitert: 5 × 5 ohne
 * Ecken (21 Löcher, Mitte leer) lässt sich NIE auf eine Murmel bringen — es bleiben
 * mindestens vier übrig. Ein Brett, das man nicht gewinnen kann, ist kein leichtes Brett.
 */

export type Loch = { x: number; y: number };
export type Zug = { von: number; ueber: number; nach: number };
export type Punkt = { x: number; y: number; r: number };
/** Ein Rasterpunkt mit seinem Ort auf der Kugel — Grundlage der Maserung. */
export type Drehpunkt = { x: number; y: number; lon: number; lat: number; grund: number };
export type BrettName = "kreuz" | "dreieck";

export type Brett = {
  name: BrettName;
  titel: string;
  loecher: Loch[];
  zuege: Zug[];
  /** Maße des viewBox — jedes Brett bringt seinen eigenen Zuschnitt mit. */
  breite: number;
  hoehe: number;
  radius: number;
  /** Das Halbtonraster EINER Murmel, in Bretteinheiten um (0,0). */
  schirm: Punkt[];
  /** Dieselben Punkte mit Länge und Breite auf der Kugel — für die Drehung. */
  wolke: Drehpunkt[];
  /** Loch, das zu Beginn frei bleibt. */
  leer: number;
  /** Loch, in dem die letzte Murmel stehen muss, damit es ein Meisterstück ist. */
  ziel: number;
};

/* ── Maße ───────────────────────────────────────────────────────────────────────────
   Alles hängt am Lochabstand. Die Murmel ist 0,39 davon — dicht genug, dass das Brett
   voll aussieht, und weit genug, dass zwischen zwei Murmeln Papier bleibt. */
const RADIUS_ANTEIL = 0.39;
const RAND_ANTEIL = 0.95;

/* ── Das Halbtonraster ──────────────────────────────────────────────────────────────
   Licht von links oben, wie bei jeder gedruckten Kugel. Die Zahlen sind gemessen, nicht
   geraten: mit flacherem Licht verliert die Murmel ihre Rundung, mit steilerem wird sie
   eine Scheibe mit Fleck. */
const LICHT = einheit(-0.42, -0.52, 0.745);
const BLICK: [number, number, number] = [0, 0, 1];
const HALB = einheit(LICHT[0] + BLICK[0], LICHT[1] + BLICK[1], LICHT[2] + BLICK[2]);

const RASTER_WINKEL = (45 * Math.PI) / 180;   /* die Rasterweite des Schwarzauszugs */
const RASTER_WEITE = 1 / 5.4;                 /* Punktabstand, als Anteil des Halbmessers */
const GLANZ_HAERTE = 18;
const KANTE = 5;                              /* wie scharf der Rand nachdunkelt */

/** Drei Nachkommastellen — mehr trägt kein SVG-Attribut, und weniger sieht man. */
const rund = (n: number) => Math.round(n * 1000) / 1000;

function einheit(x: number, y: number, z: number): [number, number, number] {
  const l = Math.hypot(x, y, z) || 1;
  return [x / l, y / l, z / l];
}

/**
 * Das Raster einer Murmel: Punkte auf einem um 45° gedrehten Gitter, Fläche nach Deckung.
 * Die Reihenfolge ist von innen nach außen sortiert — so kann das Zerstäuben beim
 * Geschlagenwerden von der Mitte her laufen, ohne dass jemand nachsortieren muss.
 */
/** Die Gitterpunkte des 45°-Rasters innerhalb der Scheibe, in Bretteinheiten. */
function gitter(radius: number): { x: number; y: number; d: number }[] {
  const weite = radius * RASTER_WEITE;
  const reichweite = Math.ceil(radius / weite) + 1;
  const sin = Math.sin(RASTER_WINKEL);
  const cos = Math.cos(RASTER_WINKEL);
  const aus: { x: number; y: number; d: number }[] = [];
  for (let a = -reichweite; a <= reichweite; a++) {
    for (let b = -reichweite; b <= reichweite; b++) {
      const x = (a * cos - b * sin) * weite;
      const y = (a * sin + b * cos) * weite;
      const d = Math.hypot(x, y) / radius;
      if (d > 1.05) continue;
      aus.push({ x, y, d });
    }
  }
  return aus;
}

/**
 * Die Deckung an einer Stelle der Kugel: Grundhelligkeit, Streulicht, Glanz — gedeckelt,
 * damit auch im hellsten Fleck ein Punkt stehen bleibt (ohne Deckel bekommt die Murmel
 * ein Loch). Dazu der Anzug am Rand, damit sie eine Silhouette hat.
 *
 * 🚨 Der weiche Saum ist das, was die Murmel RUND macht. Ohne ihn endet das Raster an
 * einer harten Kante, und weil das Gitter auf 45° steht, ist diese Kante ein Achteck —
 * 33 Achtecke auf dem Brett, und keiner weiß, warum es klemmt.
 */
function deckungAn(nx: number, ny: number, nz: number, d: number): number {
  const streu = Math.max(0, nx * LICHT[0] + ny * LICHT[1] + nz * LICHT[2]);
  const glanz = Math.pow(Math.max(0, nx * HALB[0] + ny * HALB[1] + nz * HALB[2]), GLANZ_HAERTE);
  const hell = Math.min(0.95, 0.12 + 0.6 * streu + 0.3 * glanz);
  const saum = Math.min(1, Math.max(0, (1.03 - d) / (0.9 * RASTER_WEITE)));
  return Math.min(1, Math.max(0, 1 - hell) + 0.3 * Math.pow(d, KANTE)) * saum;
}

const punktHalbmesser = (deckung: number, weite: number) => (weite / 2) * Math.sqrt(deckung) * 1.24;

/**
 * Das Raster einer ruhenden Murmel. Die Reihenfolge ist von innen nach außen sortiert —
 * so läuft das Zerstäuben der geschlagenen Murmel von der Mitte her, ohne dass jemand
 * nachsortieren muss.
 */
export function murmelSchirm(radius: number): Punkt[] {
  const weite = radius * RASTER_WEITE;
  const aus: Punkt[] = [];
  for (const { x, y, d } of gitter(radius)) {
    const z = Math.sqrt(Math.max(0, 1 - d * d));
    const r = punktHalbmesser(deckungAn(x / radius, y / radius, z, d), weite);
    if (r < weite * 0.04) continue;
    aus.push({ x: rund(x), y: rund(y), r: rund(r) });
  }
  return aus.sort((p, q) => Math.hypot(p.x, p.y) - Math.hypot(q.x, q.y));
}

/* ── Die Maserung ───────────────────────────────────────────────────────────────────
   Zwei Wellen über Länge und Breite, gegeneinander versetzt: das ergibt Schlieren, die
   sich winden, statt Streifen, die ringeln. Eine Murmel hat Schlieren. */
/* 🚨 Die Ausschläge sind bewusst klein. Bei .34/.22 lag auf der Lichtseite der Murmel
   plötzlich ein dunkler Fleck — die Maserung überstimmte das Licht, und aus der Kugel
   wurde eine gemusterte Scheibe. Das Muster darf die Modellierung TÖNEN, nicht schlagen. */
const MASER = (lon: number, lat: number) =>
  0.26 * Math.sin(3 * lon + 2 * lat) + 0.15 * Math.sin(5 * lon - 1.5 * lat + 0.8);

/** Dieselben Punkte wie `murmelSchirm`, dazu ihr Ort auf der Kugel und ihre Ruhedeckung. */
export function drehWolke(radius: number): Drehpunkt[] {
  const weite = radius * RASTER_WEITE;
  const aus: Drehpunkt[] = [];
  for (const { x, y, d } of gitter(radius)) {
    const z = Math.sqrt(Math.max(0, 1 - d * d));
    const nx = x / radius;
    const ny = y / radius;
    const grund = deckungAn(nx, ny, z, d);
    if (punktHalbmesser(grund, weite) < weite * 0.04) continue;   // dieselbe Schwelle wie im Ruhebild
    aus.push({ x: rund(x), y: rund(y), lon: Math.atan2(nx, z), lat: Math.asin(Math.min(1, Math.max(-1, ny))), grund });
  }
  return aus.sort((p, q) => Math.hypot(p.x, p.y) - Math.hypot(q.x, q.y));
}

/**
 * Die Halbmesser der Punkte bei Drehwinkel `winkel`. `staerke` fährt die Maserung hoch
 * (0 = Ruhebild). Positionen ändern sich nie — deshalb gibt es hier nur Zahlen zurück.
 */
export function drehBild(wolke: Drehpunkt[], radius: number, winkel: number, staerke: number): number[] {
  const weite = radius * RASTER_WEITE;
  const aus: number[] = new Array(wolke.length);
  for (let i = 0; i < wolke.length; i++) {
    const p = wolke[i];
    const deckung = Math.min(1, Math.max(0, p.grund * (1 + staerke * MASER(p.lon + winkel, p.lat))));
    aus[i] = punktHalbmesser(deckung, weite);
  }
  return aus;
}

/* ── Die Bretter ───────────────────────────────────────────────────────────────────── */

/** Züge aus einem Gitter: für jede Richtung Nachbar und Loch dahinter. */
function zuegeBauen(schluessel: string[], richtungen: [number, number][], zelle: (i: number) => [number, number]): Zug[] {
  const platz = new Map(schluessel.map((s, i) => [s, i]));
  const aus: Zug[] = [];
  for (let i = 0; i < schluessel.length; i++) {
    const [a, b] = zelle(i);
    for (const [da, db] of richtungen) {
      const ueber = platz.get(`${a + da},${b + db}`);
      const nach = platz.get(`${a + 2 * da},${b + 2 * db}`);
      if (ueber !== undefined && nach !== undefined) aus.push({ von: i, ueber, nach });
    }
  }
  return aus;
}

/** Das englische Kreuz: 7 × 7 ohne die vier 2 × 2-Ecken, 33 Löcher. */
function bauKreuz(): Brett {
  const T = 10;
  const rand = T * RAND_ANTEIL;
  const muster = ["..XXX..", "..XXX..", "XXXXXXX", "XXXXXXX", "XXXXXXX", "..XXX..", "..XXX.."];
  const gitter: [number, number][] = [];
  muster.forEach((zeile, y) => [...zeile].forEach((z, x) => { if (z === "X") gitter.push([x, y]); }));
  const schluessel = gitter.map(([x, y]) => `${x},${y}`);
  const radius = T * RADIUS_ANTEIL;
  const mitte = schluessel.indexOf("3,3");
  return {
    name: "kreuz",
    titel: "Kreuz",
    loecher: gitter.map(([x, y]) => ({ x: rund(rand + x * T), y: rund(rand + y * T) })),
    zuege: zuegeBauen(schluessel, [[1, 0], [-1, 0], [0, 1], [0, -1]], (i) => gitter[i]),
    breite: rund(6 * T + 2 * rand),
    hoehe: rund(6 * T + 2 * rand),
    radius: rund(radius),
    schirm: murmelSchirm(radius),
    wolke: drehWolke(radius),
    leer: mitte,
    ziel: mitte,
  };
}

/**
 * Das Dreieck: fünf Reihen, 15 Löcher, oben das freie.
 * Sechs Richtungen statt vier — auf dem Dreiecksgitter springt es auch schräg.
 */
function bauDreieck(): Brett {
  const T = 15;
  const rand = T * RAND_ANTEIL;
  const hoch = (T * Math.sqrt(3)) / 2;
  const gitter: [number, number][] = [];
  for (let r = 0; r < 5; r++) for (let c = 0; c <= r; c++) gitter.push([r, c]);
  const schluessel = gitter.map(([r, c]) => `${r},${c}`);
  const radius = T * RADIUS_ANTEIL;
  const spitze = schluessel.indexOf("0,0");
  return {
    name: "dreieck",
    titel: "Dreieck",
    loecher: gitter.map(([r, c]) => ({ x: rund(rand + (c + (4 - r) / 2) * T), y: rund(rand + r * hoch) })),
    zuege: zuegeBauen(schluessel, [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, -1]], (i) => gitter[i]),
    breite: rund(4 * T + 2 * rand),
    hoehe: rund(4 * hoch + 2 * rand),
    radius: rund(radius),
    schirm: murmelSchirm(radius),
    wolke: drehWolke(radius),
    leer: spitze,
    ziel: spitze,
  };
}

export const BRETTER: Record<BrettName, Brett> = { kreuz: bauKreuz(), dreieck: bauDreieck() };
export const BRETT_NAMEN: BrettName[] = ["kreuz", "dreieck"];

/* ── Regelwerk ─────────────────────────────────────────────────────────────────────── */

export function anfangsFeld(brett: Brett): boolean[] {
  return brett.loecher.map((_, i) => i !== brett.leer);
}

export function offeneZuege(brett: Brett, feld: boolean[]): Zug[] {
  return brett.zuege.filter((z) => feld[z.von] && feld[z.ueber] && !feld[z.nach]);
}

export function zuegeVon(brett: Brett, feld: boolean[], loch: number): Zug[] {
  return brett.zuege.filter((z) => z.von === loch && feld[z.von] && feld[z.ueber] && !feld[z.nach]);
}

export function ziehe(feld: boolean[], zug: Zug): boolean[] {
  const neu = feld.slice();
  neu[zug.von] = false;
  neu[zug.ueber] = false;
  neu[zug.nach] = true;
  return neu;
}

export const murmeln = (feld: boolean[]) => feld.reduce((s, m) => s + (m ? 1 : 0), 0);

/* ── Der Tipp ──────────────────────────────────────────────────────────────────────
   Eine Tiefensuche mit Merkliste, gemischter Zugfolge und Deckel. Findet sie eine
   Fortsetzung, die auf eine einzige Murmel führt, ist der Tipp ein Zug, der das Spiel
   noch gewinnbar lässt — sonst nur ein Zug, der überhaupt geht.

   🚨 Der Deckel ist kein Schönheitsfehler, sondern der Grund, warum das im Browser geht:
   auf vollem Brett ist die Suche aussichtslos (die Zufallssuche braucht Sekunden), mit
   jeder geschlagenen Murmel wird sie billiger. Früh im Spiel ist ohnehin fast jeder Zug
   in Ordnung — der Tipp muss dann nur zeigen, DASS es weitergeht. */
const DECKEL = 45000;
const ANLAEUFE = 4;

export function tippZug(brett: Brett, feld: boolean[]): { zug: Zug; sicher: boolean } | null {
  const offen = offeneZuege(brett, feld);
  if (!offen.length) return null;
  for (let anlauf = 0; anlauf < ANLAEUFE; anlauf++) {
    const gesehen = new Set<string>();
    let knoten = 0;
    const lauf = (stand: boolean[], zahl: number): Zug | true | null => {
      if (zahl === 1) return true;
      if (++knoten > DECKEL) return null;
      const k = stand.map((m) => (m ? "1" : "0")).join("");
      if (gesehen.has(k)) return null;
      gesehen.add(k);
      const moeglich = offeneZuege(brett, stand);
      for (let i = moeglich.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [moeglich[i], moeglich[j]] = [moeglich[j], moeglich[i]];
      }
      for (const z of moeglich) if (lauf(ziehe(stand, z), zahl - 1)) return z;
      return null;
    };
    const erster = lauf(feld, murmeln(feld));
    if (erster && erster !== true) return { zug: erster, sicher: true };
  }
  return { zug: offen[Math.floor(Math.random() * offen.length)], sicher: false };
}

/* ── Der Bogen ─────────────────────────────────────────────────────────────────────
   Eine springende Murmel beschreibt keine Gerade und auch keinen Knick. Die Bahn ist eine
   echte Wurfparabel: waagerecht gleichförmig, quer dazu `4t(1−t)` — also null an beiden
   Enden, eins in der Mitte. Ausgegeben werden VIER Stützstellen (0, ¼, ½, ¾), die als
   CSS-Keyframes linear verbunden werden; bei vier Stützstellen liegt der größte Fehler
   gegen die wahre Parabel unter einem Prozent der Sprungweite.

   Die Auslenkung steht quer zur Fahrt — nach oben, wo es geht, sonst nach rechts. So
   bekommt auch ein senkrechter Sprung eine sichtbare Kurve statt einer Geraden.

   🚨 Der Maßstab gehört zur Bahn, nicht zur Zier: die Murmel wird auf dem Scheitel
   größer, weil sie näher am Auge ist. Steigt sie ohne zu wachsen, sieht der Sprung aus
   wie ein Schieben auf dem Papier. Die Werte stehen im Keyframe (app/solitaer.css),
   weil sie für jeden Sprung dieselben sind — anders als die Wege hier. */
const AUSSCHLAG = 0.44;
const STUFEN = [0, 0.25, 0.5, 0.75];

export function bogen(brett: Brett, zug: Zug) {
  const a = brett.loecher[zug.von];
  const b = brett.loecher[zug.nach];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const laenge = Math.hypot(dx, dy) || 1;
  let qx = -dy / laenge;
  let qy = dx / laenge;
  if (qy > 0 || (qy === 0 && qx < 0)) { qx = -qx; qy = -qy; }
  const weite = laenge * AUSSCHLAG;
  /* Die Murmel wird am ZIEL gezeichnet; alle Wege sind deshalb Rückwege dorthin. */
  return STUFEN.map((t) => {
    const hoch = 4 * t * (1 - t);
    return { x: rund(-dx * (1 - t) + qx * weite * hoch), y: rund(-dy * (1 - t) + qy * weite * hoch) };
  });
}

/** Das nächste Loch in einer Richtung — für die Steuerung mit den Pfeiltasten. */
export function nachbarIn(brett: Brett, von: number, rx: number, ry: number): number {
  const a = brett.loecher[von];
  let beste = -1;
  let wert = Infinity;
  brett.loecher.forEach((b, i) => {
    if (i === von) return;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const weg = Math.hypot(dx, dy);
    const anteil = (dx * rx + dy * ry) / weg;
    if (anteil < 0.5) return;                        // nicht in dieser Richtung
    const preis = weg / anteil + (1 - anteil) * 60;  // nah und geradeaus gewinnt
    if (preis < wert) { wert = preis; beste = i; }
  });
  return beste < 0 ? von : beste;
}

/**
 * Der Sprungbogen als Pfad — dieselbe Parabel, die die Murmel fliegt, nur sichtbar.
 *
 * Als quadratische Bézierkurve, nicht als Streckenzug: eine quadratische Bézier IST eine
 * Parabel. Mit dem Steuerpunkt auf der doppelten Auslenkung deckt sie sich exakt mit der
 * Flugbahn — der gezeigte Weg ist damit der geflogene, nicht bloß einer, der ihm ähnelt.
 */
export function bogenPfad(brett: Brett, zug: Zug): string {
  const a = brett.loecher[zug.von];
  const b = brett.loecher[zug.nach];
  const scheitel = bogen(brett, zug)[2];          // Stützstelle t = ½, relativ zum Ziel
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  // Scheitel absolut, daraus der Steuerpunkt: C = 2·Scheitel − Mitte.
  const sx = b.x + scheitel.x;
  const sy = b.y + scheitel.y;
  return `M${rund(a.x)} ${rund(a.y)} Q${rund(2 * sx - mx)} ${rund(2 * sy - my)} ${rund(b.x)} ${rund(b.y)}`;
}
