/**
 * Geometrie der Schlange — Optik aus der Bildvorlage, Maßstab und Bewegung aus Snake II.
 *
 * ## Das Raster — und warum es 4 ist
 *
 * Alles rechnet in **Blöcken** (Unterzellen). Eine Spielzelle ist `TEILUNG` × `TEILUNG`
 * Blöcke groß, der Körper aber nur **zwei** Blöcke dick und mittig darin:
 *
 *   Bahn A     ░░▓▓░░      Zelle = 4 Blöcke
 *   Lücke      ░░░░░░      Körper = 2, also bleiben
 *   Bahn B     ░░▓▓░░      genau 2 Blöcke Luft dazwischen
 *
 * 🚨 `TEILUNG = 4` ist am Vorlagenbild **gemessen**, nicht geschätzt: in der engen Kehre
 * liegen zwischen zwei Bahnen exakt zwei leere Blockplätze, die Mittellinien sind vier
 * Blöcke auseinander. Mit 3 (der vorigen Fassung) passte nur einer dazwischen.
 *
 * ## Grundregel: kein Block berührt einen anderen
 *
 * **Jedes Quadrat sitzt auf einem Blockmittelpunkt** (halbzahlige Koordinate), keins
 * dazwischen. Deshalb überlappt nichts — auch nicht in der Kurve, auch nicht beim
 * Fressen. Wer hier Formen mit einem Zwischen-Versatz einbaut (0,25 hier, 0,5 da),
 * bricht die Regel: genau das ließ in der vorigen Fassung die Blöcke ineinanderragen.
 *
 * ## Kurven
 *
 * Jede Zelle setzt vier Rippen: zwei in Kopfrichtung (Abstand 1,5 und 0,5 von der
 * Zellmitte) und zwei in Schwanzrichtung. Bei einer Kurve stehen die beiden Arme
 * senkrecht zueinander; die inneren Rippen treffen sich in **einem** Block (doppelt
 * gesetzt, per Karte entdoppelt), und der **äußere Eckblock wird nie gesetzt**. Die
 * abgerundete Ecke fällt also aus der Konstruktion heraus, ohne Sonderfall.
 *
 * ## Das Schuppenmuster (die Vorlage)
 *
 * `j` zählt die Blöcke vom Kopf aus, `s` ist die Seite (0 = Augenseite, 1 = Kieferseite,
 * **immer vom Kopf aus gespiegelt**, nie aus der lokalen Laufrichtung — sonst sieht der
 * Kopf bei Lauf nach links anders aus als nach rechts). Klein statt groß ist ein Block,
 * wenn `(j + 2·s) % 3 === 1`.
 *
 * ## Kopf (nach Vorlage)
 *
 * Augenseite vom Maul aus: `j=0` kleiner Block (Nasenspitze), `j=1` mittlerer, `j=2`
 * Auge (Kreis), `j=3` groß. Kiefer bis `j=4` durchgehend groß. Über dem Auge die
 * Augenbraue — ein **liegendes Rechteck**, leicht gekippt, kein Quadrat.
 *
 * ## Fressen
 *
 * `maul` sperrt Ober- und Unterkiefer auf, `beule` ist die Stelle (in `j`), an der der
 * Happen durch den Körper wandert: dort wächst je ein Block nach oben und unten aus dem
 * Körper heraus — auf Rasterplätzen, nicht als vergrößertes Quadrat.
 */

export type Zelle = { x: number; y: number };

export type Form =
  | { art: "rechteck"; x: number; y: number; b: number; h: number; dreh?: number }
  | { art: "kreis"; x: number; y: number; r: number };

/** Blöcke je Spielzelle. Körper bleibt 2 dick — der Rest ist die Lücke. */
export const TEILUNG = 4;

/** Maße in Blöcken (1 = Kantenlänge eines Blockplatzes). */
export const GROSS = 0.88;
const KLEIN = 0.39;
const MITTEL = 0.6;           // Nasenspitze
const AUGE = 0.44;
const LUECKE = 1 - GROSS;     // der kleinste Abstand im Bild — gilt auch für die Nase
const BRAUE_B = 1.15;         // Augenbraue: schmales liegendes Rechteck
const BRAUE_H = 0.38;
const BRAUE_DREH = -12;       // ruhig: vorne leicht hoch
const BRAUE_BOESE = 18;       // beim Fressen: vorne runter, das gibt den bösen Blick
const SCHWANZ = 0.87;         // letzter Block vor der Spitze
const SPITZE_LANG = 0.78;
const SPITZE_DICK = 0.3;
const PHASE = 1;
const MAUL_OBEN = 1;          // Oberkiefer springt einen ganzen Blockplatz hoch
const MAUL_UNTEN = 0.75;      // Unterkiefer klappt weniger weit als der obere
const BEULE_SCHMAL = 0.62;    // die beiden äußeren Blöcke der Wölbung

