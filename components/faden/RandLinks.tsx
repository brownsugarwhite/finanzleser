"use client";

/**
 * Linke Randspalte: Verlauf (eingefrorene Kapitel + lebendes Kapitel mit
 * Inhaltsverzeichnis) und Leos Wochenbrief. Klebt unter dem Kopf.
 *
 * Das Inhaltsverzeichnis liest die Abschnitte des lebenden Kapitels aus dem DOM
 * (`.abschnitt[data-toc-titel]`), der aktive Abschnitt kommt per IntersectionObserver.
 */
import { usePathname } from "next/navigation";
import { useAbschnittAktiv } from "@/lib/faden/useAbschnittAktiv";
import { useFaden } from "./FadenProvider";
import WochenbriefForm from "./WochenbriefForm";
import Einschub from "./Einschub";

function kopfHoehe(): number {
  const k = document.getElementById("kopf");
  return k ? k.offsetHeight : 64;
}

export function zuAbschnitt(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduziert = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - kopfHoehe() - 12, behavior: reduziert ? "auto" : "smooth" });
}

export default function RandLinks({ mobil, onZu }: { mobil?: boolean; onZu?: () => void }) {
  const { verlauf, kapitelNr, kapitelUmschalten } = useFaden();
  const pathname = usePathname();
  const { titel, toc, aktiv, vorhanden } = useAbschnittAktiv(pathname);
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
                    <button type="button" onClick={() => { const n = document.getElementById(`kapitel-alt-${k.id}`); if (!k.offen) kapitelUmschalten(k.id); if (n) window.scrollTo({ top: n.getBoundingClientRect().top + window.scrollY - kopfHoehe() - 12, behavior: "smooth" }); onZu?.(); }} title={k.url}>
                      {i + 1} · {k.titel}
                    </button>
                  </li>
                ))}
                {live ? (
                  <li>
                    <button type="button" className="aktiv" onClick={() => { const n = document.getElementById("kapitel-live"); if (n) window.scrollTo({ top: n.getBoundingClientRect().top + window.scrollY - kopfHoehe() - 12, behavior: "smooth" }); onZu?.(); }}>
                      {kapitelNr} · {live.titel}
                    </button>
                    {live.toc.length > 0 && (
                      <ol>
                        {live.toc.map((t, i) => (
                          <li key={t.id}>
                            <button type="button" className={t.id === aktiv ? "aktiv" : ""} onClick={() => { zuAbschnitt(t.id); onZu?.(); }}>
                              <i>{t.typ ? <b className={`dot dot--${t.typ}`} /> : i + 1}</i><span>{t.titel}</span>
                            </button>
                          </li>
                        ))}
                      </ol>
                    )}
                  </li>
                ) : (
                  <li className="rand__leer">Noch kein Kapitel. Fragen Sie Leo oder blättern Sie oben im Register.</li>
                )}
              </ul>
              {verlauf.length > 0 && (
                <p className="rand__hinweis">Ein Klick auf einen Eintrag rollt zu dem Kapitel; „ans Ende holen“ öffnet es erneut.</p>
              )}
            </div>
            <div className="block wb-rail">
              <span className="kicker kicker--gruen">Leos Wochenbrief</span>
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
