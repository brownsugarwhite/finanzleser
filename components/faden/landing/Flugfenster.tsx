"use client";

/**
 * Das Flugfenster unter „Aus unserem Newsletter": zwei Linien im Textfluss, dazwischen
 * ein Fenster in voller Satzbreite. Dahinter fliegt ein Papierflieger aus Zeitungspapier
 * Richtung Horizont — drei Wolkenlagen, die nacheinander aus dem Fluchtpunkt wachsen.
 *
 * 🚨 Der Trick sitzt im CSS, nicht hier: Die Bühne ist `position: fixed` und hängt am
 * Viewport, das Fenster beschneidet sie mit `clip-path`. Beim Scrollen wandert das
 * Fenster über ein stehendes Bild. Warum `clip-path` und nicht `overflow` — und was an
 * Vorfahren deshalb NICHT stehen darf — steht in app/flugfenster.css.
 *
 * Hier stehen nur die drei Dinge, die JavaScript braucht:
 *   1. Die Bilder (360 kB) kommen erst, wenn der Block in die Nähe des Fensters gerät.
 *   2. Außer Sicht ruht die Schleife — drei große Lagen kosten sonst dauerhaft Compositing.
 *   3. Der Flieger folgt Maus und Scrollstand, weich nachgezogen.
 *
 * 🚨 Der Block steckt in einer `Insel` (components/faden/kette/Insel.tsx). Ohne sie wäre
 * er nach dem ersten Kapitelwechsel ein Foto: Der Schnappschuss leert Inseln und hängt
 * sie beim Aufklappen als echte Komponente wieder ein.
 */
import { useEffect, useState } from "react";

/** Von hinten nach vorn — 1 ist die fernste Lage, 3 die, die einen streift. */
const WOLKEN = ["w1", "w2", "w3"] as const;

/** Wie träge Flieger und Blickwinkel nachziehen (0 = klebt, 1 = springt). */
const ZUG_MAUS = 0.08;
const ZUG_SCROLL = 0.14;
/** Ab hier gilt die Bewegung als ausgelaufen und die Schleife hält an. */
const RUHE = 0.001;