/** Zusätzliche Zustände, die das Bild verändern (Fressen). */
export type Beigabe = {
  /** Erster Block der Wölbung, vom Kopf aus gezählt; `null` = kein Happen unterwegs. */
  beule?: number | null;
  /** Maul offen (kurz nach dem Zuschnappen). */
  maul?: boolean;
};

const mal = (d: Zelle, f: number): Zelle => ({ x: d.x * f, y: d.y * f });
const summe = (...v: Zelle[]): Zelle => v.reduce((a, b) => ({ x: a.x + b.x, y: a.y + b.y }));
const gegen = (d: Zelle): Zelle => ({ x: -d.x, y: -d.y });
const skalar = (a: Zelle, b: Zelle) => a.x * b.x + a.y * b.y;
/** Links der Laufrichtung (Bildschirm-Koordinaten, y zeigt nach unten). */
const links = (d: Zelle): Zelle => ({ x: d.y, y: -d.x });
/** Mitte einer Spielzelle in Blockkoordinaten. */
export const zellMitte = (z: Zelle): Zelle => ({ x: TEILUNG * z.x + TEILUNG / 2, y: TEILUNG * z.y + TEILUNG / 2 });
const nach = (von: Zelle, zu: Zelle): Zelle => ({ x: Math.sign(zu.x - von.x), y: Math.sign(zu.y - von.y) });

/**
 * Wie weit ein kleineres Kopfteil aus seinem Rasterplatz rückt, um sich mit dem
 * **kleinsten Abstand** an den großen Block bei `j = 1` zu schmiegen.
 *
 * 🚨 Hier prallen zwei Anforderungen aufeinander, die ich nacheinander falsch gelöst
 * hatte:
 *   • Mittig im Rasterplatz gezeichnet, lässt ein kleineres Quadrat vorn **und** hinten
 *     mehr Luft als zwischen zwei großen Blöcken → „Abstand zu groß".
 *   • Alle Teile von der Schnauze her durchgepackt, verschiebt auch die **großen**
 *     Blöcke der Oberseite gegen die des Kiefers → „wirkt versetzt".
 *
 * Die Lösung: die großen Blöcke bleiben exakt im Raster, und nur Nase und Auge rücken —
 * beide an den großen Block zwischen ihnen heran, mit genau `LUECKE` Abstand. Der
 * verbleibende Schlupf sammelt sich dort, wo er auch in der Vorlage sitzt: als eine
 * größere Lücke hinter dem Auge.
 */
const anschmiegen = (l: number) => 1 - GROSS / 2 - LUECKE - l / 2;

/**
 * Welche Seite ist „oben"? Seite 0 liegt links der Laufrichtung — das ist nur bei Lauf
 * nach rechts und nach oben auch die Bildoberseite. Ohne diese Unterscheidung wird der
 * Kopf mitgedreht statt gespiegelt, und Auge und Braue säßen unter dem Kiefer.
 */
const obenSeite = (d: Zelle): number => (d.x > 0 || d.y < 0 ? 0 : 1);

/**
 * Alle Formen der Schlange in Blockkoordinaten.
 * `koerper` ist die Zellenkette vom Kopf (Index 0) zum Schwanz, `richtung` die
 * Laufrichtung des Kopfes.
 */
