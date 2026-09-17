"use client";

/**
 * Solitär — das Brettspiel mit den Murmeln (nicht das Kartenspiel), im Satz des Fadens.
 *
 * Eine Murmel springt über ihre Nachbarin in das freie Loch dahinter; die Übersprungene
 * kommt vom Brett. Wer eine einzige übrig behält, hat gelöst; steht sie am Ende im
 * Startloch, ist es ein Meisterstück.
 *
 * Brett, Züge und die Halbton-Murmel stehen in `lib/faden/solitaer.ts`, das Aussehen in
 * `app/solitaer.css`. Hier steht nur das Spiel.
 *
 * Ein paar Entscheidungen, die nicht offensichtlich sind:
 *
 *  • **Der Spielstand wechselt SOFORT, die Bewegung kommt hinterher.** Der Sprung ist
 *    kein Zustand, durch den das Spiel hindurchmuss, sondern eine Überblendung über dem
 *    fertigen Zug: die gelandete Murmel wird per Keyframe an ihren Ausgangsort
 *    zurückgesetzt und fliegt von dort ins Bild. Wer es andersherum baut, hat ein Brett,
 *    das während jeder Bewegung klemmt — und bei `prefers-reduced-motion` eines, das nie
 *    wieder aufmacht, weil `animationend` dort nicht kommt.
 *  • **Die Murmeln sind ein `<use>` auf EIN Raster.** 33 Murmeln × 97 Punkte wären 3201
 *    Kreise im Baum; so sind es 33 Knoten auf eine Vorlage. Nur die gewählte Murmel
 *    bekommt eine zweite, langsam drehende Lage — daraus entsteht das Moiré, und das
 *    lohnt sich genau einmal.
 *  • **Drei Ebenen, und die Reihenfolge ist Absicht:** Bögen unten, dann je Loch eine
 *    Gruppe (Lochpunkt, Zielring, Murmel, Grifffläche), oben die Überblendungen. Die
 *    Grifffläche muss IN der Gruppe liegen, sonst gibt es kein `:hover` auf die Murmel —
 *    zwischen den Rasterpunkten ist eine Murmel für den Zeiger nämlich Luft. Und die
 *    fliegende Murmel muss OBEN liegen, sonst verschwindet sie auf halbem Bogen hinter
 *    ihrer Nachbarin.
 *  • **Die Kurve unter dem Brett zeigt den SPIELRAUM, nicht den Bestand.** Der Bestand
 *    wäre eine Gerade: ein Zug, eine Murmel, immer. Die Zahl der noch möglichen Sprünge
 *    dagegen steigt, kippt und fällt auf null — das ist die eigentliche Spannungskurve,
 *    und sie lehrt das Einzige, was hier zu lernen ist: sich nicht einzumauern.
 *  • **Der Tipp rechnet.** Er sucht mit Deckel eine Fortsetzung, die noch auf eine Murmel
 *    führt (`tippZug`). Findet er sie, sagt er das; findet er keine, zeigt er einen Zug,
 *    der überhaupt geht, und sagt auch das.
 *
 * 🚨 `FLUG_MS` hier und `--flug` in app/solitaer.css sind derselbe Wert. Läuft die Uhr
 * vor dem Keyframe ab, zuckt die Murmel am Ende zurück.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SpielKopf from "./SpielKopf";
import {
  BRETTER, BRETT_NAMEN, anfangsFeld, bogen, bogenPfad, murmeln, nachbarIn,
  offeneZuege, tippZug, ziehe, zuegeVon,
  type BrettName, type Zug,
} from "@/lib/faden/solitaer";

const FLUG_MS = 440;       // so lange ist eine Murmel in der Luft (= --flug)
const ZERFALL_MS = 700;    // so lange zerstäubt die geschlagene
const SPEICHER = "fl-solitaer-beste";

type Bestwerte = Partial<Record<BrettName, number>>;
type Ueberblendung = { nach: number; vonX: number; vonY: number; mitX: number; mitY: number };

const TASTEN: Record<string, [number, number]> = {
  ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
  w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
};

export default function Solitaer() {
  const [brettName, setBrettName] = useState<BrettName>("kreuz");
  const brett = BRETTER[brettName];

  const [feld, setFeld] = useState<boolean[]>(() => anfangsFeld(BRETTER.kreuz));
  const [verlauf, setVerlauf] = useState<Zug[]>([]);
  const [spielraum, setSpielraum] = useState<number[]>(() => [offeneZuege(BRETTER.kreuz, anfangsFeld(BRETTER.kreuz)).length]);
  const [gewaehlt, setGewaehlt] = useState<number | null>(null);
  const [tipp, setTipp] = useState<{ zug: Zug; sicher: boolean } | null>(null);
  const [beste, setBeste] = useState<Bestwerte>({});
  const [zeiger, setZeiger] = useState<number | null>(null);
  const [runde, setRunde] = useState(0);
  const [frisch, setFrisch] = useState(true);

  /* Überblendungen: reine Zier, sie halten den Spielstand nie auf. */
  const [flug, setFlug] = useState<Ueberblendung | null>(null);
  const [fort, setFort] = useState<number | null>(null);
  const [welle, setWelle] = useState<number | null>(null);
  const [andruck, setAndruck] = useState<number | null>(null);

  const uhren = useRef<number[]>([]);
  const merke = useCallback((id: number) => { uhren.current.push(id); }, []);
  useEffect(() => () => uhren.current.forEach(clearTimeout), []);

  const feldRef = useRef(feld);
  feldRef.current = feld;

  const rest = murmeln(feld);
  const offen = useMemo(() => offeneZuege(brett, feld), [brett, feld]);
  const ziele = useMemo(() => (gewaehlt == null ? [] : zuegeVon(brett, feld, gewaehlt)), [brett, feld, gewaehlt]);
  /** Löcher, aus denen überhaupt ein Sprung geht — für Zeigerform und Hover. */
  const beweglich = useMemo(() => {
    const menge = new Set<number>();
    for (const z of offen) menge.add(z.von);
    return menge;
  }, [offen]);

  const stand = rest === 1 ? "sieg" : offen.length === 0 ? "fest" : "spiel";
  const letzte = stand === "sieg" ? feld.findIndex(Boolean) : -1;
  const meisterstueck = stand === "sieg" && letzte === brett.ziel;
  const bestwert = beste[brettName];

  /* Bestwerte aus dem Speicher — je Brett die wenigsten übrig gebliebenen Murmeln. */
  useEffect(() => {
    try {
      const roh = window.localStorage.getItem(SPEICHER);
      if (roh) setBeste(JSON.parse(roh) as Bestwerte);
    } catch { /* Speicher gesperrt (privates Fenster) — dann eben ohne Bestwert */ }
  }, []);

  /* Ist eine Partie zu Ende, wird der Bestwert festgehalten. */
  useEffect(() => {
    if (stand === "spiel") return;
    setBeste((alt) => {
      const bisher = alt[brettName];
      if (bisher !== undefined && bisher <= rest) return alt;
      const neu = { ...alt, [brettName]: rest };
      try { window.localStorage.setItem(SPEICHER, JSON.stringify(neu)); } catch { /* egal */ }
      return neu;
    });
  }, [stand, rest, brettName]);

  /* Das Andrucken läuft einmal je Partie, danach der Wink auf die beweglichen Murmeln.
     Liefe das Fenster weiter, zuckte jede gelandete Murmel mit, und aus der Inszenierung
     würde ein Flackern. Die Uhr deckt beide Läufe ab (Andruck + Wink, siehe
     app/solitaer.css) — sie darf nicht früher schließen, sonst bricht der Wink ab. */
  useEffect(() => {
    setFrisch(true);
    const id = window.setTimeout(() => setFrisch(false), 620 + 850 + brett.loecher.length * 13);
    return () => clearTimeout(id);
  }, [runde, brett.loecher.length]);

  const neuesSpiel = useCallback((name: BrettName) => {
    const b = BRETTER[name];
    const start = anfangsFeld(b);
    setBrettName(name);
    setFeld(start);
    setVerlauf([]);
    setSpielraum([offeneZuege(b, start).length]);
    setGewaehlt(null);
    setTipp(null);
    setZeiger(null);
    setFlug(null); setFort(null); setWelle(null); setAndruck(null);
    setRunde((r) => r + 1);
  }, []);

  /** Ein Sprung: Stand sofort, Bewegung obendrauf. */
  const springe = useCallback((zug: Zug) => {
    const neu = ziehe(feldRef.current, zug);
    setFeld(neu);
    setVerlauf((v) => [...v, zug]);
    setSpielraum((k) => [...k, offeneZuege(brett, neu).length]);
    setGewaehlt(null);
    setTipp(null);
    setAndruck(null);
    setFlug({ nach: zug.nach, ...bogen(brett, zug) });
    setFort(zug.ueber);
    setWelle(zug.nach);
    merke(window.setTimeout(() => { setFlug(null); setWelle(null); }, FLUG_MS));
    merke(window.setTimeout(() => setFort(null), ZERFALL_MS));
  }, [brett, merke]);

  /** Zurücknehmen: dieselbe Bewegung rückwärts, die geschlagene Murmel wird neu gedruckt. */
  const zurueck = useCallback(() => {
    const zug = verlauf[verlauf.length - 1];
    if (!zug) return;
    const neu = feldRef.current.slice();
    neu[zug.nach] = false;
    neu[zug.ueber] = true;
    neu[zug.von] = true;
    setFeld(neu);
    setVerlauf((v) => v.slice(0, -1));
    setSpielraum((k) => (k.length > 1 ? k.slice(0, -1) : k));
    setGewaehlt(null);
    setTipp(null);
    setWelle(null);
    setFort(null);
    setFlug({ nach: zug.von, ...bogen(brett, { von: zug.nach, ueber: zug.ueber, nach: zug.von }) });
    setAndruck(zug.ueber);
    merke(window.setTimeout(() => setFlug(null), FLUG_MS));
    merke(window.setTimeout(() => setAndruck(null), ZERFALL_MS));
  }, [brett, verlauf, merke]);

  const zeigeTipp = useCallback(() => {
    const t = tippZug(brett, feldRef.current);
    if (!t) return;
    setTipp(t);
    setGewaehlt(t.zug.von);
  }, [brett]);

  /** Ein Loch wurde angetippt: wählen, springen, umwählen oder abwählen. */
  const tippeAuf = useCallback((i: number) => {
    setTipp(null);
    if (gewaehlt != null) {
      const zug = ziele.find((z) => z.nach === i);
      if (zug) { springe(zug); return; }
      if (i === gewaehlt) { setGewaehlt(null); return; }
    }
    setGewaehlt(feld[i] && beweglich.has(i) ? i : null);
  }, [feld, gewaehlt, ziele, beweglich, springe]);

  const beiTaste = (e: React.KeyboardEvent) => {
    const richtung = TASTEN[e.key] || TASTEN[e.key.toLowerCase()];
    if (richtung) {
      e.preventDefault();
      setZeiger((z) => (z == null ? brett.leer : nachbarIn(brett, z, richtung[0], richtung[1])));
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (zeiger == null) setZeiger(brett.leer);
      else tippeAuf(zeiger);
      return;
    }
    if (e.key === "Escape") { setGewaehlt(null); setTipp(null); }
    if (e.key === "z" || e.key === "Backspace") { e.preventDefault(); zurueck(); }
  };

  const murmelId = `fl-murmel-${brett.name}`;
  const mitte = brett.loecher[letzte < 0 ? brett.ziel : letzte];

  return (
    <div className="solitaer">
      <SpielKopf
        kicker="Solitär"
        hinweis="Springen, bis eine bleibt"
        erklaerung={<>Eine Murmel springt über ihre Nachbarin in das freie Loch dahinter — die Übersprungene kommt vom Brett. Wer eine einzige übrig behält, hat gelöst.</>}
      />

      <div className="solitaer__wahl chips" role="group" aria-label="Brett wählen">
        {BRETT_NAMEN.map((name) => (
          <button key={name} type="button" className="chip" aria-pressed={name === brettName} onClick={() => neuesSpiel(name)}>
            {BRETTER[name].titel}
            <span className="solitaer__wahlzahl">{BRETTER[name].loecher.length}</span>
          </button>
        ))}
      </div>

      <div
        className={"solitaer__brett"
          + (frisch ? " solitaer__brett--andruck" : "")
          + (stand === "fest" ? " solitaer__brett--fest" : "")
          + (stand === "sieg" ? " solitaer__brett--sieg" : "")}
        tabIndex={0}
        role="application"
        aria-label="Solitär — Pfeiltasten wählen ein Loch, Eingabetaste springt, z nimmt zurück"
        onKeyDown={beiTaste}
        onBlur={() => setZeiger(null)}
      >
        <svg viewBox={`0 0 ${brett.breite} ${brett.hoehe}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            {/* Das eine Raster, aus dem jede Murmel dieses Bretts gedruckt wird. */}
            <g id={murmelId}>
              {brett.schirm.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.r} />)}
            </g>
          </defs>

          {/* ── unten: die Bögen der möglichen Sprünge ── */}
          <g className="solitaer__boegen">
            {ziele.map((z) => (
              <path key={z.nach} className={"solitaer__bogen" + (tipp?.zug.nach === z.nach ? " solitaer__bogen--tipp" : "")} d={bogenPfad(brett, z)} />
            ))}
          </g>

          {/* ── Mitte: je Loch eine Gruppe ── */}
          {brett.loecher.map((l, i) => {
            const ziel = ziele.find((z) => z.nach === i);
            const istFlug = flug?.nach === i;
            const klasse = "solitaer__platz"
              + (feld[i] && beweglich.has(i) && stand === "spiel" ? " solitaer__platz--beweglich" : "")
              + (gewaehlt === i ? " solitaer__platz--gewaehlt" : "")
              + (ziel ? " solitaer__platz--ziel" : "")
              + (tipp?.zug.nach === i ? " solitaer__platz--tipp" : "");
            const weg = Math.round(Math.hypot(l.x - mitte.x, l.y - mitte.y));
            return (
              <g key={i} className={klasse} style={{ "--i": i, "--weg": weg } as React.CSSProperties}>
                <circle className="solitaer__loch" cx={l.x} cy={l.y} r={brett.radius * 0.22} />
                {ziel && <circle className="solitaer__ring" cx={l.x} cy={l.y} r={brett.radius * 0.85} pathLength={100} />}
                {feld[i] && !istFlug && (
                  <g className={"solitaer__murmel" + (andruck === i ? " solitaer__murmel--andruck" : "") + (letzte === i ? " solitaer__murmel--letzte" : "")} transform={`translate(${l.x} ${l.y})`}>
                    <g className="solitaer__leib">
                      <use href={`#${murmelId}`} />
                      {/* Die zweite Rasterlage: sie dreht sich langsam über der ersten, und
                          aus der Überlagerung entsteht ein wanderndes Moiré. Nur hier — eine
                          drehende Lage je Brett ist bezahlbar, 33 wären es nicht. */}
                      {gewaehlt === i && <use className="solitaer__moire" href={`#${murmelId}`} />}
                    </g>
                  </g>
                )}
                <circle className="solitaer__griff" cx={l.x} cy={l.y} r={brett.radius * 1.15} onClick={() => tippeAuf(i)} />
              </g>
            );
          })}

          {/* ── oben: alles, was sich bewegt ── */}
          <g className="solitaer__oben">
            {/* Die geschlagene Murmel zerstäubt: dieselben Punkte, von innen nach außen getrieben. */}
            {fort != null && (
              <g className="solitaer__zerfall" transform={`translate(${brett.loecher[fort].x} ${brett.loecher[fort].y})`}>
                {brett.schirm.map((p, i) => {
                  const l = Math.hypot(p.x, p.y) || 1;
                  const stil = {
                    "--vx": `${((p.x / l) * brett.radius * 0.95).toFixed(2)}px`,
                    "--vy": `${((p.y / l) * brett.radius * 0.95 - brett.radius * 0.3).toFixed(2)}px`,
                    "--takt": `${i * 2.2}ms`,
                  } as React.CSSProperties;
                  return <circle key={i} cx={p.x} cy={p.y} r={p.r} style={stil} />;
                })}
              </g>
            )}

            {/* Die fliegende Murmel — am Ziel gezeichnet, per Keyframe zurückgesetzt. */}
            {flug && (
              <g
                key={`flug-${verlauf.length}`}
                className="solitaer__murmel solitaer__murmel--flug"
                transform={`translate(${brett.loecher[flug.nach].x} ${brett.loecher[flug.nach].y})`}
                style={{ "--von-x": `${flug.vonX}px`, "--von-y": `${flug.vonY}px`, "--mit-x": `${flug.mitX}px`, "--mit-y": `${flug.mitY}px` } as React.CSSProperties}
              >
                <g className="solitaer__leib"><use href={`#${murmelId}`} /></g>
              </g>
            )}

            {welle != null && (
              <circle key={`welle-${verlauf.length}`} className="solitaer__aufsetzen" cx={brett.loecher[welle].x} cy={brett.loecher[welle].y} r={brett.radius} />
            )}

            {stand === "sieg" && letzte >= 0 && [0, 1].map((n) => (
              <circle key={n} className="solitaer__siegel" cx={mitte.x} cy={mitte.y} r={brett.radius} style={{ "--takt": `${n * 260}ms` } as React.CSSProperties} />
            ))}

            {zeiger != null && (
              <circle className="solitaer__zeiger" cx={brett.loecher[zeiger].x} cy={brett.loecher[zeiger].y} r={brett.radius * 1.15} />
            )}
          </g>
        </svg>
      </div>

      <Spielraum werte={spielraum} weite={brett.loecher.length} />

      <div className="solitaer__fuss">
        <p className="solitaer__stand" aria-live="polite">
          {stand === "sieg" && (meisterstueck
            ? <><b>Meisterstück.</b> Eine Murmel — und sie steht im Startloch.</>
            : <><b>Gelöst.</b> Eine Murmel bleibt.</>)}
          {stand === "fest" && <><b>Festgefahren</b> — {rest} Murmeln bleiben</>}
          {stand === "spiel" && <>Noch <b>{rest}</b> Murmeln · <b>{verlauf.length}</b> {verlauf.length === 1 ? "Zug" : "Züge"}</>}
          {bestwert !== undefined && <> · Bestwert <b>{bestwert}</b></>}
          {tipp && <span className="solitaer__wink"> · {tipp.sicher ? "dieser Sprung führt noch ans Ziel" : "hier geht noch etwas — ans Ziel wohl nicht mehr"}</span>}
        </p>
        <div className="solitaer__knoepfe">
          <button type="button" className="knopf knopf--klein" onClick={zurueck} disabled={!verlauf.length}>Zurück</button>
          <button type="button" className="knopf knopf--klein" onClick={zeigeTipp} disabled={stand !== "spiel"}>Tipp</button>
          <button type="button" className="knopf knopf--klein knopf--primaer" onClick={() => neuesSpiel(brettName)}>Neu</button>
        </div>
      </div>
    </div>
  );
}

