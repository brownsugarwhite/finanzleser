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
import { Fragment, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useFaden } from "./FadenProvider";
import { saeubern } from "@/lib/faden/schnappschuss";
import LeoStrom from "./leo/LeoStrom";
import Einschub from "./Einschub";
import SkelettKapitel from "./SkelettKapitel";
import InselnBeleben from "./kette/InselnBeleben";

function Schnappschuss({ html, id }: { html: string; id: string }) {
  const rein = useMemo(() => saeubern(html, id), [html, id]);
  const [wurzel, setWurzel] = useState<HTMLDivElement | null>(null);
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
      <div className="kapitel__schnappschuss" ref={setWurzel} dangerouslySetInnerHTML={{ __html: rein }} />
      <InselnBeleben wurzel={wurzel} />
    </>
  );
}

export default function Strom({ children }: { children: ReactNode }) {
  const { verlauf, kapitelUmschalten, navigieren, laedt } = useFaden();
  const pathname = usePathname();
  return (
    <div className={"strom" + (laedt ? " strom--laedt" : "")} id="strom">
      {verlauf.map((k, i) => (
        <Fragment key={k.id}>
        {k.offen && <Einschub format="leaderboard" variante={i === 0 ? "top" : "feed"} nr={i} />}
        <section className={"kapitel kapitel--alt" + (k.offen ? "" : " zu")} id={`kapitel-alt-${k.id}`}>
          <div className="kapitel__kopf" onClick={() => { if (!k.offen) kapitelUmschalten(k.id); }}>
            <span className="kicker">Kapitel {i + 1}{k.pfad.length ? " · " + k.pfad.join(" › ") : ""} · {k.zeit}</span>
            <h2>{k.titel}</h2>
            <button type="button" className="toggle-k" onClick={(e) => { e.stopPropagation(); kapitelUmschalten(k.id); }}>
              {k.offen ? "einklappen ▴" : "aufklappen ▾"}
            </button>
          </div>
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