export function schlangenFormen(koerper: Zelle[], richtung: Zelle, bei: Beigabe = {}): Form[] {
  const n = koerper.length;
  if (n === 0) return [];
  const letzterBlock = TEILUNG * n - 1;
  const kopfOben = obenSeite(richtung);
  const vorlagenSeite = (seite: number) => (seite === kopfOben ? 0 : 1);

  /* Ein Rasterplatz trägt höchstens einen Block. In der Kurve treffen sich die inneren
     Rippen beider Arme auf demselben Platz — dort gewinnt der größere Block. */
  const raster = new Map<string, Form>();
  const extras: Form[] = [];
  const platz = (p: Zelle) => `${Math.round(p.x * 2)}:${Math.round(p.y * 2)}`;
  const flaeche = (f: Form) => (f.art === "kreis" ? f.r * f.r * 3.15 : f.b * f.h);
  const setze = (p: Zelle, f: Form) => {
    const k = platz(p);
    const alt = raster.get(k);
    if (!alt || flaeche(f) > flaeche(alt)) raster.set(k, f);
  };
  const quadrat = (p: Zelle, gr: number) =>
    setze(p, { art: "rechteck", x: p.x - gr / 2, y: p.y - gr / 2, b: gr, h: gr });

  /** Liegt hier die Wölbung des geschluckten Happens? Sie ist **drei Blöcke** lang. */
  const beulig = (j: number) => bei.beule != null && j >= bei.beule && j <= bei.beule + 2;

  /**
   * Ein Block des Körpers an der Stelle (j, Seite). `l` ist „links der Laufrichtung",
   * `vorne` die Kopfrichtung dieses Arms (für die Packung der Kopfteile).
   */
  const koerperBlock = (p: Zelle, l: Zelle, vorne: Zelle, j: number, seite: number) => {
    const vs = vorlagenSeite(seite);
    const raus = mal(l, seite === 0 ? 1 : -1);          // vom Körper weg

    // Schwanz: die Augenseite fällt weg, der letzte Block ist etwas kleiner.
    if (j === letzterBlock) {
      if (vs === 0) return;
      quadrat(p, GROSS * SCHWANZ);
      return;
    }

    // Kopf, Augenseite: Nase, Auge — dicht gepackt statt auf den Rasterplätzen.
    if (vs === 0 && j <= 3) {
      if (j === 3) { quadrat(p, GROSS); return; }
      // Auge sitzt **mittig** in seinem Rasterplatz — in der Rastervorlage sind die
      // Abstände zu den großen Blöcken davor und dahinter gleich groß.
      if (j === 2) { setze(p, { art: "kreis", x: p.x, y: p.y, r: AUGE / 2 }); return; }
      // Offenes Maul: die Spitze klappt einen ganzen Blockplatz hoch und wird voll,
      // der Block dahinter steht groß auf Normalhöhe (Vorlage).
      if (bei.maul) { quadrat(j === 0 ? summe(p, mal(raus, MAUL_OBEN)) : p, GROSS); return; }
      // Nase: dicht vor dem Block j = 1, also gegen die Laufrichtung eingerückt.
      quadrat(j === 0 ? summe(p, mal(vorne, -anschmiegen(MITTEL))) : p, j === 0 ? MITTEL : GROSS);
      return;
    }
    // Kopf, Kieferseite: durchgehend groß, beim Fressen klappt die Spitze nach unten.
    if (vs === 1 && j <= 4) {
      quadrat(bei.maul && j === 0 ? summe(p, mal(raus, MAUL_UNTEN)) : p, GROSS);
      return;
    }

    /* Der Happen wölbt den Körper: je Seite ein zusätzlicher Block auf dem Rasterplatz
       daneben — außen zwei schmalere, in der Mitte ein normaler. Das Schuppenmuster
       darunter bleibt unverändert und läuft durch. */
    if (beulig(j)) {
      /* Mitte ein normaler Block auf seinem Rasterplatz, außen zwei schmalere — und die
         rücken zum Körper hin, damit auch dort der kleinste Abstand steht (sonst
         schwebten sie mit doppelter Luft daneben). */
      const mitte = j === (bei.beule as number) + 1;
      const gr = mitte ? GROSS : BEULE_SCHMAL;
      const naeher = mitte ? 0 : (GROSS - BEULE_SCHMAL) / 2;
      quadrat(summe(p, mal(raus, 1 - naeher)), gr);
    }

    quadrat(p, (j + 2 * vs) % 3 === PHASE ? KLEIN : GROSS);
  };

  /** Eine Rippe: zwei Blöcke quer zur Laufrichtung dieses Arms. */
  const rippe = (p: Zelle, l: Zelle, vorne: Zelle, j: number) => {
    koerperBlock(summe(p, mal(l, 0.5)), l, vorne, j, 0);
    koerperBlock(summe(p, mal(l, -0.5)), l, vorne, j, 1);
  };

  for (let i = 0; i < n; i++) {
    const c = zellMitte(koerper[i]);
    const vor = i === 0 ? richtung : nach(koerper[i], koerper[i - 1]);        // kopfwärts
    const zurueck = i === n - 1 ? gegen(vor) : nach(koerper[i], koerper[i + 1]);
    const lVor = links(vor);
    const lZurueck = links(gegen(zurueck));   // „links" des rückwärtigen Arms, kopfwärts gesehen

    // Vier Rippen je Zelle. Bei einer Kurve stehen die Arme senkrecht zueinander; der
    // äußere Eckblock kommt in keiner der vier Rippen vor und bleibt darum frei.
    rippe(summe(c, mal(vor, 1.5)), lVor, vor, TEILUNG * i);
    rippe(summe(c, mal(vor, 0.5)), lVor, vor, TEILUNG * i + 1);
    rippe(summe(c, mal(zurueck, 0.5)), lZurueck, gegen(zurueck), TEILUNG * i + 2);
    rippe(summe(c, mal(zurueck, 1.5)), lZurueck, gegen(zurueck), TEILUNG * i + 3);

    /* 🚨 Liegt die Wölbung in einer Kurve, wird die Außenecke **gefüllt**: sonst klafft
       genau dort ein Loch, wo der Körper am dicksten ist — die Rundung, die sonst richtig
       ist, sieht mit Wölbung kaputt aus. */
    const kurve = skalar(vor, zurueck) === 0;
    if (kurve && (beulig(TEILUNG * i + 1) || beulig(TEILUNG * i + 2))) {
      quadrat(summe(c, mal(vor, -0.5), mal(zurueck, -0.5)), GROSS);
    }
  }

  // Schwanzspitze: flacher Riegel einen Blockplatz hinter dem letzten Block.
  if (n >= 2) {
    const c = zellMitte(koerper[n - 1]);
    const kopfwaerts = nach(koerper[n - 1], koerper[n - 2]);
    const raus = gegen(kopfwaerts);
    const l = links(kopfwaerts);
    const kiefer = kopfOben === 0 ? -0.5 : 0.5;         // Kieferseite ist die Gegenseite
    const p = summe(c, mal(raus, 2.5), mal(l, kiefer));
    const quer = raus.x !== 0;
    const b = quer ? SPITZE_LANG : SPITZE_DICK;
    const h = quer ? SPITZE_DICK : SPITZE_LANG;
    extras.push({ art: "rechteck", x: p.x - b / 2, y: p.y - h / 2, b, h });
  }

  /* Augenbraue: liegendes Rechteck **genau über dem Auge**, mit `LUECKE` Abstand auf dem
     Körper aufsitzend. Beim Fressen kippt sie andersherum — das ist der böse Blick. */
  const c0 = zellMitte(koerper[0]);
  const l0 = links(richtung);
  const kipp = bei.maul ? BRAUE_BOESE : BRAUE_DREH;
  const bogen = (Math.abs(kipp) * Math.PI) / 180;
  const hoehe = BRAUE_B * Math.sin(bogen) + BRAUE_H * Math.cos(bogen);   // Höhe der gekippten Braue
  // … und sitzt dabei praktisch auf dem Körper auf (Rastervorlage: kein sichtbarer Spalt).
  const hoch = (0.5 + GROSS / 2 + hoehe / 2) * (kopfOben === 0 ? 1 : -1);
  // Waagerecht **mittig über dem Auge** (Rastervorlage), das auf seinem Platz sitzt.
  const pb = summe(c0, mal(richtung, 1.5 - 2), mal(l0, hoch));
  const dreh = (Math.atan2(richtung.y, richtung.x) * 180) / Math.PI + (kopfOben === 0 ? kipp : -kipp);
  extras.push({ art: "rechteck", x: pb.x - BRAUE_B / 2, y: pb.y - BRAUE_H / 2, b: BRAUE_B, h: BRAUE_H, dreh });

  return [...raster.values(), ...extras];
}

