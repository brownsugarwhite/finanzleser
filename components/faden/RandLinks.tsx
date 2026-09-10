"use client";

/**
 * Linke Randspalte: Verlauf (eingefrorene Kapitel + lebendes Kapitel mit
 * Inhaltsverzeichnis) und Leos Wochenbrief. Klebt unter dem Kopf.
 *
 * Das Inhaltsverzeichnis liest die Abschnitte des lebenden Kapitels aus dem DOM
 * (`.abschnitt[data-toc-titel]`), der aktive Abschnitt kommt per IntersectionObserver.
 */
import { useEffect, useRef } from "react";
import { kopfHoehe } from "@/lib/faden/scrollen";
import { useAbschnittAktiv, type TocZeile } from "@/lib/faden/useAbschnittAktiv";
import { useFaden } from "./FadenProvider";
import WochenbriefForm from "./WochenbriefForm";
import Einschub from "./Einschub";

export function zuAbschnitt(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduziert = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - kopfHoehe() - 12, behavior: reduziert ? "auto" : "smooth" });
}

/** Die Abschnitte EINES Kapitels — unter dem Eintrag, in dem der Leser gerade steht.
 *  Vorlage ist „Faden A" (nicht v2): ein kurzer Strich je Abschnitt, der beim aktiven
 *  von 6 auf 14 px wächst. Keine Nummern, keine Werkzeugpunkte — genau darin liegt das
 *  Schlichte der Liste. */
function Abschnittsliste({ toc, aktiv, onZu }: { toc: TocZeile[]; aktiv: string; onZu?: () => void }) {
  if (!toc.length) return null;
  return (
    <ol>
      {toc.map((t) => (
        <li key={t.id}>
          <button type="button" className={t.id === aktiv ? "aktiv" : ""} onClick={() => { zuAbschnitt(t.id); onZu?.(); }}>
            <i className="verlauf__strich" /><span>{t.titel}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

/** Typ eines Kapitels aus seinem Schlüssel (`post:<slug>` …) — steht im Verlauf nur dann dabei, wenn zwei Einträge gleich heißen. */
function typAusKey(key: string): string {
  const art = key.split(":")[0];
  return ({ post: "Ratgeber", rechner: "Rechner", checkliste: "Checkliste", vergleich: "Vergleich", dokument: "Dokument", dokumente: "Dokumente", begriff: "Begriff", anbieter: "Anbieter", seite: "Seite", spiel: "Spiel" } as Record<string, string>)[art] || "";
}

export default function RandLinks({ mobil, onZu }: { mobil?: boolean; onZu?: () => void }) {
  const { verlauf, kapitelNr, kapitelUmschalten, laedt, ladeZiel } = useFaden();
  const { titel, toc, aktiv, vorhanden, aktivesKapitel, liveKey } = useAbschnittAktiv();
  // Gleiche Titel (Ratgeber „Gaspreise vergleichen“ und die Checkliste dazu) sähen wie ein
  // Fehler aus — dann steht der Typ dabei.
  const zaehler = new Map<string, number>();
  for (const t of [...verlauf.map((k) => k.titel), ...(vorhanden ? [titel] : [])]) zaehler.set(t, (zaehler.get(t) || 0) + 1);
  const typ = (t: string, key: string) => ((zaehler.get(t) || 0) > 1 ? typAusKey(key) : "");
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

  return (
    <aside className={"rand rand--links" + (mobil ? " mobil" : "")} id="randLinks" aria-label="Verlauf und Inhalt">
      <div className="rand__lauf">
        <div className="rand__innen">
          <div className="rand__oben">
            <div className="verlauf">
              <h2>Verlauf</h2>
              <ul id="kapitelListe">
                {verlauf.map((k, i) => (
                  <li key={k.id}>
                    <button type="button" className={aktivesKapitel === `kapitel-alt-${k.id}` ? "aktiv" : ""} onClick={() => { const n = document.getElementById(`kapitel-alt-${k.id}`); if (!k.offen) kapitelUmschalten(k.id); if (n) window.scrollTo({ top: n.getBoundingClientRect().top + window.scrollY - kopfHoehe() - 12, behavior: "smooth" }); onZu?.(); }} title={k.url}>
                      <span className="verlauf__nr">{i + 1}</span><span>{k.titel}{typ(k.titel, k.key) && <small className="verlauf__typ">{typ(k.titel, k.key)}</small>}</span>
                    </button>
                    {aktivesKapitel === `kapitel-alt-${k.id}` && <Abschnittsliste toc={toc} aktiv={aktiv} onZu={onZu} />}
                  </li>
                ))}
                {/* 🚨 Während einer Navigation steht das alte Kapitel schon als Verlaufseintrag
                    in der Liste, ist als lebendes aber noch im DOM (nur ausgeblendet). Ohne
                    diesen Zweig stünde es doppelt da und wechselte nach dem Laden den Namen.
                    Stattdessen hält diese Zeile den Platz — mit dem Titel des Ziels, sobald
                    der Link ihn hergibt, sonst als Schimmer; der Name ändert sich nach der
                    Ankunft nicht mehr. */}
                {laedt ? (
                  <li className="verlauf__laedt" aria-hidden="true">
                    <button type="button" tabIndex={-1}>
                      <span className="verlauf__nr">{kapitelNr}</span>{ladeZiel?.titel ? <span>{ladeZiel.titel}</span> : <span className="skelett-zeile" />}
                    </button>
                  </li>
                ) : live ? (
                  <li>
                    <button type="button" className={aktivesKapitel === "kapitel-live" ? "aktiv" : ""} onClick={() => { const n = document.getElementById("kapitel-live"); if (n) window.scrollTo({ top: n.getBoundingClientRect().top + window.scrollY - kopfHoehe() - 12, behavior: "smooth" }); onZu?.(); }}>
                      <span className="verlauf__nr">{kapitelNr}</span><span>{live.titel}{typ(live.titel, liveKey) && <small className="verlauf__typ">{typ(live.titel, liveKey)}</small>}</span>
                    </button>
                    {aktivesKapitel === "kapitel-live" && <Abschnittsliste toc={live.toc} aktiv={aktiv} onZu={onZu} />}
                  </li>
                ) : (
                  <li className="rand__leer">Noch kein Kapitel. Fragen Sie Leo oder blättern Sie oben im Register.</li>
                )}
              </ul>
            </div>
            <div className="block wb-rail">
              <span className="kicker kicker--gruen">Newsletter</span>
              <p className="wb-rail__text">Donnerstags. Drei Antworten, ein Finanzwort, kein Formular.</p>
              <WochenbriefForm klein />
            </div>
          </div>
          <div className="rand__fuss"><Einschub format="halfpage" nr={0} /></div>
        </div>
      </div>
      {mobil && <button type="button" className="rand__zu btn btn--klein btn--still" onClick={onZu}>Schließen ✕</button>}
    </aside>
  );
}
