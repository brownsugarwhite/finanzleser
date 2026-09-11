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
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import ToolDots from "@/components/ui/ToolDots";
import { boldYears } from "@/components/ui/MegaPostContent";
import { ankerHalten } from "@/lib/faden/aufklappen";
import { kopfHoehe } from "@/lib/faden/scrollen";
import type { SpaltenRubrik } from "@/lib/faden/spalten";

/** So viel vom Körper steht im Ruhestand offen. */
const PEEK = 110;
/** Muss zur Übergangsdauer von .kiosk__koerper in app/faden.css passen. */
const FAHRT = 420;
/** Wie weit ein Blatt im Ruhestand auf dem vorigen liegt — muss zu `.kiosk` in faden.css passen. */
const UEBERLAPP = 10;

/**
 * `start` kommt nur aus einem eingefrorenen Kapitel: `InselnBeleben` reicht dort das
 * `data-insel-arg` herein, das dieser Kiosk beim Verlassen der Seite hinterlassen hat.
 * Sonst stünde im Verlauf wieder der Anfangsstand, während der Schnappschuss die Höhe des
 * aufgeschlagenen Blattes trägt — und darunter bliebe ein leerer Kasten stehen.
 * „zu" heißt: alles war zugeklappt.
 */
export default function Spalten({ rubriken, start }: { rubriken: SpaltenRubrik[]; start?: string }) {
  const wieder = !!start;
  const [aktiv, setAktiv] = useState<string>(wieder ? (start === "zu" ? "" : start!) : rubriken[0]?.key || "");
  // Je Rubrik das gewählte Thema; ohne Eintrag gilt das erste.
  const [themen, setThemen] = useState<Record<string, string>>({});
  // Vor der ersten Berührung steht das erste Blatt nur angeschnitten offen.
  const [beruehrt, setBeruehrt] = useState(wieder);
  // Höhe des offenen Körpers: eine Zahl, solange gefahren wird, danach `null` = `auto`.
  const [hoehe, setHoehe] = useState<number | null>(wieder ? null : PEEK);
  const koerper = useRef<Record<string, HTMLDivElement | null>>({});
  const kopf = useRef<Record<string, HTMLButtonElement | null>>({});
  const blatt = useRef<Record<string, HTMLElement | null>>({});
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
    // Bis unter das ganze Laufband — eine halb verdeckte Laufzeile läse sich wie ein Fehler.
    // Die 10 px sind der Überlapp, den das erste Blatt ohnehin schon hat.
    const band = kopfblatt.querySelector<HTMLElement>(".laufband") || mast;
    return Math.max(0, Math.round(kopfblatt.getBoundingClientRect().bottom - band.getBoundingClientRect().bottom - UEBERLAPP));
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
  /**
   * Wohin die Oberkante des Blattes soll, damit es aufgeschlagen lesbar steht: unter den
   * Kopf — aber nur, wenn es an seiner jetzigen Stelle nicht ganz ins Bild passt. Steht es
   * schon gut, bleibt der Blick, wo er ist; ein Sprung ohne Grund ist schlimmer als keiner.
   */
  const lesestelle = (key: string, koerperZiel: number): number | undefined => {
    const el = blatt.current[key];
    if (!el) return undefined;
    const oben = kopfHoehe() + 12;
    const r = el.getBoundingClientRect();
    const jetzt = koerper.current[key]?.getBoundingClientRect().height || 0;
    const nachher = r.height - jetzt + koerperZiel;
    const passt = r.top >= oben && r.top + nachher <= window.innerHeight - 16;
    return passt ? undefined : oben;
  };

  const fahren = (zielKey: string, anker: HTMLElement | null) => {
    const altEl = koerper.current[aktiv];
    if (hoehe === null && altEl) flushSync(() => setHoehe(Math.round(altEl.getBoundingClientRect().height)));
    const ziel = zielKey ? Math.round(koerper.current[zielKey]?.scrollHeight || PEEK) : 0;
    const deckung = zielKey ? messeUeberdeckung() : 0;
    ankerHalten(anker, FAHRT + 60, zielKey ? lesestelle(zielKey, ziel) : undefined);
    flushSync(() => {
      setBeruehrt(true);
      setAktiv(zielKey);
      setHoehe(ziel);
      setUeberdeckung(deckung);
    });
    // Nach der Fahrt auf `auto`: sonst klippt der Körper, sobald jemand das Thema wechselt
    // oder das Bild spät geladen ist. Nur, wenn inzwischen nicht weitergeklickt wurde.
    if (zielKey) setTimeout(() => setHoehe((h) => (h === ziel ? null : h)), FAHRT + 40);
  };

  const umschalten = (key: string) => fahren(aktiv === key && beruehrt ? "" : key, blatt.current[key] || kopf.current[key]);

  // Wiederbelebt mit offenem Blatt: die Überdeckung lässt sich erst messen, wenn alles steht.
  useLayoutEffect(() => { if (wieder && start !== "zu") setUeberdeckung(messeUeberdeckung()); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Ein Klick auf den Schriftzug „Ratgeber" im Kopfblatt fährt den ganzen Stapel zusammen.
  // Der Schalter gehört zu einer Server-Komponente (NeuesteAusgabe) — der Zustand liegt hier,
  // also hängt sich der Kiosk an den Knopf, statt ihn zu rendern.
  useEffect(() => {
    const wurzel = stapel.current?.closest(".insel") || stapel.current;
    const kopfblatt = wurzel?.previousElementSibling as HTMLElement | null;
    const schalter = kopfblatt?.querySelector<HTMLElement>("[data-kiosk-zu]");
    if (!schalter) return;
    const zu = () => { if (aktiv) fahren("", schalter); };
    schalter.addEventListener("click", zu);
    return () => schalter.removeEventListener("click", zu);
  // Ohne Abhängigkeiten, also nach JEDEM Render neu gehängt: `fahren` liest den Stand
  // aus dem Abschluss, und der ist nur im Render frisch, in dem er entstanden ist.
  });

  // Den Stand in der Insel hinterlegen — erst nach der ersten Berührung, damit ein
  // unberührter Kiosk im Verlauf wieder mit seinem Anfangsstand erscheint.
  useEffect(() => {
    if (!beruehrt) return;
    const insel = stapel.current?.closest<HTMLElement>(".insel");
    if (insel) insel.dataset.inselArg = aktiv || "zu";
  }, [aktiv, beruehrt]);

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
            ref={(el) => { blatt.current[r.key] = el; }}
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
              <span className="kicker"><span className="kiosk__wort">Kategorie </span>{offen && beruehrt ? "zuklappen" : "aufschlagen"}</span>
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
                <div className="kiosk__links">
                  <div className="kiosk__oben">
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
                  </div>
                  {th && th.werkzeuge.length > 0 && (
                    <div className="kiosk__werkzeuge">
                      <span className="kicker">Finanztools zum Thema</span>
                      {th.werkzeuge.map((w) => (
                        <a key={w.typ + w.slug} className="chip chip--still" href={w.href}><i className={`dot dot--${w.typ}`} /> {w.titel}</a>
                      ))}
                    </div>
                  )}
                </div>
                <div className="kiosk__ratgeber">
                  {th?.liste.map((e) => (
                    <a key={e.slug} className="kiosk__artikel" href={e.href}>
                      <span className="kiosk__kleine"><span>{e.titel}</span><ToolDots tools={e.tools} size={8} style={{ marginLeft: 0, marginTop: 4, flex: "none" }} /></span>
                      <b>{e.untertitel ? boldYears(e.untertitel) : boldYears(e.titel)}</b>
                    </a>
                  ))}
                  <a className="pfeil-link kiosk__alle" href={th && th.zahl > th.liste.length ? th.href : r.href}>
                    {th && th.zahl > th.liste.length ? `Alle ${th.zahl} Ratgeber in ${th.name}` : `Alle ${r.zahl} Ratgeber in ${r.titel}`}<i />
                  </a>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
