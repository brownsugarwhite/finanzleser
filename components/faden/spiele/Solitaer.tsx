"use client";

/**
 * Solitär — das Brettspiel mit den Murmeln (nicht das Kartenspiel).
 *
 * Vorlage: `Finanzleser Solitär - Rätselseite.dc.html` (Handoff vom 17.09.2026).
 * Brett und Regeln stehen in `lib/faden/solitaer.ts`, das Aussehen in `app/solitaer.css`.
 *
 * Die Vorlage ist 1 : 1 nachgebaut. Vier Stellen, an denen bewusst etwas anderes steht:
 *
 *  1. **Kein Inline-Style.** Die Vorlage schreibt jede Regel ans Element; hier tragen
 *     Klassen die Gestalt und Inline-Werte nur noch DATEN: Lage im Raster (`left`/`top`),
 *     Drehwinkel des Katzenauges, Taktversatz einer Animation. Nichts davon ließe sich
 *     sinnvoll in ein Stylesheet heben, alles andere schon.
 *  2. **Murmeln sind Knöpfe, keine Divs.** Die Löcher sind in der Vorlage schon
 *     `<button>`; die Murmeln liegen darüber und fangen den Klick, waren aber mit der
 *     Tastatur nicht erreichbar. Als Knopf sehen sie gleich aus und lassen sich bedienen.
 *  3. **Der Stempel nimmt das Haus-Keyframe** `fl-stempel` (Endwinkel −4°) statt der −11°
 *     der Vorlage. `@keyframes` sind global: `fl-stempel` steht in kursblatt.css und
 *     wurde am 16.09.2026 ausdrücklich von −11° auf −4° gesetzt („weniger rotiert").
 *     Ein zweiter Stempelwinkel im Haus wäre eine Regel gegen eine Entscheidung.
 *  4. **Die Punkte werden gezeigt, nicht gutgeschrieben.** Eine Stempelkarte gibt es im
 *     Repo noch nicht (`grep -ri stempelkarte` → nichts). Die Zeile steht wie entworfen da.
 *
 * 🚨 Der Neustart-Trick der Übergabe (wie in kursblatt.css beschrieben): Eine laufende
 * Keyframe-Animation lässt sich nicht neu starten, ohne den Knoten aus dem DOM zu nehmen.
 * Deshalb gibt es jede Animation doppelt (`fl-hop`/`fl-hop2`), und ein Zähler wechselt bei
 * jedem Auslösen die Klasse. Wer den Zwilling wegoptimiert, bekommt einen zweiten Sprung,
 * der still bleibt.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import {
  BRETTER, alleZuege, aufstellen, bei, bewerten, platz, raster, ringAbstand, zellen,
  zielLoch, zuegeFuer,
  type Brettart, type Ergebnis, type Murmel, type Zug,
} from "@/lib/faden/solitaer";

/* Zeiten der Vorlage, in Millisekunden. Alle werden mit dem Tempo skaliert; dieselben
   Werte stehen als `calc(… * var(--tempo))` in app/solitaer.css. */
const AUFBAU_MS = 1700;     // so lange rieseln die Murmeln ins Brett
const FALL_MS = 380;        // so lange fällt die geschlagene Murmel, dann ist sie weg
const ROLL_AUFBAU = 1300;   // der Zähler rollt von 0 auf die volle Zahl
const ROLL_ZUG = 600;
const ROLL_ZURUECK = 500;
const ENG = 560;            // darunter steht die Seitenspalte unter dem Brett

const TEMPO = { ruhig: 1.35, normal: 1, lebhaft: 0.65 } as const;
export type Tempo = keyof typeof TEMPO;

type Schnappschuss = { murmeln: Murmel[]; raus: number[]; zuege: number };

