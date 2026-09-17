"use client";

/**
 * Der Strom: eingefrorene Kapitel (Verlauf) + das lebende Kapitel (die aktuelle Seite).
 * Schnappschüsse sind reines HTML, Kopfzeile mit Nummer, Pfad, Uhrzeit;
 * aufklappen zeigt den statischen Inhalt, „erneut öffnen“ navigiert wirklich.
 *
 * Zwei Dinge stehen hier bewusst so:
 *
 *  1. Das Schnappschuss-HTML wird **erst beim Aufklappen** gesäubert und eingehängt.
 *     Vorher hingen bis zu acht komplette Artikelbäume im Dokument — unsichtbar, aber im
 *     DOM, und das kostet beim Scrollen. Das Aus- und Einhängen besorgt heute
 *     `KapitelInhalt`; es wartet beim Zuklappen die Bewegung ab.
 *  2. Während einer Navigation zeigt der Strom das Skelett und blendet die noch alte
 *     Seite aus (Port von `ladeDann`). Ausgeblendet statt ausgehängt, weil die alte
 *     Seite bis zur RSC-Antwort das einzige `#kapitel-live` ist, an dem der Provider
 *     erkennt, wann das neue Kapitel steht.
 */
import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useFaden } from "./FadenProvider";
import { saeubern } from "@/lib/faden/schnappschuss";
import { kopfHoehe } from "@/lib/faden/scrollen";
import { ausgleichBeobachten, ausgleichVergessen } from "@/lib/faden/ausgleich";
import { pfadFuer, skelettFuer } from "@/lib/faden/skelett";
import { useNavItems } from "@/lib/NavContext";
import LeoStrom from "./leo/LeoStrom";
import Einschub from "./Einschub";
import SkelettKapitel from "./SkelettKapitel";
import KapitelInhalt from "./KapitelInhalt";
import Zeitungskopf from "./Zeitungskopf";
import type { HeroZahlen } from "./hero/HeroLanding";
import InselnBeleben from "./kette/InselnBeleben";

function Schnappschuss({ html, id }: { html: string; id: string }) {
  const { laedt } = useFaden();
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
      <InselnBeleben wurzel={wurzel} stand={rein} pause={laedt} />
    </>
  );
}

/**
 * Bodenabstand: Das letzte Kapitel muss sich mit der Oberkante unter den Kopf rollen
 * lassen — auch ein kurzes (Rechner, Begriff). Vorher hielt ein eingefrorener
 * `min-height` am Strom die Höhe während des Ladens und gab sie 700 ms später frei;
 * schrumpfte das Dokument dabei unter den Leser, kappte der Browser den Scroll. Jetzt
 * füllt `#strom-ende` genau die Lücke zwischen dem letzten Kapitel (oder dem Skelett) und
 * einer Bildschirmhöhe auf — unterhalb des Lesers, also ohne dass je etwas unter ihm rückt.
 */
function Bodenabstand() {
  useEffect(() => {
    const strom = document.getElementById("strom");
    const ende = document.getElementById("strom-ende");
    if (!strom || !ende) return;
    let geplant = 0;
    const messen = () => {
      geplant = 0;
      const anfang = strom.querySelector<HTMLElement>(".kapitel--skelett") || document.getElementById("kapitel-live");
      if (!anfang) { ende.style.height = ""; return; }
      const frei = window.innerHeight - kopfHoehe() - 12;
      const belegt = ende.getBoundingClientRect().top - anfang.getBoundingClientRect().top;
      const h = Math.max(0, Math.round(frei - belegt));
      if (ende.style.height !== `${h}px`) ende.style.height = `${h}px`;
    };
    const anstossen = () => { if (!geplant) geplant = requestAnimationFrame(messen); };
    messen();
    const ro = new ResizeObserver(anstossen);
    ro.observe(strom);
    const mo = new MutationObserver(anstossen);
    mo.observe(strom, { childList: true, attributes: true, attributeFilter: ["class"] });
    window.addEventListener("resize", anstossen);
    return () => { ro.disconnect(); mo.disconnect(); window.removeEventListener("resize", anstossen); if (geplant) cancelAnimationFrame(geplant); };
  }, []);
  return null;
}

/** Ref-Callback: jedes eingefrorene Kapitel meldet Höhenänderungen an den Ausgleich (lib/faden/ausgleich.ts). */
function beobachtet(el: HTMLElement | null) {
  if (el) ausgleichBeobachten(el);
}

/**
 * Ein Kapitel wandert ans Ende des Fadens.
 *
 * 🚨 Erst falten, dann navigieren — in dieser Reihenfolge. Das Kapitel schrumpft an
 * seiner Stelle auf null (0,32 s), alles darunter rückt weich nach; ERST DANACH beginnt
 * die Navigation. Anders herum ginge es nicht: `navigieren` hängt im selben Commit das
 * Skelett an und springt dorthin — eine Höhenänderung OBERHALB des Skeletts würde diesen
 * Sprung verreißen (gemessen 10.09.2026: bis zu 11 887 px daneben). Während der Faltung
 * gibt es noch kein Skelett, und `lib/faden/ausgleich.ts` hält die Lesestelle, falls das
 * Kapitel ganz über der Lesekante liegt.
 *
 * Die zweite Hälfte des Positionstauschs steht schon lange bereit und war nie
 * angeschlossen: `wandert` lässt das Kapitel am Ende wieder einschweben
 * (`@keyframes wandert`, app/faden.css).
 */
