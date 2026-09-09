"use client";

/**
 * Linke Randspalte: Verlauf (eingefrorene Kapitel + lebendes Kapitel mit
 * Inhaltsverzeichnis) und Leos Wochenbrief. Klebt unter dem Kopf.
 *
 * Das Inhaltsverzeichnis liest die Abschnitte des lebenden Kapitels aus dem DOM
 * (`.abschnitt[data-toc-titel]`), der aktive Abschnitt kommt per IntersectionObserver.
 *
 * 🚨 Aufbau und Maße stammen aus dem laufenden Prototyp (Design A v2), nicht aus seiner
 * Beschreibung — nachgemessen am 09.09.2026: Zeile als Raster `16px 150px`, Abstand 10,
 * Innenabstand 9/0, Haarlinie unten; Nummer `700 10px Open Sans` in Grau; Titel
 * `400 13.5px Merriweather`, darunter ein 1-px-Strich in Grün, dessen BREITE den
 * Lesefortschritt trägt. Abschnitte `400 12.5px`, aktiv `600` in Tinte.
 */
import { useEffect, useRef } from "react";
import { kopfHoehe } from "@/lib/faden/scrollen";
import { useAbschnittAktiv, type TocZeile } from "@/lib/faden/useAbschnittAktiv";
import { useFaden } from "./FadenProvider";
import WochenbriefForm from "./WochenbriefForm";
import Leseserie from "./Leseserie";
import Einschub from "./Einschub";

export function zuAbschnitt(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduziert = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - kopfHoehe() - 12, behavior: reduziert ? "auto" : "smooth" });
}

/**
 * Die Abschnitte EINES Kapitels — unter dem Eintrag, in dem der Leser gerade steht.
 * Der Strich vor dem Titel wächst beim Aktivwerden von 10 auf 22 px.
 */
function Abschnittsliste({ toc, aktiv, onZu }: { toc: TocZeile[]; aktiv: string; onZu?: () => void }) {
  if (!toc.length) return null;
  return (
    <ol className="verlauf__abschnitte">
      {toc.map((t) => (
        <li key={t.id}>
          <button type="button" className={"verlauf__abschnitt" + (t.id === aktiv ? " aktiv" : "")} onClick={() => { zuAbschnitt(t.id); onZu?.(); }}>
            <i className="verlauf__strich" aria-hidden="true" />
            <span>{t.titel}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

/** Eine Verlaufszeile: Nummer, Titel, darunter der Lesestrich. */
function Zeile({ nr, titel, aktiv, anteil, onKlick }: { nr: number; titel: string; aktiv: boolean; anteil: number; onKlick: () => void }) {
  return (
    <button type="button" className={"verlauf__zeile" + (aktiv ? " aktiv" : "")} onClick={onKlick} title={titel}>
      <span className="verlauf__nr">{String(nr).padStart(2, "0")}</span>
      <span className="verlauf__titel">
        <span>{titel}</span>
        <i style={{ width: `${Math.round(anteil * 100)}%` }} aria-hidden="true" />
      </span>
    </button>
  );
}

export default function RandLinks({ mobil, onZu }: { mobil?: boolean; onZu?: () => void }) {
  const { verlauf, kapitelNr, kapitelUmschalten } = useFaden();
  const { titel, toc, aktiv, vorhanden, aktivesKapitel } = useAbschnittAktiv();
  // Neuer Verlaufseintrag leuchtet kurz (Prototyp 05-js-neu.html listeAktualisieren).
  const vorherigeZahl = useRef(verlauf.length);
  useEffect(() => {
    if (verlauf.length > vorherigeZahl.current) {
      const li = document.querySelectorAll<HTMLElement>("#kapitelListe > li")[verlauf.length - 1];
      if (li) { li.classList.add("neu"); setTimeout(() => li.classList.remove("neu"), 1600); }
    }
    vorherigeZahl.current = verlauf.length;
  }, [verlauf.length]);
  const live = vorhanden ? { titel, toc } : null;

  /**
   * Wie weit ist ein Kapitel gelesen? Gelesene ganz, das aktive nach seinem Abschnitt,
   * kommende gar nicht. Der Prototyp zeigt dafür feste 46 % — hier steht der echte Wert,
   * er kostet nichts und sagt mehr.
   */
  const anteilAktiv = toc.length ? (Math.max(0, toc.findIndex((t) => t.id === aktiv)) + 1) / toc.length : 0;
  const istAktiv = (id: string) => aktivesKapitel === id;

  const zuKapitel = (id: string, aufklappen?: string) => {
    const n = document.getElementById(id);
    if (aufklappen) kapitelUmschalten(aufklappen);
    if (n) window.scrollTo({ top: n.getBoundingClientRect().top + window.scrollY - kopfHoehe() - 12, behavior: "smooth" });
    onZu?.();
  };

  const alleFalten = () => verlauf.filter((k) => k.offen).forEach((k) => kapitelUmschalten(k.id));

  return (
    <aside className={"rand rand--links" + (mobil ? " mobil" : "")} id="randLinks" aria-label="Verlauf und Inhalt">
      <div className="rand__lauf">
        <div className="rand__innen">
          <div className="rand__oben">
            <div className="verlauf">
              <h2>Verlauf · heute</h2>
              <ol id="kapitelListe" className="verlauf__liste">
                {verlauf.map((k, i) => (
                  <li key={k.id}>
                    <Zeile
                      nr={i + 1}
                      titel={k.titel}
                      aktiv={istAktiv(`kapitel-alt-${k.id}`)}
                      anteil={istAktiv(`kapitel-alt-${k.id}`) ? anteilAktiv : 1}
                      onKlick={() => zuKapitel(`kapitel-alt-${k.id}`, k.offen ? undefined : k.id)}
                    />
                    {istAktiv(`kapitel-alt-${k.id}`) && <Abschnittsliste toc={toc} aktiv={aktiv} onZu={onZu} />}
                  </li>
                ))}
                {live ? (
                  <li>
                    <Zeile
                      nr={kapitelNr}
                      titel={live.titel}
                      aktiv={istAktiv("kapitel-live")}
                      anteil={istAktiv("kapitel-live") ? anteilAktiv : 0}
                      onKlick={() => zuKapitel("kapitel-live")}
                    />
                    {istAktiv("kapitel-live") && <Abschnittsliste toc={live.toc} aktiv={aktiv} onZu={onZu} />}
                  </li>
                ) : (
                  <li className="rand__leer">Noch kein Kapitel. Fragen Sie Leo oder blättern Sie oben im Register.</li>
                )}
              </ol>
              {verlauf.some((k) => k.offen) && (
                <button type="button" className="verlauf__falten" onClick={alleFalten}>Alle Kapitel zusammenfalten</button>
              )}
            </div>
            <div className="block wb-rail">
              <span className="kicker kicker--gruen">Leos Wochenbrief</span>
              <WochenbriefForm klein />
            </div>
            <Leseserie />
          </div>
          <div className="rand__fuss"><Einschub format="halfpage" nr={0} /></div>
        </div>
      </div>
      {mobil && <button type="button" className="rand__zu btn btn--klein btn--still" onClick={onZu}>Schließen ✕</button>}
    </aside>
  );
}
