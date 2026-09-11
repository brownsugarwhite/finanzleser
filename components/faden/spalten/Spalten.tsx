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
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import ToolDots from "@/components/ui/ToolDots";
import { boldYears } from "@/components/ui/MegaPostContent";
import { ankerHalten } from "@/lib/faden/aufklappen";
import type { SpaltenRubrik } from "@/lib/faden/spalten";

/** So viel vom Körper steht im Ruhestand offen. */
const PEEK = 110;
/** Muss zur Übergangsdauer von .kiosk__koerper in app/faden.css passen. */
const FAHRT = 420;

export default function Spalten({ rubriken }: { rubriken: SpaltenRubrik[] }) {
  const [aktiv, setAktiv] = useState<string>(rubriken[0]?.key || "");
  // Je Rubrik das gewählte Thema; ohne Eintrag gilt das erste.
  const [themen, setThemen] = useState<Record<string, string>>({});
  // Vor der ersten Berührung steht das erste Blatt nur angeschnitten offen.
  const [beruehrt, setBeruehrt] = useState(false);
  // Höhe des offenen Körpers: eine Zahl, solange gefahren wird, danach `null` = `auto`.
  const [hoehe, setHoehe] = useState<number | null>(PEEK);
  const koerper = useRef<Record<string, HTMLDivElement | null>>({});
  const kopf = useRef<Record<string, HTMLButtonElement | null>>({});
  const stapel = useRef<HTMLElement>(null);
  // Wie weit sich der Stapel über das Kopfblatt zieht, solange ein Blatt offen steht.
  const [ueberdeckung, setUeberdeckung] = useState(0);

  /**
   * Der Stapel schiebt sich beim Aufschlagen so weit über das Kopfblatt, dass von diesem
   * nur noch der Schriftzug „Ratgeber" herausschaut — wie eine Zeitung, die man aus dem
   * Regal zieht. Gemessen statt geraten: die Höhe des Kopfblattes hängt am Bild und am
   * Umbruch der Schlagzeile.
   */
  const messeUeberdeckung = (): number => {
    // 🚨 Der Kiosk steckt in einer `Insel` (FadenLanding) — das Kopfblatt ist deshalb nicht
    // das vorige Geschwister der Sektion, sondern das der Insel. Im eingefrorenen Kapitel
    // ebenso, dort steht beides im Schnappschuss.
    const wurzel = stapel.current?.closest(".insel") || stapel.current;
    const kopfblatt = wurzel?.previousElementSibling as HTMLElement | null;
    const mast = kopfblatt?.querySelector<HTMLElement>(".kiosk-mast");
    if (!kopfblatt || !mast || !kopfblatt.classList.contains("neueste")) return 0;
    // Bis unter die Doppellinie des Schriftzugs (die erste des Laufbands) — sonst bliebe
    // die Laufzeile halb verdeckt stehen und läse sich wie ein Fehler.
    const linie = kopfblatt.querySelector<HTMLElement>(".laufband .doppellinie") || mast;
    return Math.max(0, Math.round(kopfblatt.getBoundingClientRect().bottom - linie.getBoundingClientRect().bottom - 8));
  };

  /**
   * 🚨 Drei Dinge in dieser Reihenfolge, sonst fährt nichts weich:
   *
   *  1. Der offene Körper steht nach seiner Fahrt auf `auto` — von dort aus fährt CSS
   *     nicht. Also erst seine gemessene Pixelhöhe festnageln, in einem eigenen Render.
   *  2. Das Ziel messen, SOLANGE es noch zu ist: `scrollHeight` ignoriert die Höhe 0.
   *  3. Umschalten und den angeklickten Kopf dabei über die ganze Fahrt an seiner Stelle
   *     halten — die Bewegung findet ja oberhalb von ihm statt.
   */
  const umschalten = (key: string) => {
    const zu = aktiv === key && beruehrt;
    const altEl = koerper.current[aktiv];
    if (hoehe === null && altEl) flushSync(() => setHoehe(Math.round(altEl.getBoundingClientRect().height)));
    const ziel = zu ? 0 : Math.round(koerper.current[key]?.scrollHeight || PEEK);
    const deckung = zu ? 0 : messeUeberdeckung();
    ankerHalten(kopf.current[key], FAHRT + 60);
    flushSync(() => {
      setBeruehrt(true);
      setAktiv(zu ? "" : key);
      setHoehe(ziel);
      setUeberdeckung(deckung);
    });
    // Nach der Fahrt auf `auto`: sonst klippt der Körper, sobald jemand das Thema wechselt
    // oder das Bild spät geladen ist. Nur, wenn inzwischen nicht weitergeklickt wurde.
    if (!zu) setTimeout(() => setHoehe((h) => (h === ziel ? null : h)), FAHRT + 40);
  };

  return (
    <section
      className="kiosk spalten-kasten"
      id="rubriken"
      aria-label="Aus dem Kiosk"
      ref={stapel}
      style={ueberdeckung ? ({ ["--ueberdeckung" as string]: `${ueberdeckung}px` } as React.CSSProperties) : undefined}
    >
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
              ref={(el) => { kopf.current[r.key] = el; }}
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
              ref={(el) => { koerper.current[r.key] = el; }}
              // `undefined` heißt `auto` — React nimmt die Höhe dann wieder heraus. Ohne
              // JavaScript bleibt sie ungesetzt und alles steht offen da.
              style={{ height: offen ? (hoehe === null ? undefined : hoehe) : 0 }}
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
                      <span className="kiosk__kleine"><span>{e.titel}</span><ToolDots tools={e.tools} size={8} style={{ marginLeft: 0, marginTop: 4, flex: "none" }} /></span>
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