function wandernLassen(id: string, url: string, navigieren: (href: string, opts?: { wandert?: boolean }) => void) {
  const el = document.getElementById(`kapitel-alt-${id}`);
  const los = () => navigieren(url, { wandert: true });
  if (!el || typeof el.animate !== "function" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { los(); return; }
  const h = el.getBoundingClientRect().height;
  if (!h) { los(); return; }
  // 🚨 Das offene Kapitel trägt `min-height` in der Höhe, die es lebend hatte (Strom, unten).
  // Ohne diese Zeile läuft die Animation ins Leere: gemessen 17 713 → 17 158 px, also genau
  // bis zur Mindesthöhe, und der Leser sieht nichts.
  const mindest = el.style.minHeight;
  el.style.minHeight = "0px";
  el.style.overflow = "hidden";
  const anim = el.animate([{ height: `${h}px`, opacity: 1 }, { height: "0px", opacity: 0 }], { duration: 320, easing: "cubic-bezier(.2,.8,.2,1)" });
  let ab = false;
  const ende = () => { if (ab) return; ab = true; el.style.overflow = ""; el.style.minHeight = mindest; los(); };
  anim.addEventListener("finish", ende, { once: true });
  setTimeout(ende, 420);
}

export default function Strom({ children }: { children: ReactNode; heroZahlen?: HeroZahlen }) {
  const { verlauf, kapitelUmschalten, navigieren, laedt, laedtLange, ladeZiel } = useFaden();
  const nav = useNavItems();
  // Kapitel, die den Strom verlassen haben, nicht weiter beobachten.
  useEffect(() => {
    const da = new Set(verlauf.map((k) => `kapitel-alt-${k.id}`));
    document.querySelectorAll<HTMLElement>("#strom .kapitel--alt").forEach((el) => { if (!da.has(el.id)) ausgleichVergessen(el); });
  }, [verlauf]);
  return (
    <div className={"strom" + (laedt ? " strom--laedt" : "")} id="strom">
      {/* 🚨 Die erste Zeile des Fadens, IMMER. Vom 11. bis 13.09.2026 fiel sie auf der
          Startseite weg, weil das Kopfblatt des Kiosks Ausgabe und Datum ebenfalls trägt —
          damit fehlte am Anfang des Fadens die Doppellinie. Sie ist das Signal „hier
          beginnt die Ausgabe" und steht an genau zwei Stellen: hier und am Kiosk. */}
      <Zeitungskopf />
      {verlauf.map((k, i) => (
        <Fragment key={k.id}>
        {/* Offen trägt das eingefrorene Kapitel die Höhe, die es lebend hatte (greifen):
            Der Schnappschuss darf nie kürzer sein als das Kapitel, das er ersetzt — sonst
            rückt alles darunter, allen voran das Skelett, zu dem der Faden gerade rollt.
            🚨 Solange geladen wird, ist es GENAU diese Höhe (height + overflow hidden):
            Die Zeile „Kapitel ans Ende holen" und die andere Kopfzeile machen den
            Schnappschuss 28 px höher als das Kapitel — das war der letzte kleine Ruck
            nach der Ankunft. Danach min-height; das Wachsen gleicht ausgleich.ts aus. */}
        <section className={"kapitel kapitel--alt" + (k.offen ? "" : " zu")} id={`kapitel-alt-${k.id}`} style={k.offen && k.hoehe ? (laedt && i === verlauf.length - 1 ? { height: k.hoehe, overflow: "hidden" } : { minHeight: k.hoehe }) : undefined} ref={beobachtet}>
          <div className="kapitel__kopf" onClick={() => { if (!k.offen) kapitelUmschalten(k.id); }}>
            <div className="kapitel__kopf-mitte">
              <span className="kicker">Kapitel {i + 1}{k.pfad.length ? " · " + k.pfad.join(" › ") : ""} · {k.zeit}</span>
              <h2>{k.titel}</h2>
              <button type="button" className="toggle-k" onClick={(e) => { e.stopPropagation(); kapitelUmschalten(k.id); }}>
                {k.offen ? "einklappen ▴" : "aufklappen ▾"}
              </button>
            </div>
          </div>
          <KapitelInhalt offen={k.offen} klasse="kapitel__anzeige">
            <Einschub format="leaderboard" variante={i === 0 ? "top" : "feed"} nr={i} />
          </KapitelInhalt>
          <KapitelInhalt offen={k.offen}>
            {k.html ? (
              <Schnappschuss html={k.html} id={k.id} />
            ) : (
              <p className="kapitel__wieder">Dieses Kapitel lag vor dem Neuladen im Faden. <button type="button" className="strich-link" onClick={() => navigieren(k.url)}>Erneut öffnen</button></p>
            )}
            <div className="kapitel__wieder-zeile"><button type="button" className="strich-link strich-link--still" onClick={() => wandernLassen(k.id, k.url, navigieren)}>Kapitel ans Ende des Fadens holen ↓</button></div>
          </KapitelInhalt>
        </section>
        </Fragment>
      ))}
      {children}
      <LeoStrom />
      {laedt && <SkelettKapitel sorte={ladeZiel ? skelettFuer(ladeZiel.href) : "seite"} titel={ladeZiel?.titel} pfad={ladeZiel ? pfadFuer(ladeZiel.href, nav) : []} lange={laedtLange} />}
      <div id="strom-ende" aria-hidden="true" />
      <Bodenabstand />
    </div>
  );
}