/**
 * Der Spielraum: wie viele Sprünge nach jedem Zug noch offen waren.
 *
 * 🚨 Hier stand zuerst der Bestand an Murmeln — und das wäre in jeder Partie dieselbe
 * Gerade gewesen: ein Zug, eine Murmel, immer. Eine Kurve, die nichts weiß, ist Zierrat
 * mit Achsenbeschriftung.
 *
 * 🚨 Fester Zuschnitt, kein `preserveAspectRatio="none"`. Gestaucht würde aus dem
 * Kopfpunkt ein Ei, und der Kopfpunkt ist das Einzige, was sich hier bewegt.
 */
function Spielraum({ werte, weite }: { werte: number[]; weite: number }) {
  const BREIT = 320;
  const HOCH = 26;
  /* 🚨 Seitlicher Anschnitt. Ohne ihn liegt der erste Kopfpunkt genau auf x = 0 und wird
     zur Hälfte abgeschnitten — im leeren Spiel sieht die Kurve dann nach Fehler aus. */
  const RAND = 4;
  const gipfel = Math.max(8, ...werte);
  const schritte = Math.max(weite, werte.length);
  const punkte = werte.map((w, i): [number, number] => [
    RAND + (i / (schritte - 1)) * (BREIT - 2 * RAND),
    HOCH - 2 - (w / gipfel) * (HOCH - 5),
  ]);
  const kopf = punkte[punkte.length - 1];
  const jetzt = werte[werte.length - 1];
  return (
    <figure className="solitaer__raum">
      <figcaption className="solitaer__raumkopf">
        <span className="kicker">Spielraum</span>
        <span className="solitaer__raumwert"><b>{jetzt}</b> {jetzt === 1 ? "möglicher Sprung" : "mögliche Sprünge"}</span>
      </figcaption>
      <svg viewBox={`0 0 ${BREIT} ${HOCH}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <line className="solitaer__raumgrund" x1="0" y1={HOCH - 2} x2={BREIT} y2={HOCH - 2} />
        <polyline className="solitaer__raumlinie" points={punkte.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")} />
        <g className="solitaer__raumzeiger" style={{ transform: `translate(${kopf[0].toFixed(1)}px, ${kopf[1].toFixed(1)}px)` }}>
          <circle key={werte.length} className="solitaer__raumpuls" r="2" />
          <circle className="solitaer__raumpunkt" r="2.2" />
        </g>
      </svg>
    </figure>
  );
}
