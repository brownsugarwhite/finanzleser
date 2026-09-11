"use client";

/**
 * Schlange — das kleine Spiel im Kapitel „Heute", direkt über dem Finanzwort des Tages.
 *
 * Das Aussehen der Schlange kommt vollständig aus `lib/faden/schlange.ts` (Vorlage des
 * Designs, Maßstab und Kurvenform nach Snake II). Hier steht nur das Spiel: Kette aus
 * Spielzellen, Futter, Steuerung, Punkte, Fressen.
 *
 * Ein paar Entscheidungen, die nicht offensichtlich sind:
 *
 *  • **Der Takt läuft über `requestAnimationFrame`**, nicht über `setInterval`: Im
 *    Hintergrund-Tab hält der Browser rAF an, das Spiel läuft also nicht ungesehen
 *    weiter und verbrennt keine Rechenzeit.
 *  • **Der Spielstand liegt in einem Ref**, das Neuzeichnen stößt ein Zähler-State an.
 *    So erzeugt ein Zug genau ein Rendern, und die Schleife liest nie veraltete Werte
 *    aus einer Closure.
 *  • **Tasten werden nur abgefangen, wenn das Feld den Fokus hat.** Sonst würde das
 *    Spiel dem Leser die Pfeiltasten zum Scrollen wegnehmen — im Faden besonders
 *    ärgerlich, der lebt vom Scrollen.
 *  • **Das Raster richtet sich nach der Breite des Feldes.** Auf dem Handy wären 18
 *    Spalten so fein, dass die kleinen Blöcke der Vorlage zu Staub würden; ein Block
 *    bleibt deshalb immer mindestens sechs Pixel groß.
 *  • **Fressen wird gezeigt, nicht nur gezählt** (Snake II): Das Maul klappt zwei Züge
 *    lang auf, und der Happen wandert als Wölbung sichtbar durch den Körper nach hinten.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import SpielKopf from "./SpielKopf";
import {
  schlangenFormen, futterFormen, FUTTER_ARTEN, TEILUNG,
  type Form, type FutterArt, type Zelle,
} from "@/lib/faden/schlange";

const START_LAENGE = 6;        // Segmente — die Länge der Vorlage (25 Blöcke ≈ 6 Zellen)
const TAKT_START = 165;        // ms je Zug (Snake II, niedrige Stufe)
const TAKT_MIN = 95;
const TAKT_SCHRITT = 4;        // je Happen etwas schneller
const MAUL_ZUEGE = 2;          // so lange steht das Maul nach dem Zuschnappen offen
const SPEICHER = "fl-schlange-beste";

/* Feld: so viele Spalten, wie bei mindestens sechs Pixel je Block hineinpassen —
   höchstens 18 (Snake-II-Brett), mindestens 10. */
const SPALTEN_MAX = 18;
const SPALTEN_MIN = 10;
const REIHEN_ANTEIL = 10 / 18;
const BLOCK_MIN = 6;           // px je Block, darunter zerfällt das Schuppenmuster

type Richtung = Zelle;
type Stand = "bereit" | "laeuft" | "aus";
type Raster = { spalten: number; reihen: number };

const RECHTS: Richtung = { x: 1, y: 0 };
const START_RASTER: Raster = { spalten: SPALTEN_MAX, reihen: 10 };

const TASTEN: Record<string, Richtung> = {
  ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 }, s: { x: 0, y: 1 }, a: { x: -1, y: 0 }, d: { x: 1, y: 0 },
};

function rasterZuBreite(breite: number): Raster {
  const spalten = Math.max(SPALTEN_MIN, Math.min(SPALTEN_MAX, Math.floor(breite / (BLOCK_MIN * TEILUNG))));
  return { spalten, reihen: Math.max(6, Math.round(spalten * REIHEN_ANTEIL)) };
}

const zufallsFutter = (): FutterArt => FUTTER_ARTEN[Math.floor(Math.random() * FUTTER_ARTEN.length)];

/** Ausgangslage: waagerecht, Kopf rechts der Mitte — die Pose der Vorlage. */
function startKette(raster: Raster): Zelle[] {
  const kopf = { x: Math.round(raster.spalten * 0.62), y: Math.floor(raster.reihen / 2) };
  return Array.from({ length: START_LAENGE }, (_, i) => ({ x: kopf.x - i, y: kopf.y }));
}

/** Freies Feld für den nächsten Happen. */
function neuesFutter(koerper: Zelle[], raster: Raster): Zelle {
  const belegt = new Set(koerper.map((z) => `${z.x},${z.y}`));
  const frei: Zelle[] = [];
  for (let y = 0; y < raster.reihen; y++) {
    for (let x = 0; x < raster.spalten; x++) if (!belegt.has(`${x},${y}`)) frei.push({ x, y });
  }
  return frei[Math.floor(Math.random() * frei.length)] || { x: 0, y: 0 };
}

