"use client";

/**
 * Der Beleg — Baustein 3 der Übergabe „Finanzleser Heute“.
 *
 * Neben der Bühne des Kassensturzes druckt sich ein Kassenbon mit: Kopf, je Frage eine
 * Zeile mit Thema, Punktführung, Antwort und dem, was sie am Stand bewegt hat, darunter
 * die Zwischensumme. Beim Buchen wackelt der Zettel kurz, die Zeile druckt sich, und die
 * Summe rollt auf ihren neuen Wert. Am Ende fällt der Stempel „GEPRÜFT“ samt Funken.
 *
 * 🚨 Der Zettel ist eine FLÄCHE, keine Tabelle: seine Unterkante ist ein Zickzack aus
 * `clip-path` (app/kassensturz.css). Deshalb steht der Inhalt in einem eigenen Kind —
 * `clip-path` beschneidet sonst auch den Stempel, der über die Kante ragen darf.
 *
 * 🚨 Die Summe zählt ABWÄRTS von 100. Warum, steht in `belegZeilen` (logik.ts): Unser
 * Fragenkatalog kommt aus dem CMS und kennt keine Punkte je Antwort; erfunden würden sie
 * hier nicht. Gezeigt wird stattdessen derselbe Score, der am Ende im Tacho steht,
 * aufgeschlüsselt nach Antworten.
 */
import { useEffect, useRef, useState } from "react";
import type { KassensturzDaten } from "@/lib/faden/optionen";
import { belegZeilen, ergebnis, type Antworten } from "./logik";

/** Der Spark-Pfad der Funken um den Stempel — derselbe wie im Zierelement des Fadens. */
const SPARK_D = "M12 6.00047C10.3384 5.64978 8.28716 5.41362 7.24241 3.91374C6.47491 2.81169 6.27276 1.28871 6.00024 0.000471365C5.61861 1.71435 5.40087 3.79684 3.79407 4.83384C2.69548 5.54325 1.25351 5.72142 0 6.01226C1.28705 6.29225 2.79561 6.48692 3.89751 7.25194C5.4174 8.30686 5.61672 10.3366 6.00024 12.0005C6.17594 11.1204 6.33322 10.2272 6.62463 9.37638C7.27878 7.46453 8.37832 6.85223 10.2643 6.37379L12 6.00047Z";
const FUNKEN = [
  { gr: 14, x: -18, y: -6, t: ".95s" },
  { gr: 10, x: 12, y: -14, t: "1.07s" },
  { gr: 12, x: 22, y: 10, t: "1.15s" },
  { gr: 9, x: -10, y: 16, t: "1.23s" },
];

/** Die Zahl rollt in 700 ms auf ihren neuen Wert (ease-out-cubic, wie im Kursblatt). */
function useRollen(ziel: number | null): number | null {
  const [zahl, setZahl] = useState(ziel);
  const von = useRef(ziel);
  useEffect(() => {
    if (ziel === null) { setZahl(null); von.current = null; return; }
    const start = von.current ?? ziel;
    von.current = ziel;
    if (start === ziel) { setZahl(ziel); return; }
    if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setZahl(ziel); return; }
    const t0 = performance.now();
    let ab = false;
    const takt = (t: number) => {
      if (ab) return;
      const p = Math.min(1, (t - t0) / 700);
      setZahl(Math.round(start + (ziel - start) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(takt);
    };
    requestAnimationFrame(takt);
    return () => { ab = true; };
  }, [ziel]);
  return zahl;
}

export default function Beleg({ daten, antworten, fertig }: { daten: KassensturzDaten; antworten: Antworten; fertig?: boolean }) {
  const zeilen = belegZeilen(daten, antworten);
  const gebucht = zeilen.filter((z) => z.gebucht).length;
  const summe = gebucht ? ergebnis(daten, antworten).score : null;
  const anzeige = useRollen(summe);

  /**
   * 🚨 Zwei Keyframes im Wechsel für das Wackeln des Zettels: derselbe Name ein zweites
   * Mal startet keine Animation. Dasselbe Verfahren wie in der Adresszeile und im
   * Kursblatt (useLauf).
   */
  const [lauf, setLauf] = useState(0);
  const zuletzt = useRef(gebucht);
  useEffect(() => {
    if (gebucht !== zuletzt.current) { zuletzt.current = gebucht; setLauf((n) => n + 1); }
  }, [gebucht]);

  return (
    <aside className="ks-beleg" aria-label="Ihr Beleg">
      <div
        className="ks-beleg__zettel"
        style={lauf ? { animation: `ks-bon${lauf % 2 ? "" : "2"} .35s ease` } : undefined}
      >
        <div className="ks-beleg__innen">
          <div className="ks-beleg__kopf">
            <b>Kassensturz</b>
            <span>finanzleser.de · Beleg № {String(gebucht).padStart(2, "0")}{String(zeilen.length).padStart(2, "0")}</span>
          </div>
          <i className="ks-beleg__riss" aria-hidden="true" />

          <ol className="ks-beleg__zeilen">
            {zeilen.map((z) => (
              <li key={z.id} className={z.gebucht ? "ist-gebucht" : undefined}>
                <span className="ks-beleg__nr">{z.nr}</span>
                <span className="ks-beleg__thema">{z.thema}<i className="inhalt__linie" aria-hidden="true" /></span>
                <span className="ks-beleg__wert">{z.wert}</span>
                {/* Punkte und Haken teilen sich EINE Zelle — als eigene Spalte brach der
                    Haken in die nächste Zeile, sobald der Wert breiter wurde. */}
                <span className={"ks-beleg__punkte" + (z.punkte && z.punkte > 0 ? " ist-plus" : z.punkte && z.punkte < 0 ? " ist-minus" : "")}>
                  {z.punkte === null ? "" : z.punkte > 0 ? `+${z.punkte}` : String(z.punkte)}
                  {z.punkte !== null && z.punkte > 0 && (
                    <svg className="ks-beleg__haken" viewBox="0 0 10 9" aria-hidden="true"><path d="M1 4.6l2.6 2.6L9 1" /></svg>
                  )}
                </span>
              </li>
            ))}
          </ol>

          <i className="ks-beleg__riss" aria-hidden="true" />
          <div className="ks-beleg__summe">
            <b>{fertig ? "Summe" : "Zwischensumme"}</b>
            <span className={lauf ? "ks-beleg__zahl ist-frisch" : "ks-beleg__zahl"} key={lauf}>
              {anzeige === null ? "—" : anzeige}<small>/ 100</small>
            </span>
          </div>
          <i className="doppellinie" aria-hidden="true" />
          <p className="ks-beleg__fuss">
            {fertig ? "Vielen Dank. Beleg als PDF unten anfordern." : gebucht ? `${gebucht} von ${zeilen.length} gebucht` : "Noch nichts gebucht · Fragen antippen"}
          </p>
        </div>

        {fertig && (
          <span className="ks-beleg__stempel" aria-hidden="true">
            Geprüft
            {FUNKEN.map((f, i) => (
              <svg key={i} className="ks-beleg__funke" viewBox="0 0 12 12.0005" width={f.gr} height={f.gr} style={{ left: `calc(50% + ${f.x}px)`, top: `calc(50% + ${f.y}px)`, animationDelay: f.t }}>
                <path d={SPARK_D} fill="currentColor" />
              </svg>
            ))}
          </span>
        )}
      </div>
    </aside>
  );
}