export default function Flugfenster() {
  // 🚨 Die beiden Knoten stehen im STATE, nicht in einem `useRef`.
  //
  // Ein Ref meldet nicht, wenn React den Knoten austauscht: Der Effekt mit `[]` läuft
  // genau einmal, der IntersectionObserver hing danach an einem abgehängten Element und
  // meldete für immer „nicht sichtbar" — das Fenster blieb beim leeren Farbverlauf
  // stehen, obwohl es mitten im Bild stand (gemessen 16.09.2026: ein frisch gesetzter
  // Beobachter auf denselben Knoten meldete isIntersecting true, die Komponente hatte
  // weiter nah=false). Mit dem Knoten im State läuft der Effekt bei jedem Austausch neu.
  // Dasselbe Muster wie `setWurzel` in components/faden/Strom.tsx.
  const [fenster, setFenster] = useState<HTMLDivElement | null>(null);
  const [flieger, setFlieger] = useState<HTMLImageElement | null>(null);
  const [nah, setNah] = useState(false);
  const [geladen, setGeladen] = useState(false);

  // Nähe zum Viewport: großzügiger Vorlauf, damit die Bilder da sind, bevor man sie sieht.
  // Dasselbe Signal hält die Schleife an, sobald der Block weit genug weg ist.
  useEffect(() => {
    if (!fenster) return;
    if (typeof IntersectionObserver !== "function") { setNah(true); setGeladen(true); return; }
    const beobachter = new IntersectionObserver(
      ([eintrag]) => {
        setNah(eintrag.isIntersecting);
        if (eintrag.isIntersecting) setGeladen(true);
      },
      { rootMargin: "600px 0px" },
    );
    beobachter.observe(fenster);
    return () => beobachter.disconnect();
  }, [fenster]);

  // Der Flieger: Maus und Scrollstand auf drei Zahlen zwischen -1 und 1, die das CSS zu
  // Verschiebung, Nicken, Rollen und Gieren verrechnet.
  useEffect(() => {
    const el = fenster;
    const bild = flieger;
    if (!el || !bild || !nah) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const klemm = (v: number) => Math.max(-1, Math.min(1, v));
    const fortschritt = () => {
      const r = el.getBoundingClientRect();
      return klemm((r.top + r.height / 2 - window.innerHeight / 2) / (window.innerHeight / 2));
    };

    let zielX = 0, zielY = 0, istX = 0, istY = 0;
    // 🚨 Der Scrollstand startet auf seinem ECHTEN Wert, nicht auf 0. Sonst kippt der
    // Flieger beim Auftauchen erst einmal sichtbar in seine Lage hinein.
    let sp = fortschritt();
    let laeuft = false, ab = false;

    const setzen = () => {
      bild.style.setProperty("--mx", istX.toFixed(4));
      bild.style.setProperty("--my", istY.toFixed(4));
      bild.style.setProperty("--sp", sp.toFixed(4));
    };
    setzen();

    const takt = () => {
      if (ab) return;
      istX += (zielX - istX) * ZUG_MAUS;
      istY += (zielY - istY) * ZUG_MAUS;
      const zielSp = fortschritt();
      sp += (zielSp - sp) * ZUG_SCROLL;
      setzen();
      const ruhig = Math.abs(zielX - istX) < RUHE && Math.abs(zielY - istY) < RUHE && Math.abs(zielSp - sp) < RUHE;
      if (ruhig) laeuft = false;
      else requestAnimationFrame(takt);
    };
    const anstossen = () => { if (!laeuft) { laeuft = true; requestAnimationFrame(takt); } };

    const zeiger = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      zielX = klemm((e.clientX - (r.left + r.width / 2)) / (r.width / 2));
      zielY = klemm((e.clientY - (r.top + r.height / 2)) / (r.height / 2));
      anstossen();
    };
    window.addEventListener("pointermove", zeiger, { passive: true });
    window.addEventListener("scroll", anstossen, { passive: true });
    window.addEventListener("resize", anstossen, { passive: true });
    anstossen();

    return () => {
      ab = true;
      window.removeEventListener("pointermove", zeiger);
      window.removeEventListener("scroll", anstossen);
      window.removeEventListener("resize", anstossen);
    };
  }, [fenster, flieger, nah]);

  return (
    <section className="flugfenster" data-ruht={nah ? undefined : ""} aria-labelledby="flug-kicker">
      {/* Die Aufforderung steht ÜBER der ersten Linie (Wunsch 17.09.2026) — sie ist der
          Blockkopf des Flugs, und der Flug führt zum Eintragen darunter. Damit trägt der
          Abschnitt einen Namen und ist nicht mehr `aria-hidden`; nur die Bilder selbst
          bleiben für den Vorleser stumm. */}
      <span className="kicker kicker--gruen flugfenster__kicker" id="flug-kicker">Newsletter abonnieren</span>
      <i className="flugfenster__linie" />
      <div className="flugfenster__ausschnitt" ref={setFenster} aria-hidden="true">
        {geladen && (
          <>
            <div className="flugfenster__buehne">
              <div className="flugfenster__lage flugfenster__lage--himmel">
                <img src="/assets/flug/himmel.webp" width={1046} height={1046} alt="" decoding="async" />
              </div>
              {WOLKEN.map((w, i) => (
                <div key={w} className={`flugfenster__lage flugfenster__lage--wolke flugfenster__lage--${w}`}>
                  <img src={`/assets/flug/wolken-${i + 1}.webp`} width={1046} height={1046} alt="" decoding="async" />
                </div>
              ))}
            </div>
            <div className="flugfenster__flieger">
              <img ref={setFlieger} src="/assets/flug/flieger.webp" width={1007} height={535} alt="" decoding="async" />
            </div>
          </>
        )}
      </div>
      <i className="flugfenster__linie" />
    </section>
  );
}