export default function Schlange() {
  const [stand, setStand] = useState<Stand>("bereit");
  const [punkte, setPunkte] = useState(0);
  const [beste, setBeste] = useState(0);
  const [raster, setRaster] = useState<Raster>(START_RASTER);
  const [, zeichne] = useState(0);

  const spiel = useRef({
    koerper: startKette(START_RASTER),
    richtung: RECHTS as Richtung,
    naechste: RECHTS as Richtung,
    futter: { x: 14, y: 2 } as Zelle,
    futterArt: "ring" as FutterArt,
    takt: TAKT_START,
    rest: 0,
    letzte: 0,
    losgelaufen: false,
    beule: null as number | null,
    maul: 0,
  });
  const feld = useRef<HTMLDivElement | null>(null);
  const standRef = useRef<Stand>("bereit");
  standRef.current = stand;
  const rasterRef = useRef<Raster>(raster);
  rasterRef.current = raster;

  useEffect(() => {
    try {
      const gemerkt = Number(window.localStorage.getItem(SPEICHER) || 0);
      if (gemerkt > 0) setBeste(gemerkt);
    } catch { /* Speicher gesperrt (privates Fenster) — dann eben ohne Bestwert */ }
  }, []);

  // Raster an die Breite anpassen — aber nie mitten im Spiel.
  useEffect(() => {
    const el = feld.current;
    if (!el) return;
    const messen = () => {
      if (standRef.current === "laeuft") return;
      const neu = rasterZuBreite(el.clientWidth || 728);
      setRaster((alt) => {
        if (alt.spalten === neu.spalten && alt.reihen === neu.reihen) return alt;
        spiel.current.koerper = startKette(neu);
        spiel.current.richtung = RECHTS;
        spiel.current.naechste = RECHTS;
        return neu;
      });
    };
    messen();
    window.addEventListener("resize", messen);
    return () => window.removeEventListener("resize", messen);
  }, []);

  const merkeBeste = useCallback((wert: number) => {
    setBeste((alt) => {
      if (wert <= alt) return alt;
      try { window.localStorage.setItem(SPEICHER, String(wert)); } catch { /* egal */ }
      return wert;
    });
  }, []);

  const starte = useCallback(() => {
    const s = spiel.current;
    s.koerper = startKette(rasterRef.current);
    s.richtung = RECHTS;
    s.naechste = RECHTS;
    s.futter = neuesFutter(s.koerper, rasterRef.current);
    s.futterArt = zufallsFutter();
    s.takt = TAKT_START;
    s.rest = 0;
    s.letzte = 0;
    s.losgelaufen = false;
    s.beule = null;
    s.maul = 0;
    setPunkte(0);
    setStand("laeuft");
    feld.current?.focus();
  }, []);

  /** Ein Zug. Gibt false zurück, wenn die Schlange anstößt. */
  const schritt = useCallback(() => {
    const s = spiel.current;
    const { spalten, reihen } = rasterRef.current;
    s.richtung = s.naechste;
    const kopf = { x: s.koerper[0].x + s.richtung.x, y: s.koerper[0].y + s.richtung.y };
    const wand = kopf.x < 0 || kopf.y < 0 || kopf.x >= spalten || kopf.y >= reihen;
    // Die letzte Zelle rückt im selben Zug weg — sie zählt nicht als Zusammenstoß.
    const selbst = s.koerper.slice(0, -1).some((z) => z.x === kopf.x && z.y === kopf.y);
    if (wand || selbst) return false;

    // Der Happen wandert nach hinten und verschwindet am Schwanz.
    if (s.beule != null) {
      s.beule += TEILUNG;
      if (s.beule > TEILUNG * s.koerper.length) s.beule = null;
    }
    if (s.maul > 0) s.maul -= 1;

    const gefressen = kopf.x === s.futter.x && kopf.y === s.futter.y;
    s.koerper = gefressen ? [kopf, ...s.koerper] : [kopf, ...s.koerper.slice(0, -1)];
    if (gefressen) {
      s.futter = neuesFutter(s.koerper, rasterRef.current);
      s.futterArt = zufallsFutter();
      s.takt = Math.max(TAKT_MIN, s.takt - TAKT_SCHRITT);
      // Direkt hinter dem Kopf: im Kopf selbst wäre die Wölbung nur eine verbeulte
      // Schnauze, dahinter sieht man sie als Kugel durch den Körper laufen.
      s.beule = 5;
      s.maul = MAUL_ZUEGE;
      setPunkte((p) => { const neu = p + 1; merkeBeste(neu); return neu; });
    }
    return true;
  }, [merkeBeste]);

  // Takt: rAF mit Restzeit-Konto, damit die Geschwindigkeit nicht an der Bildrate hängt.
  useEffect(() => {
    if (stand !== "laeuft") return;
    let laeuft = true;
    let id = 0;
    const s = spiel.current;
    s.letzte = 0;
    const tick = (jetzt: number) => {
      if (!laeuft) return;
      // 🚨 Erst die erste Richtungseingabe setzt die Schlange in Bewegung. In der Pose
      // der Vorlage steht der Kopf nur wenige Zellen vor der rechten Wand — liefe sie
      // sofort los, wäre das Spiel vorbei, bevor der Leser die Hand an der Tastatur hat.
      if (!s.losgelaufen) { s.letzte = jetzt; s.rest = 0; id = requestAnimationFrame(tick); return; }
      if (s.letzte === 0) s.letzte = jetzt;
      // Nach einem Tabwechsel kann der Sprung groß sein — auf einen Zug deckeln.
      s.rest += Math.min(jetzt - s.letzte, s.takt);
      s.letzte = jetzt;
      let gezogen = false;
      while (s.rest >= s.takt) {
        s.rest -= s.takt;
        if (!schritt()) { laeuft = false; setStand("aus"); zeichne((n) => n + 1); return; }
        gezogen = true;
      }
      // Nur nach einem echten Zug neu zeichnen — sonst rendert React 60-mal je Sekunde
      // ein Bild, das sich nicht geändert hat.
      if (gezogen) zeichne((n) => n + 1);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => { laeuft = false; cancelAnimationFrame(id); };
  }, [stand, schritt]);

  const lenke = useCallback((r: Richtung) => {
    const s = spiel.current;
    // Keine Kehrtwende um 180°.
    if (r.x === -s.richtung.x && r.y === -s.richtung.y) return;
    s.naechste = r;
    s.losgelaufen = true;
  }, []);

  const beiTaste = (e: React.KeyboardEvent) => {
    const r = TASTEN[e.key] || TASTEN[e.key.toLowerCase()];
    if (r) {
      e.preventDefault();
      if (standRef.current !== "laeuft") starte();
      lenke(r);
      return;
    }
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (standRef.current !== "laeuft") starte();
    }
  };

  /**
   * Wischen auf dem Feld (Mobil) — nur zum Lenken, **nie zum Starten**.
   * 🚨 Ein Wisch ist auf dem Handy zuerst einmal Scrollen. Solange das Wischen auch
   * startete, riss jedes Vorbeiscrollen am Spielfeld die Schlange los.
   */
  const tipp = useRef<{ x: number; y: number } | null>(null);
  const beiZeigerAb = (e: React.PointerEvent) => { tipp.current = { x: e.clientX, y: e.clientY }; };
  const beiZeigerAuf = (e: React.PointerEvent) => {
    const start = tipp.current;
    tipp.current = null;
    if (!start || standRef.current !== "laeuft") return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;   // Tippen, kein Wischen
    lenke(Math.abs(dx) > Math.abs(dy) ? { x: Math.sign(dx), y: 0 } : { x: 0, y: Math.sign(dy) });
  };

  const s = spiel.current;
  const formen = schlangenFormen(s.koerper, s.richtung, { beule: s.beule, maul: s.maul > 0 });
  const futter = futterFormen(s.futter, s.futterArt);

  return (
    <div className="schlange">
      <SpielKopf kicker="Spiel · Schlange" hinweis="Pfeiltasten oder wischen" ton="gruen" />

      <div
        className="schlange__feld"
        ref={feld}
        tabIndex={0}
        role="application"
        aria-label="Schlange — Pfeiltasten zum Steuern, Leertaste startet"
        onKeyDown={beiTaste}
        onPointerDown={beiZeigerAb}
        onPointerUp={beiZeigerAuf}
        onClick={() => { if (standRef.current !== "laeuft") starte(); }}
        style={{ "--schlange-spalten": raster.spalten, "--schlange-reihen": raster.reihen } as React.CSSProperties}
      >
        <svg
          viewBox={`0 0 ${raster.spalten * TEILUNG} ${raster.reihen * TEILUNG}`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          {stand !== "bereit" && (
            <g className="schlange__happen">
              {futter.koerper.map(zeichneForm)}
              {/* Der Schein blitzt ab und zu von der Mitte nach außen (CSS). */}
              <g className="schlange__schein">{futter.schein.map(zeichneForm)}</g>
            </g>
          )}
          <g className="schlange__leib">{formen.map(zeichneForm)}</g>
        </svg>
      </div>

      <div className="schlange__fuss">
        <p className="schlange__stand" aria-live="polite">
          {stand === "aus"
            ? <>Angestoßen — <b>{punkte}</b> Happen gefangen.</>
            : <>Punkte <b>{punkte}</b></>}
          {beste > 0 && <> · Bestwert <b>{beste}</b></>}
          {stand === "laeuft" && !spiel.current.losgelaufen && (
            <span className="schlange__wink"> · Pfeiltaste drücken oder wischen</span>
          )}
        </p>
        {stand !== "laeuft" && (
          <button type="button" className="btn" onClick={starte}>
            {stand === "aus" ? "Noch einmal" : "Spielen"}
          </button>
        )}
      </div>
    </div>
  );
}

function zeichneForm(f: Form, i: number) {
  if (f.art === "kreis") return <circle key={i} cx={f.x} cy={f.y} r={f.r} />;
  const mitte = `${f.x + f.b / 2} ${f.y + f.h / 2}`;
  return (
    <rect
      key={i}
      x={f.x}
      y={f.y}
      width={f.b}
      height={f.h}
      transform={f.dreh ? `rotate(${f.dreh} ${mitte})` : undefined}
    />
  );
}
