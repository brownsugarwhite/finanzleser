"use client";

/**
 * Der Strom: eingefrorene Kapitel (Verlauf) + das lebende Kapitel (die aktuelle Seite).
 * Schnappschüsse sind reines HTML, Kopfzeile mit Nummer, Pfad, Uhrzeit;
 * aufklappen zeigt den statischen Inhalt, „erneut öffnen“ navigiert wirklich.
 *
 * Zwei Dinge stehen hier bewusst so:
 *
 *  1. Das Schnappschuss-HTML wird **erst beim Aufklappen** gesäubert und eingehängt.
 *     Vorher hingen bis zu acht komplette Artikelbäume im Dokument — unsichtbar
 *     (`.kapitel.zu .kapitel__inhalt { display: none }`), aber im DOM, und das kostet
 *     beim Scrollen.
 *  2. Während einer Navigation zeigt der Strom das Skelett und blendet die noch alte
 *     Seite aus (Port von `ladeDann`). Ausgeblendet statt ausgehängt, weil die alte
 *     Seite bis zur RSC-Antwort das einzige `#kapitel-live` ist, an dem der Provider
 *     erkennt, wann das neue Kapitel steht.
 */
import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useFaden } from "./FadenProvider";
import { saeubern } from "@/lib/faden/schnappschuss";
import LeoStrom from "./leo/LeoStrom";
import Einschub from "./Einschub";
import SkelettKapitel from "./SkelettKapitel";
import Zeitungskopf from "./Zeitungskopf";
import type { HeroZahlen } from "./hero/HeroLanding";
import InselnBeleben from "./kette/InselnBeleben";

function Schnappschuss({ html, id }: { html: string; id: string }) {
  const rein = useMemo(() => saeubern(html, id), [html, id]);
  const behaelter = useRef<HTMLDivElement>(null);
  const [wurzel, setWurzel] = useState<HTMLDivElement | null>(null);

  // 🚨 Das HTML wird EINMAL von Hand gesetzt, nicht über dangerouslySetInnerHTML.
  //
  // Sonst verwaltet React den Inhalt weiter: Bei irgendeiner Zustandsänderung im Provider
  // — Registerblatt öffnen, etwas in den Aktenkoffer legen — schrieb es den Inhalt neu.
  // Nachgemessen mit einem MutationObserver: genau eine Mutation, ein Knoten raus, einer
  // rein. Dabei sterben die Elemente, in die InselnBeleben hineinportaliert; die Portale
  // zeigten danach auf abgehängte Knoten, und ALLE Werkzeuge im aufgeklappten Kapitel
  // waren wieder leer. So gehört der Inhalt uns, und React fasst ihn nicht mehr an.
  useLayoutEffect(() => {
    const el = behaelter.current;
    if (!el) return;
    el.innerHTML = rein;
    setWurzel(el);
  }, [rein]);
  // 🚨 KEIN `inert`. Das machte jedes aufgeklappte Kapitel tot — auch die Ratgeberkarten
  // unter „Heute". Der Prototyp kennt kein inert; Links im eingefrorenen Kapitel fängt
  // derselbe Klick-Abfänger ab wie überall (FadenProvider) und navigiert normal.
  //
  // Text und Links braucht es dafür nur als HTML. Alles Anfassbare — Rechner, Checkliste,
  // Vergleich, Dokumente, Statistik-Bedienung, Leos Chips — hängt InselnBeleben als echte
  // React-Komponenten wieder ein (components/faden/kette/Insel.tsx). Weil der
  // Schnappschuss samt Markern in der Sitzung liegt, gilt das auch nach einem Neuladen.
  return (
    <>
      <div className="kapitel__schnappschuss" ref={behaelter} />
      <InselnBeleben wurzel={wurzel} stand={rein} />
    </>
  );
}

export default function Strom({ children }: { children: ReactNode; heroZahlen?: HeroZahlen }) {
  const { verlauf, kapitelUmschalten, navigieren, laedt } = useFaden();
  return (
    <div className={"strom" + (laedt ? " strom--laedt" : "")} id="strom">
      <Zeitungskopf />
      {verlauf.map((k, i) => (
        <Fragment key={k.id}>
        <section className={"kapitel kapitel--alt" + (k.offen ? "" : " zu")} id={`kapitel-alt-${k.id}`}>
          <div className="kapitel__kopf" onClick={() => { if (!k.offen) kapitelUmschalten(k.id); }}>
            <div className="kapitel__kopf-mitte">
              <span className="kicker">Kapitel {i + 1}{k.pfad.length ? " · " + k.pfad.join(" › ") : ""} · {k.zeit}</span>
              <h2>{k.titel}</h2>
              <button type="button" className="toggle-k" onClick={(e) => { e.stopPropagation(); kapitelUmschalten(k.id); }}>
                {k.offen ? "einklappen ▴" : "aufklappen ▾"}
              </button>
            </div>
          </div>
          {k.offen && <Einschub format="leaderboard" variante={i === 0 ? "top" : "feed"} nr={i} />}
          <div className="kapitel__inhalt">
            {k.offen && k.html ? (
              <Schnappschuss html={k.html} id={k.id} />
            ) : !k.html ? (
              <p className="kapitel__wieder">Dieses Kapitel lag vor dem Neuladen im Faden. <button type="button" className="textlink" onClick={() => navigieren(k.url)}>Erneut öffnen</button></p>
            ) : null}
            <div className="kapitel__wieder-zeile"><button type="button" className="textlink textlink--still" onClick={() => navigieren(k.url)}>Kapitel ans Ende des Fadens holen ↓</button></div>
          </div>
        </section>
        </Fragment>
      ))}
      {children}
      <LeoStrom />
      {laedt && <SkelettKapitel />}
      <div id="strom-ende" aria-hidden="true" />
    </div>
  );
}
