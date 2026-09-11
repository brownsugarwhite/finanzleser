"use client";

/**
 * Der Kiosk: vier Rubriken als Zeitungsblätter im Stapel (Entwurf vom 11.09.2026).
 *
 * Jedes Blatt zeigt zugeklappt nur seinen Namen und „Kategorie aufschlagen". Aufgeschlagen
 * stehen darin das Bild der Rubrik, alle ihre Themen als Schalter und daneben die drei
 * neuesten Ratgeber des gewählten Themas, darunter die Werkzeuge dazu.
 *
 * Drei Zustände je Körper, und alle drei sind Pixelhöhen — nur deshalb lässt sich zwischen
 * allen dreien weich fahren:
 *   zu        0
 *   Ruhe      PEEK — der Anfangsstand: das erste Blatt liegt schon offen, das nächste
 *             deckt es bis auf einen Streifen zu. Wer scrollt, sieht sofort, dass hier
 *             etwas drin ist.
 *   offen     die gemessene Höhe, nach der Fahrt `auto`
 *
 * 🚨 Die Klasse `spalten-kasten` muss am äußersten Element bleiben: `Begruessung.tsx`
 * sucht sie, blendet den Kiosk nach Leos Gruß ein und setzt daran über `angehaengt()` den
 * Bezugspunkt für `folgt()`. Fällt der Selektor ins Leere, entscheidet alles Nachfolgende
 * (Kassensturz, Schlange, Finanzwort) falsch, ob gescrollt werden darf.
 */
import { useState } from "react";
import ToolDots from "@/components/ui/ToolDots";
import { boldYears } from "@/components/ui/MegaPostContent";
import type { SpaltenRubrik } from "@/lib/faden/spalten";

/** So viel vom Körper steht im Ruhestand offen. */
const PEEK = 110;

export default function Spalten({ rubriken }: { rubriken: SpaltenRubrik[] }) {
  const [aktiv, setAktiv] = useState<string>(rubriken[0]?.key || "");
  // Je Rubrik das gewählte Thema; ohne Eintrag gilt das erste.
  const [themen, setThemen] = useState<Record<string, string>>({});
  // Vor der ersten Berührung steht das erste Blatt nur angeschnitten offen.
  const [beruehrt, setBeruehrt] = useState(false);

  const umschalten = (key: string) => {
    setBeruehrt(true);
    setAktiv((alt) => (alt === key && beruehrt ? "" : key));
  };

  return (
    <section className="kiosk spalten-kasten" id="rubriken" aria-label="Aus dem Kiosk">
      {rubriken.map((r, i) => {
        const offen = aktiv === r.key;
        const tk = themen[r.key] || r.themen[0]?.key;
        const th = r.themen.find((t) => t.key === tk) || r.themen[0];
        return (
          <article
            key={r.key}
            className={"kiosk-blatt kiosk__blatt" + (offen ? " ist-offen" : "")}
            data-key={r.key}
            // Das spätere Blatt liegt oben und wirft seinen Schatten auf das vorige.
            style={{ zIndex: i + 1 }}
          >
            <button
              type="button"
              className="kiosk__kopf"
              aria-expanded={offen}
              aria-controls={`kiosk-${r.key}`}
              onClick={() => umschalten(r.key)}
            >
              <b className="kiosk__titel">{r.titel}</b>
              {/* Im Ruhestand steht das erste Blatt nur angeschnitten offen — dann heißt es
                  weiter „aufschlagen", denn genau das tut der Klick. */}
              <span className="kicker">{offen && beruehrt ? "Kategorie zuklappen" : "Kategorie aufschlagen"}</span>
            </button>
            <i className="doppellinie" />
            <div
              className="kiosk__koerper"
              id={`kiosk-${r.key}`}
              // Ohne JavaScript bleibt die Höhe ungesetzt und alles steht offen da.
              style={{ height: offen ? (beruehrt ? undefined : PEEK) : 0 }}
            >
              <div className="kiosk__innen">
                {r.bild && (
                  <span className="kiosk__bild">
                    <img src={r.bild.src} alt={r.bild.alt} loading="lazy" />
                  </span>
                )}
                <ul className="kiosk__themen">
                  {r.themen.map((t) => (
                    <li key={t.key} className={t.key === th?.key ? "ist-aktiv" : undefined}>
                      <button type="button" onClick={() => setThemen((a) => ({ ...a, [r.key]: t.key }))}>{t.name}</button>
                    </li>
                  ))}
                </ul>
                <div className="kiosk__ratgeber">
                  {th?.liste.map((e) => (
                    <a key={e.slug} className="kiosk__artikel" href={e.href}>
                      <span className="kiosk__kleine"><span>{e.titel}</span><ToolDots tools={e.tools} size={8} style={{ marginLeft: 0 }} /></span>
                      <b>{e.untertitel ? boldYears(e.untertitel) : boldYears(e.titel)}</b>
                      <span className="pfeil-link">Ratgeber lesen<i /></span>
                    </a>
                  ))}
                </div>
              </div>
              <div className="kiosk__fuss">
                {th && th.werkzeuge.length > 0 && <span className="kicker">Finanztools zum Thema</span>}
                {th?.werkzeuge.map((w) => (
                  <a key={w.typ + w.slug} className="chip chip--still" href={w.href}><i className={`dot dot--${w.typ}`} /> {w.titel}</a>
                ))}
                <a className="pfeil-link kiosk__alle" href={th && th.zahl > th.liste.length ? th.href : r.href}>
                  {th && th.zahl > th.liste.length ? `Alle ${th.zahl} Ratgeber in ${th.name}` : `Alle ${r.zahl} Ratgeber in ${r.titel}`}<i />
                </a>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