export default function Solitaer({
  brett: anfangsBrett = "englisch", ziele = true, tempo = "normal",
}: { brett?: Brettart; ziele?: boolean; tempo?: Tempo } = {}) {
  const T = TEMPO[tempo];

  /* Das Brett ist im Handoff ein Regler des Prototyps. Im Produkt darf der Leser wählen —
     die drei Bretter sind verschieden schwer, und das Dreieck ist der Einstieg. */
  const [brett, setBrett] = useState<Brettart>(anfangsBrett);
  const [murmeln, setMurmeln] = useState<Murmel[]>(() => aufstellen(anfangsBrett));
  const [sel, setSel] = useState(-1);
  const [hov, setHov] = useState(-1);
  const [hist, setHist] = useState<Schnappschuss[]>([]);
  const [zuege, setZuege] = useState(0);
  const [aufbau, setAufbau] = useState(true);
  const [hop, setHop] = useState(-1);
  const [hopN, setHopN] = useState(0);
  const [wackel, setWackel] = useState(-1);
  const [wackelN, setWackelN] = useState(0);
  const [raus, setRaus] = useState<number[]>([]);
  const [fertig, setFertig] = useState<Ergebnis | null>(null);
  const [uebrig, setUebrig] = useState(0);
  const [eng, setEng] = useState(false);

  const wurzel = useRef<HTMLElement | null>(null);
  const uhren = useRef<number[]>([]);
  const roller = useRef(0);
  const murmelnRef = useRef(murmeln);
  murmelnRef.current = murmeln;

  const merke = useCallback((id: number) => { uhren.current.push(id); }, []);
  const haltAn = useCallback(() => { uhren.current.forEach(clearTimeout); uhren.current = []; cancelAnimationFrame(roller.current); }, []);
  useEffect(() => haltAn, [haltAn]);

  /**
   * Der Zähler rollt, statt zu springen — rAF mit ease-out-cubic (Vorlage `rollen`).
   *
   * 🚨 Der Startpunkt ist die ERSTE Bildmarke, nicht `performance.now()`. Die Vorlage
   * nimmt letzteres, und damit ist der Fortschritt im ersten Bild negativ: die Zeitmarke,
   * die rAF übergibt, ist der Beginn des laufenden Bildes und liegt vor dem Moment, in
   * dem die Schleife bestellt wurde. Aus `1 − (1−p)³` wird dann ein negativer Faktor —
   * auf dem frischen Brett stand „−1 auf dem Brett". Zusätzlich ist der Fortschritt nach
   * unten gedeckelt, damit eine ausgebremste Bildfolge (Hintergrund-Tab) nichts anderes
   * anrichten kann als zu stocken.
   */
  const rollen = useCallback((nach: number, dauer: number) => {
    cancelAnimationFrame(roller.current);
    let von = 0;
    setUebrig((jetzt) => { von = jetzt; return jetzt; });
    let t0 = 0;
    const schritt = (jetzt: number) => {
      if (!t0) t0 = jetzt;
      const p = Math.min(1, Math.max(0, (jetzt - t0) / (dauer * T)));
      const e = 1 - Math.pow(1 - p, 3);
      setUebrig(von + (nach - von) * e);
      if (p < 1) roller.current = requestAnimationFrame(schritt);
    };
    roller.current = requestAnimationFrame(schritt);
  }, [T]);

  const neu = useCallback(() => {
    haltAn();
    const frisch = aufstellen(brett);
    setMurmeln(frisch);
    setSel(-1); setHov(-1); setHist([]); setZuege(0); setRaus([]);
    setFertig(null); setAufbau(true); setHop(-1); setWackel(-1); setUebrig(0);
    rollen(frisch.length, ROLL_AUFBAU);
    merke(window.setTimeout(() => setAufbau(false), AUFBAU_MS * T));
  }, [brett, haltAn, merke, rollen, T]);

  /* Aufstellen beim ersten Bild und bei jedem Brettwechsel. `neu` hängt nur an `brett`
     und am Tempo — beides ändert sich zur Laufzeit nicht, der Effekt läuft also genau
     einmal je Brett. */
  useEffect(() => { neu(); }, [neu]);

  /* Eng oder breit — die Vorlage misst die eigene Breite, nicht das Fenster. Im Faden ist
     das Pflicht: die Randspalten fahren als Schubladen ein und aus, das Spiel ändert dabei
     seine Breite ohne jeden Fensterwechsel. */
  useEffect(() => {
    const el = wurzel.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((es) => {
      const b = es[0].contentRect.width;
      if (b > 0) setEng(b < ENG);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const offen = useMemo(() => alleZuege(brett, murmeln), [brett, murmeln]);
  const selM = murmeln.find((m) => m.id === sel && !m.weg);
  const zielListe = useMemo(() => (selM ? zuegeFuer(brett, selM, murmeln) : []), [brett, selM, murmeln]);

  const ziehen = useCallback((z: Zug) => {
    const alt = murmelnRef.current;
    setHist((h) => [...h, { murmeln: alt.map((m) => ({ ...m })), raus: [...raus], zuege }]);
    setMurmeln(alt.map((m) => (m.id === z.id ? { ...m, r: z.r, c: z.c } : m.id === z.mid ? { ...m, faellt: true } : m)));
    setSel(-1); setHov(-1);
    setZuege((n) => n + 1);
    setHop(z.id);
    setHopN((n) => n + 1);
    merke(window.setTimeout(() => {
      // Erst jetzt ist die Murmel wirklich vom Brett: der Fall ist zu Ende, sie wandert
      // in die Schale, der Zähler rollt nach, und es wird geprüft, ob noch etwas geht.
      const nach = murmelnRef.current.map((m) => (m.faellt ? { ...m, faellt: false, weg: true } : m));
      const stehen = nach.filter((m) => !m.weg).length;
      setMurmeln(nach);
      setRaus((r) => [...r, z.mid]);
      const ziel = zielLoch(brett);
      setFertig(alleZuege(brett, nach).length ? null : { n: stehen, mitte: !!bei(nach, ziel.r, ziel.c) });
      setHop(-1);
      rollen(stehen, ROLL_ZUG);
    }, FALL_MS * T));
  }, [brett, merke, raus, rollen, T, zuege]);

  const klickMurmel = useCallback((m: Murmel) => {
    if (fertig || m.weg || m.faellt || aufbau) return;
    if (sel === m.id) { setSel(-1); return; }
    if (zuegeFuer(brett, m, murmeln).length) { setSel(m.id); return; }
    // Eine Murmel, die nicht springen kann, sagt das — sie wackelt und bleibt liegen.
    setWackel(m.id);
    setWackelN((n) => n + 1);
    setSel(-1);
  }, [aufbau, brett, fertig, murmeln, sel]);

  const klickLoch = useCallback((r: number, c: number) => {
    if (fertig || aufbau) return;
    const hierher = offen.filter((z) => z.r === r && z.c === c);
    if (sel >= 0) {
      const z = hierher.find((z) => z.id === sel);
      if (z) ziehen(z); else setSel(-1);
      return;
    }
    // Ohne Auswahl: ein leeres Loch, das genau EINE Murmel erreichen kann, springt sofort.
    if (hierher.length === 1) ziehen(hierher[0]);
  }, [aufbau, fertig, offen, sel, ziehen]);

  const zurueck = useCallback(() => {
    const h = hist[hist.length - 1];
    if (!h) return;
    haltAn();
    setMurmeln(h.murmeln);
    setRaus(h.raus);
    setZuege(h.zuege);
    setHist((alt) => alt.slice(0, -1));
    setSel(-1); setFertig(null); setHop(-1);
    rollen(h.murmeln.filter((m) => !m.weg).length, ROLL_ZURUECK);
  }, [haltAn, hist, rollen]);

  const wertung = fertig ? bewerten(fertig, brett) : null;
  const zahl = Math.round(uebrig);
  const status = fertig
    ? (wertung!.geloest ? "Gelöst" : "Kein Zug mehr")
    : aufbau ? "Die Murmeln legen sich"
    : selM ? `Murmel gewählt · ${zielListe.length} ${zielListe.length === 1 ? "Ziel" : "Ziele"}`
    : `Ihr Zug · ${offen.length} möglich`;
  const statusTakt = useTakt(status);
  const plaetze = zellen(brett);
  const masse = raster(brett);
  const inDerMitte = brett === "dreieck" ? "in der Spitze, wo sie begonnen hat" : "genau in der Mitte";

  return (
    <section className="solitaer" ref={wurzel} style={tempo === "normal" ? undefined : { "--tempo": T } as React.CSSProperties}>
      {/* 🚨 Die Kopfzeile ist `.spiel-kopf` aus app/spiele.css — dieselbe wie bei Schlange,
          Finanzwort, Quiz und Mythos: grauer Kicker links, Kursivhinweis rechts, darunter
          die Tintenlinie. Die Vorlage setzt hier einen grünen Kicker mit pulsendem Punkt;
          beides ist gestrichen. Der Punkt meldet im „Heute"-Idiom „läuft gerade" — an
          einem Spiel ohne Zeitdruck meldet er nichts. Und ein Kicker, der sich je Spiel
          anders färbt, ist keine Kopfzeile mehr, sondern Dekor (SpielKopf.tsx). Die
          Spielfarbe trägt die 3-px-Linie über dem Block, nicht die Schrift.
          Der Status steht im Hinweis-Platz und druckt sich bei jeder Änderung neu ein. */}
      <div className="spiel-kopf">
        <span className="kicker">Solitär · Das Brett · ohne Zeitdruck</span>
        <span className={`spiel-kopf__hinweis solitaer__status solitaer__status--${statusTakt ? "b" : "a"}`} aria-live="polite">{status}</span>
      </div>
      <h3 className="solitaer__titel">Eine Murmel soll bleiben.</h3>
      <p className="solitaer__anriss">Springen Sie über eine Nachbarin in ein leeres Loch – die übersprungene verlässt das Brett. Am Ende bleibt im besten Fall eine einzige, {inDerMitte}.</p>

      <div className={"solitaer__satz" + (eng ? " solitaer__satz--eng" : "")}>
        <div className="solitaer__spalte">
          <div
            className="solitaer__brett"
            onMouseLeave={() => setHov(-1)}
            style={{
              "--so-zelle": `${masse.zelle.toFixed(3)}%`,
              "--so-halb": `${(-masse.zelle / 2).toFixed(3)}%`,
              "--so-murmel": `${masse.murmel.toFixed(3)}%`,
              "--so-murmel-halb": `${(-masse.murmel / 2).toFixed(3)}%`,
            } as React.CSSProperties}
          >
            {plaetze.map((z) => {
              const belegt = !!bei(murmeln, z.r, z.c);
              const ziel = ziele && zielListe.some((t) => t.r === z.r && t.c === z.c);
              const erreichbar = !belegt && !selM && offen.filter((t) => t.r === z.r && t.c === z.c).length === 1;
              return (
                <button
                  key={`${z.r}-${z.c}`}
                  type="button"
                  className={"solitaer__loch" + (ziel ? " solitaer__loch--ziel" : "") + (belegt ? " solitaer__loch--belegt" : "") + (ziel || erreichbar ? " solitaer__loch--offen" : "")}
                  style={platz(brett, z.r, z.c)}
                  aria-label={`Loch ${z.r + 1}/${z.c + 1}`}
                  onClick={() => klickLoch(z.r, z.c)}
                >
                  <i className="solitaer__schale" />
                  <i className="solitaer__zielring" />
                </button>
              );
            })}

            {murmeln.map((m) => {
              const gewaehlt = m.id === sel;
              const zeigt = m.id === hov && !gewaehlt && !fertig;
              const kann = zuegeFuer(brett, m, murmeln).length > 0;
              const letzte = !!fertig && !m.weg;
              const klasse = ["solitaer__murmel"];
              if (m.faellt) klasse.push("solitaer__murmel--faellt");
              else if (gewaehlt) klasse.push("solitaer__murmel--gewaehlt");
              else if (zeigt && kann) klasse.push("solitaer__murmel--zeigt");
              else if (letzte) klasse.push("solitaer__murmel--letzte");
              if (m.weg) klasse.push("solitaer__murmel--weg");
              if (kann && !fertig) klasse.push("solitaer__murmel--kann");
              if (aufbau) klasse.push("solitaer__murmel--rieselt");
              else if (hop === m.id) klasse.push(`solitaer__murmel--hop-${hopN % 2 ? "b" : "a"}`);
              else if (wackel === m.id) klasse.push(`solitaer__murmel--wackel-${wackelN % 2 ? "b" : "a"}`);
              return (
                <button
                  key={m.id}
                  type="button"
                  className={klasse.join(" ")}
                  style={{ ...platz(brett, m.r, m.c), "--rot": `${m.rot}deg`, "--takt": `${takt(brett, m.r, m.c)}s` } as React.CSSProperties}
                  aria-label={`Murmel ${m.r + 1}/${m.c + 1}`}
                  aria-hidden={m.weg || undefined}
                  tabIndex={m.weg ? -1 : undefined}
                  onClick={() => klickMurmel(m)}
                  onMouseEnter={() => setHov(m.id)}
                >
                  {/* Das Katzenauge: ein Band im Glas, je Murmel anders gedreht. Es dreht
                      sich nur, solange die Murmel in der Hand liegt oder als letzte steht. */}
                  <span className="solitaer__auge">
                    <span className={"solitaer__augeDreh" + (gewaehlt || letzte ? ` solitaer__augeDreh--dreht${letzte ? " solitaer__augeDreh--schnell" : ""}` : "")}>
                      <i className="solitaer__band" />
                    </span>
                  </span>
                  <i className="solitaer__glanz" />
                </button>
              );
            })}

            {wertung && (
              <div className="solitaer__stempelplatz">
                <div className={"solitaer__stempel" + (wertung.gruen ? " solitaer__stempel--gruen" : "")}>{wertung.stempel}</div>
                {wertung.geloest && FUNKEN.map((f, i) => (
                  <svg key={i} viewBox="0 0 12 12" className="solitaer__funke" style={{ left: f.l, top: f.t, width: f.g, height: f.g, "--takt": `${0.95 + i * 0.1}s` } as React.CSSProperties} aria-hidden="true">
                    <path d="M12 6.00047C10.3384 5.64978 8.28716 5.41362 7.24241 3.91374C6.47491 2.81169 6.27276 1.28871 6.00024 0.000471365C5.61861 1.71435 5.40087 3.79684 3.79407 4.83384C2.69548 5.54325 1.25351 5.72142 0 6.01226C1.28705 6.29225 2.79561 6.48692 3.89751 7.25194C5.4174 8.30686 5.61672 10.3366 6.00024 12.0005C6.17594 11.1204 6.33322 10.2272 6.62463 9.37638C7.27878 7.46453 8.37832 6.85223 10.2643 6.37379L12 6.00047Z" />
                  </svg>
                ))}
              </div>
            )}
          </div>
          <p className="solitaer__wink">Murmel antippen, dann das Ziel. Ein leeres Loch antippen springt sofort, wenn nur eine Murmel es erreichen kann.</p>
        </div>

        <div className="solitaer__rand">
          <div className="solitaer__kennzahlen">
            <div className="solitaer__kennzahl">
              <span className="kicker">Auf dem Brett</span>
              <b className={`solitaer__zahl solitaer__zahl--tick-${zuege % 2 ? "b" : "a"}` + (fertig ? (wertung!.geloest ? " solitaer__zahl--gruen" : "") : zahl <= 3 ? " solitaer__zahl--gruen" : "")}>{zahl}</b>
              <span className="solitaer__sub">Ziel: eine</span>
            </div>
            <div className="solitaer__kennzahl solitaer__kennzahl--rechts">
              <span className="kicker">Züge</span>
              <b className="solitaer__zahl">{zuege}</b>
              <span className="solitaer__sub">{zuege === 0 ? "noch keiner" : zuege === 1 ? "ein Sprung" : "Sprünge"}</span>
            </div>
          </div>

          <div className="solitaer__ausgang">
            <span className="kicker solitaer__ausgangKopf">Aus dem Spiel</span>
            <div className="solitaer__schaleRaster">
              {Array.from({ length: plaetze.length - 1 }, (_, i) => {
                const id = raus[i];
                const m = id !== undefined ? murmeln.find((x) => x.id === id) : undefined;
                return (
                  <i key={i} className="solitaer__slot">
                    {m && <i className="solitaer__mini" style={{ "--rot": `${m.rot}deg` } as React.CSSProperties}><i className="solitaer__miniBand" /></i>}
                  </i>
                );
              })}
            </div>
          </div>

          {wertung && (
            <div className="solitaer__ergebnis">
              <span className={"kicker" + (wertung.gruen ? " kicker--gruen" : "")}>{wertung.rang}</span>
              <p className="solitaer__rangtext">{wertung.text}</p>
              {wertung.punkte && <span className="solitaer__punkte">{wertung.punkte} auf Ihrer Stempelkarte</span>}
            </div>
          )}

          <div className="solitaer__brettwahl">
            <span className="kicker solitaer__ausgangKopf">Brett</span>
            <div className="chips solitaer__chips">
              {BRETTER.map((b) => (
                <button key={b.art} type="button" className="chip" aria-pressed={b.art === brett} onClick={() => setBrett(b.art)}>
                  {b.name}<span className="solitaer__chipzahl">{b.loecher}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="solitaer__taten">
            <button type="button" className="strich-link solitaer__tat solitaer__tat--zurueck" onClick={zurueck} disabled={!hist.length}>
              <i /><span>Zug zurück</span>
            </button>
            <button type="button" className="strich-link solitaer__tat" onClick={neu}>
              <span>Neu aufstellen</span><i />
            </button>
          </div>

          {fertig && <Button label="Noch einmal" onClick={neu} className="solitaer__nochmal" />}
        </div>
      </div>

      <p className="solitaer__fuss">{FUSSNOTE[brett]}</p>
    </section>
  );
}

/* ── Kleinkram ──────────────────────────────────────────────────────────────────── */

/** Der Takt, in dem eine Murmel beim Aufstellen fällt: vom Startloch nach außen, leicht
    versetzt, damit die Ringe nicht wie eine Welle im Gleichschritt einschlagen. */
const takt = (art: Brettart, r: number, c: number) =>
  (0.08 + ringAbstand(art, r, c) * 0.1 + ((r * 7 + c) % 3) * 0.03).toFixed(2);

/** Die Fußnote gehört zum Brett — sie nennt seine Zahlen. */
const FUSSNOTE: Record<Brettart, string> = {
  englisch: "Das englische Brett hat 33 Löcher und 32 Murmeln. Eine einzige in der Mitte zu lassen, gilt seit dem 17. Jahrhundert als die schönste Lösung.",
  europäisch: "Das europäische Brett ist vier Löcher größer — 37 und 36 Murmeln. Es sieht leichter aus und ist es nicht.",
  dreieck: "Das Dreieck hat 15 Löcher und 14 Murmeln. Es ist das freundlichste der drei: Wer es löst, landet immer in der Spitze, in der er begonnen hat.",
};

/** Die vier Funken an den Ecken des Stempels (Vorlage). */
const FUNKEN = [
  { l: "-14px", t: "-18px", g: "13px" },
  { l: "calc(100% - 2px)", t: "-12px", g: "11px" },
  { l: "-8px", t: "calc(100% - 4px)", g: "10px" },
  { l: "calc(100% - 6px)", t: "calc(100% - 6px)", g: "14px" },
];

/**
 * Wechselt bei jeder Änderung des Werts — daraus wird der Zwillingsname der Animation.
 * 🚨 Ohne das bliebe der Status beim zweiten Wechsel still: eine laufende Keyframe-
 * Animation startet nicht neu, solange Name und Knoten dieselben sind.
 */
function useTakt(wert: string): boolean {
  const letzter = useRef(wert);
  const [an, setAn] = useState(false);
  if (letzter.current !== wert) {
    letzter.current = wert;
    queueMicrotask(() => setAn((a) => !a));
  }
  return an;
}