/* ---------------------------------------------------------------------------------
   Futter — zwei Formen nach der Vorlage: ein Ring aus vier Blöcken und eine Raute.
   Dazu der „Schein": vier Striche auf den Diagonalen, die von der Mitte nach außen
   blitzen (die Animation macht das CSS, hier steht nur die Geometrie).
   --------------------------------------------------------------------------------- */

export type FutterArt = "ring" | "raute";
export const FUTTER_ARTEN: FutterArt[] = ["ring", "raute"];

const RAUTE = 1.5;            // Kantenlänge der gedrehten Raute
const STRICH_LANG = 0.8;      // Schein: kurze kräftige Striche …
const STRICH_DICK = 0.32;
const STRICH_WEIT = 2;        // … etwas außerhalb des Futters (Abstand auf der Diagonale)

export function futterFormen(z: Zelle, art: FutterArt): { koerper: Form[]; schein: Form[] } {
  const c = zellMitte(z);
  const koerper: Form[] =
    art === "ring"
      ? [{ x: 0, y: -1 }, { x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }].map((o) => ({
          art: "rechteck" as const,
          x: c.x + o.x - GROSS / 2,
          y: c.y + o.y - GROSS / 2,
          b: GROSS,
          h: GROSS,
        }))
      : [{ art: "rechteck" as const, x: c.x - RAUTE / 2, y: c.y - RAUTE / 2, b: RAUTE, h: RAUTE, dreh: 45 }];

  const eck = STRICH_WEIT / Math.SQRT2;
  const schein: Form[] = [
    { dx: -1, dy: -1, dreh: 45 }, { dx: 1, dy: -1, dreh: -45 },
    { dx: -1, dy: 1, dreh: -45 }, { dx: 1, dy: 1, dreh: 45 },
  ].map((s) => ({
    art: "rechteck" as const,
    x: c.x + s.dx * eck - STRICH_LANG / 2,
    y: c.y + s.dy * eck - STRICH_DICK / 2,
    b: STRICH_LANG,
    h: STRICH_DICK,
    dreh: s.dreh,
  }));

  return { koerper, schein };
}
