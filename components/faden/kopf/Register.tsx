"use client";

/**
 * Register im Zeitungskopf: Ratgeber · Finanztools · Service · Finanzleser Plus.
 *
 * Die dunkle Pille mit Lupe und den zwei Linien kommt aus `NavPille.tsx` — der
 * 1:1-Portierung des Prototyps. **Nicht** aus `lib/hooks/useNavPill` (dem Hook der
 * alten Seite): der kennt die gegenläufige Lupenreihe und die verzögerten Linien
 * nicht. Siehe Kommentar in NavPille.tsx.
 *
 * Die Lupe ist eine vollständige, weiße Kopie dieser Zeile — Reihenfolge und
 * Abstände müssen deshalb exakt gespiegelt werden (Spark, Eintrag, Spark, …).
 */
import { Fragment, useEffect } from "react";
import Spark from "@/components/ui/Spark";
import { useFaden, type BlattZustand } from "@/components/faden/FadenProvider";
import { useLupenPille } from "./NavPille";
import Pfad from "./Pfad";

const EINTRAEGE: { key: BlattZustand["key"]; label: string }[] = [
  { key: "ratgeber", label: "Ratgeber" },
  { key: "finanztools", label: "Finanztools" },
  { key: "service", label: "Service" },
  { key: "plus", label: "Finanzleser Plus" },
];

export default function Register() {
  const { blatt, blattOeffnen, blattZu, punkte } = useFaden();
  const pille = useLupenPille(EINTRAEGE.length);

  // Blatt von außen geöffnet (Kategorie-Route) oder geschlossen (Escape, Klick daneben,
  // Navigation) → Pille nachziehen.
  useEffect(() => {
    if (!blatt) { pille.schliessen(); return; }
    const i = EINTRAEGE.findIndex((e) => e.key === blatt.key);
    if (i >= 0) pille.oeffnen(i);
  }, [blatt, pille]);

  const klick = (key: BlattZustand["key"]) => {
    if (blatt?.key === key) blattZu();
    else blattOeffnen(key);
  };

  return (
    <nav className="register" id="register" aria-label="Register">
      <div
        className="register__reihe"
        ref={pille.reiheRef}
        onMouseMove={pille.beiBewegung}
        onMouseLeave={pille.beiVerlassen}
      >
        {/* Zwei Linien über der Pille, die ihr verzögert folgen */}
        <i className="nav-linie nav-linie--1" ref={pille.linie1Ref} aria-hidden="true" />
        <i className="nav-linie nav-linie--3" ref={pille.linie3Ref} aria-hidden="true" />

        {/* Die Pille mit der Lupe: weiße Kopie der Zeile, gegenläufig mitfahrend */}
        <div className="nav-pille" ref={pille.pilleRef} aria-hidden="true">
          <div className="nav-pille__koerper">
            <div className="nav-lupe">
              <div className="nav-lupe__reihe" ref={pille.lupeReiheRef}>
                <Spark />
                {EINTRAEGE.map((e, i) => (
                  <Fragment key={e.key}>
                    {i > 0 && <Spark />}
                    <span data-key={e.key}>{e.label}{e.key === "plus" && punkte > 0 && <small className="punkte-zahl">· {punkte} P.</small>}</span>
                  </Fragment>
                ))}
                <Spark />
              </div>
            </div>
          </div>
        </div>

        <Spark />
        {EINTRAEGE.map((e, i) => (
          <Fragment key={e.key}>
            {i > 0 && <Spark />}
            <button
              type="button"
              data-key={e.key}
              className={blatt?.key === e.key ? "offen" : ""}
              ref={pille.knopfRef(i)}
              onMouseEnter={() => pille.zuKnopf(i)}
              onClick={() => klick(e.key)}
            >
              {e.label}{e.key === "plus" && punkte > 0 && <small className="punkte-zahl">· {punkte} P.</small>}
            </button>
          </Fragment>
        ))}
        <Spark />
      </div>
      <Pfad />
    </nav>
  );
}
