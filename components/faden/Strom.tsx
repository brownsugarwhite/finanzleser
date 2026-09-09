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
import { Fragment, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useFaden } from "./FadenProvider";
import { saeubern } from "@/lib/faden/schnappschuss";
import { useErscheinen } from "@/lib/faden/erscheinen";
import LeoStrom from "./leo/LeoStrom";
import Einschub from "./Einschub";
import SkelettKapitel from "./SkelettKapitel";
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
  // Auftritte im eingefrorenen Kapitel: Was der Leser vor dem Einfrieren schon im Bild
  // hatte, trägt `ist-da` und bleibt stehen; der Rest tritt beim Aufklappen neu auf.
  useErscheinen(wurzel, rein);
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

export default function Strom({ children }: { children: ReactNode }) {
  const { verlauf, kapitelUmschalten, navigieren, laedt } = useFaden();
  const pathname = usePathname();
  // Ein Beobachter für den ganzen Strom — er fängt serverseitig gerenderte Kapitel,
  // eingehängte Schnappschüsse und die per Portal nachgereichten Insel-Körper.
  useErscheinen();
  return (
    <div className={"strom" + (laedt ? " strom--laedt" : "")} id="strom">
      {verlauf.map((k, i) => (
        <Fragment key={k.id}>
        {k.offen && <Einschub format="leaderboard" variante={i === 0 ? "top" : "feed"} nr={i} />}
        <section className={"kapitel kapitel--alt" + (k.offen ? "" : " zu")} id={`kapitel-alt-${k.id}`}>
          {/* 🚨 Der ganze Kopf ist EIN Knopf. Vorher lag ein zweiter Knopf im klickbaren
              Bereich — verschachtelte Knöpfe sind ungültiges Markup, und die Tastatur kam
              nur an den inneren. Jetzt faltet Antippen in beide Richtungen, wie im Design. */}
          <button
            type="button"
            className="kapitel__kopf"
            data-erscheint="kopf"
            onClick={() => kapitelUmschalten(k.id)}
            aria-expanded={k.offen}
            aria-label={`Kapitel ${i + 1}: ${k.titel} ${k.offen ? "zusammenfalten" : "aufschlagen"}`}
          >
            <i className="kapitel__linie" data-linie="" aria-hidden="true" />
            <span className="kapitel__marke">
              <span className="kicker">Kapitel {i + 1}{k.pfad.length ? " · " + k.pfad.join(" › ") : ""} · {k.zeit}</span>
              <img className="kapitel__spark" data-spark="" src="/icons/nav-spark-green.svg" alt="" aria-hidden="true" />
              <span className="kapitel__titel">{k.titel}</span>
              <em className="kapitel__hinweis">{k.offen ? "Antippen zum Zusammenfalten" : "Zusammengefaltet · antippen zum Aufschlagen"}</em>
            </span>
            <i className="kapitel__linie" data-linie="" aria-hidden="true" />
          </button>
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
      {pathname !== "/" && <Einschub format="leaderboard" variante={verlauf.length ? "feed" : "top"} nr={verlauf.length} />}
      {children}
      <LeoStrom />
      {laedt && <SkelettKapitel />}
      <div id="strom-ende" aria-hidden="true" />
    </div>
  );
}
