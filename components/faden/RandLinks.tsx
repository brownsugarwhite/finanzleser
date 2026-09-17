"use client";

/**
 * Linke Randspalte: Verlauf (eingefrorene Kapitel + lebendes Kapitel mit
 * Inhaltsverzeichnis) und Leos Wochenbrief. Klebt unter dem Kopf.
 *
 * Das Inhaltsverzeichnis liest die Abschnitte des lebenden Kapitels aus dem DOM
 * (`.abschnitt[data-toc-titel]`), der aktive Abschnitt kommt per IntersectionObserver.
 *
 * ---------------------------------------------------------------------------------
 * Gestaltung: „Finanzleser Faden A v2 — Zeitung", Zeile 283–290 der Übergabe
 * (docs/design_handoff_finanzleser_faden). Gemessen am gerenderten Original, nicht aus
 * dem Screenshot geraten:
 *
 *   Kapitelzeile   grid 16px / 1fr, Lücke 10, Polster 9/0, Haarlinie unten
 *                  Nummer 700, Versalziffern zweistellig („01"), aktiv in --green
 *                  Titel Merriweather, aktiv 700 + --ink, sonst 400 + --muted
 *                  darunter ein grüner Fortschrittsstrich: gelesen 100 %, hier 46 %,
 *                  noch nicht gelesen 0 % — Übergang .6s auf --kurve
 *   Abschnitte     eingerückt 26, Schrift Open Sans, aktiv 600 + --ink
 *                  Teilstrich 10 → 22 px, --ink-45 → --green
 *
 * 🚨 Die Umbrüche stehen in JEDEM Zustand gleich — die Regel des Users vom 17.09.2026.
 *    Erreicht wird das mit seinem eigenen Ansatz: **von Hand umbrechen, Autoumbruch aus.**
 *    `lib/faden/zeilenbruch.ts` misst jeden Text einmal im FETTEN Schnitt aus (der läuft
 *    am breitesten) und gibt die Zeilen zurück; gerendert wird je Zeile ein Block, und
 *    `white-space: nowrap` verhindert, dass der Browser noch einmal selbst umbricht.
 *    Damit bleiben echtes `font-weight` und alle Bewegungen erhalten.
 *    Zusätzlich hält der Teilstrich einen festen 22-px-Platz, damit das Wachsen von 10
 *    auf 22 px die Textkante nicht verschiebt; das Rücken nach rechts ist `translate`.
 * ---------------------------------------------------------------------------------
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { kopfHoehe } from "@/lib/faden/scrollen";
import { useAbschnittAktiv, type TocZeile } from "@/lib/faden/useAbschnittAktiv";
import { brichZeilen } from "@/lib/faden/zeilenbruch";
import { useFaden } from "./FadenProvider";
import WochenbriefForm from "./WochenbriefForm";
import Einschub from "./Einschub";

export function zuAbschnitt(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduziert = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - kopfHoehe() - 12, behavior: reduziert ? "auto" : "smooth" });
}

/** Zweistellig wie in der Vorlage: 01, 02, … */
const nr2 = (n: number) => String(n).padStart(2, "0");

/** Schnitt der aktiven Lage — in ihm wird gemessen (siehe lib/faden/zeilenbruch.ts). */
const GEWICHT_KAPITEL = 700;
const GEWICHT_ABSCHNITT = 600;

/**
 * Rechnet die festen Zeilenumbrüche aus und hält sie aktuell: bei neuen Texten, bei
 * geänderter Spaltenbreite (Fenster, mobile Schublade) und sobald die Schriften geladen
 * sind — vorher misst der Browser die Ersatzschrift, und die läuft anders.
 */
function useZeilenbruch(ul: React.RefObject<HTMLUListElement | null>, kapitel: string[], abschnitte: string[]) {
  const [zeilen, setZeilen] = useState<Map<string, string[]>>(new Map());
  const schluessel = kapitel.join("\u0000") + "\u0001" + abschnitte.join("\u0000");
  const rechnen = useCallback(() => {
    const wurzel = ul.current;
    if (!wurzel) return;
    const neu = new Map<string, string[]>();
    const kMuster = wurzel.querySelector<HTMLElement>(".verlauf__zeile .verlauf__titel");
    const aMuster = wurzel.querySelector<HTMLElement>(".verlauf__toc .verlauf__titel");
    if (kMuster) for (const [t, z] of brichZeilen(kapitel, kMuster, GEWICHT_KAPITEL)) neu.set("k\u0000" + t, z);
    if (aMuster) for (const [t, z] of brichZeilen(abschnitte, aMuster, GEWICHT_ABSCHNITT)) neu.set("a\u0000" + t, z);
    setZeilen((alt) => (alt.size === neu.size && [...neu].every(([k, v]) => alt.get(k)?.join("\n") === v.join("\n")) ? alt : neu));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ul, schluessel]);

  useLayoutEffect(() => { rechnen(); }, [rechnen]);
  useEffect(() => {
    const wurzel = ul.current;
    if (!wurzel) return;
    document.fonts?.ready.then(rechnen).catch(() => { /* egal */ });
    if (typeof ResizeObserver === "undefined") return;
    // Nur die Breite zählt; eine Höhenänderung (aufklappende Abschnittsliste) nicht.
    let breite = wurzel.getBoundingClientRect().width;
    const ro = new ResizeObserver(() => {
      const b = wurzel.getBoundingClientRect().width;
      if (Math.abs(b - breite) < 1) return;
      breite = b;
      rechnen();
    });
    ro.observe(wurzel);
    return () => ro.disconnect();
  }, [ul, rechnen]);

  return zeilen;
}

/**
 * Der Titel eines Eintrags — als feste Zeilen, solange sie schon ausgerechnet sind.
 * Vorher (erster Render, Schriften noch nicht da) steht der Text normal im Fluss; der
 * Umbruch wird im selben Bild nachgezogen, der Leser sieht den Zwischenstand nie.
 */
function Titel({ text, zeilen, zusatz }: { text: string; zeilen?: string[]; zusatz?: ReactNode }) {
  // Der Typ-Zusatz steht auf einer eigenen Zeile, sobald der Umbruch festgeschrieben ist:
  // gemessen wurde ohne ihn, angehängt an die letzte Zeile liefe er über die Spalte hinaus.
  if (!zeilen) return <span className="verlauf__titel"><span className="verlauf__titel-sicht">{text}{zusatz}</span></span>;
  return (
    <span className="verlauf__titel" data-fest="1">
      {zeilen.map((z, i) => <span key={i} className="verlauf__titel-sicht">{z}</span>)}
      {zusatz && <span className="verlauf__titel-sicht">{zusatz}</span>}
    </span>
  );
}

/**
 * Die Abschnitte EINES Kapitels — unter dem Eintrag, in dem der Leser gerade steht.
 *
 * Die Hülle steht IMMER da, auch zugeklappt: nur so lässt sich das Auf- und Zuklappen
 * überhaupt bewegen (`grid-template-rows: 0fr → 1fr`, Vorlage Zeile 289). Und weil die
 * Zeilen nur für das gerade aktive Kapitel aus dem DOM kommen, merkt sich jeder Eintrag
 * seine zuletzt gesehenen — sonst klappte er ins Leere zu.
 *
 * Sie folgt der Faltung des Kapitels: Ein zusammengefaltetes Kapitel hat keine Abschnitte
 * zum Anspringen, also zeigt das Verzeichnis auch keine.
 */
function Abschnittsliste({ toc, aktiv, offen, zeilen, onZu }: { toc: TocZeile[]; aktiv: string; offen: boolean; zeilen: Map<string, string[]>; onZu?: () => void }) {
  const letzte = useRef<TocZeile[]>([]);
  if (offen && toc.length) letzte.current = toc;
  const eintraege = offen ? toc : letzte.current;
  return (
    <div className="verlauf__toc" data-offen={offen && eintraege.length ? "1" : "0"} inert={!offen || !eintraege.length}>
      <div className="verlauf__toc-fach">
        <ol>
          {eintraege.map((t) => (
            <li key={t.id}>
              <button type="button" className={t.id === aktiv ? "aktiv" : ""} onClick={() => { zuAbschnitt(t.id); onZu?.(); }}>
                <i className="verlauf__strich" />
                <Titel text={t.titel} zeilen={zeilen.get("a\u0000" + t.titel)} />
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/** Eine Kapitelzeile im Verlauf — Nummer, Titel, Fortschrittsstrich. */
function Kapitelzeile({ nr, titel, typ, aktiv, linie, zeilen, onClick, statt }: {
  nr: number; titel: string; typ: string; aktiv: boolean; linie: string;
  zeilen?: string[]; onClick?: () => void; statt?: ReactNode;
}) {
  const zusatz = typ ? <small className="verlauf__typ">{typ}</small> : null;
  return (
    <button type="button" className={aktiv ? "aktiv" : ""} onClick={onClick} tabIndex={onClick ? undefined : -1}>
      <span className="verlauf__nr">{nr2(nr)}</span>
      <span className="verlauf__zeile">
        {statt ? <span className="verlauf__titel"><span className="verlauf__titel-sicht">{statt}</span></span>
               : <Titel text={titel} zeilen={zeilen} zusatz={zusatz} />}
        <i className="verlauf__fortschritt" style={{ width: linie }} />
      </span>
    </button>
  );
}

/** Typ eines Kapitels aus seinem Schlüssel (`post:<slug>` …) — steht im Verlauf nur dann dabei, wenn zwei Einträge gleich heißen. */
function typAusKey(key: string): string {
  const art = key.split(":")[0];
  return ({ post: "Ratgeber", rechner: "Rechner", checkliste: "Checkliste", vergleich: "Vergleich", dokument: "Dokument", dokumente: "Dokumente", begriff: "Begriff", anbieter: "Anbieter", seite: "Seite", spiel: "Spiel" } as Record<string, string>)[art] || "";
}

/**
 * Positionstausch weich: Wandert ein Kapitel ans Ende des Fadens, rücken alle Einträge
 * darunter eine Zeile hoch. Ohne FLIP springen sie — mit FLIP gleiten sie (letzte Lage
 * merken, Differenz als Starttransform animieren). Gilt auch für neu hinzukommende
 * Kapitel: die darüberliegenden gleiten, statt zu hüpfen.
 */
function useListenFlip(ref: React.RefObject<HTMLUListElement | null>, signatur: string) {
  const orte = useRef(new Map<string, number>());
  const letzte = useRef(signatur);
  // Ohne Abhängigkeiten: Die Lagen müssen nach JEDEM Render stimmen, sonst animiert der
  // nächste Tausch gegen eine veraltete Messung (der Rand scrollt ja auch für sich).
  // Bewegt wird aber nur, wenn sich die Reihenfolge wirklich geändert hat.
  useLayoutEffect(() => {
    const ul = ref.current;
    if (!ul) return;
    const darfBewegen = letzte.current !== signatur && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    letzte.current = signatur;
    const neu = new Map<string, number>();
    for (const li of Array.from(ul.children) as HTMLElement[]) {
      const k = li.dataset.k;
      if (!k) continue;
      const oben = li.getBoundingClientRect().top;
      neu.set(k, oben);
      const alt = orte.current.get(k);
      if (!darfBewegen || alt === undefined || typeof li.animate !== "function") continue;
      const d = alt - oben;
      if (Math.abs(d) < 2) continue;
      li.animate([{ transform: `translateY(${d}px)` }, { transform: "none" }], { duration: 420, easing: "cubic-bezier(.2,.8,.2,1)" });
    }
    orte.current = neu;
  });
}

export default function RandLinks({ mobil, onZu }: { mobil?: boolean; onZu?: () => void }) {
  const { verlauf, kapitelNr, kapitelUmschalten, laedt, ladeZiel, liveZu, liveUmschalten } = useFaden();
  const { titel, toc, aktiv, vorhanden, aktivesKapitel, liveKey } = useAbschnittAktiv();
  // Gleiche Titel (Ratgeber „Gaspreise vergleichen“ und die Checkliste dazu) sähen wie ein
  // Fehler aus — dann steht der Typ dabei.
  const zaehler = new Map<string, number>();
  for (const t of [...verlauf.map((k) => k.titel), ...(vorhanden ? [titel] : [])]) zaehler.set(t, (zaehler.get(t) || 0) + 1);
  const typ = (t: string, key: string) => ((zaehler.get(t) || 0) > 1 ? typAusKey(key) : "");
  // Neuer Verlaufseintrag leuchtet kurz (Prototyp 05-js-neu.html listeAktualisieren).
  const vorherigeZahl = useRef(verlauf.length);
  const liste = useRef<HTMLUListElement>(null);
  useListenFlip(liste, verlauf.map((k) => k.id).join("|") + (laedt ? "|laedt" : vorhanden ? "|live" : ""));
  // Feste Zeilenumbrüche für alles, was im Verzeichnis steht (siehe Kopfkommentar).
  const zeilen = useZeilenbruch(liste, [...verlauf.map((k) => k.titel), ...(vorhanden ? [titel] : [])], toc.map((t) => t.titel));
  const kZeilen = (t: string) => zeilen.get("k\u0000" + t);
  useEffect(() => {
    if (verlauf.length > vorherigeZahl.current) {
      const li = document.querySelectorAll<HTMLElement>("#kapitelListe > li")[verlauf.length - 1];
      if (li) { li.classList.add("neu"); setTimeout(() => li.classList.remove("neu"), 1600); }
    }
    vorherigeZahl.current = verlauf.length;
  }, [verlauf.length]);
  const live = vorhanden ? { titel, toc } : null;

  /**
   * Der grüne Strich unter dem Titel sagt, wo der Leser steht (Vorlage Zeile 1828):
   * gelesene Kapitel tragen ihn ganz, das eigene zu 46 %, die noch ungelesenen gar nicht.
   */
  const aktivIdx = aktivesKapitel === "kapitel-live" ? verlauf.length : verlauf.findIndex((k) => `kapitel-alt-${k.id}` === aktivesKapitel);
  const strichBreite = (i: number) => (aktivIdx < 0 ? "0%" : i < aktivIdx ? "100%" : i === aktivIdx ? "46%" : "0%");

  return (
    <aside className={"rand rand--links" + (mobil ? " mobil" : "")} id="randLinks" aria-label="Verlauf und Inhalt">
      <div className="rand__lauf">
        <div className="rand__innen">
          <div className="rand__oben">
            <div className="verlauf">
              <h2>Verlauf</h2>
              <ul id="kapitelListe" ref={liste}>
                {verlauf.map((k, i) => (
                  <li key={k.id} data-k={k.id}>
                    <Kapitelzeile
                      nr={i + 1} titel={k.titel} typ={typ(k.titel, k.key)} zeilen={kZeilen(k.titel)}
                      aktiv={aktivesKapitel === `kapitel-alt-${k.id}`} linie={strichBreite(i)}
                      onClick={() => { const n = document.getElementById(`kapitel-alt-${k.id}`); if (!k.offen) kapitelUmschalten(k.id); if (n) window.scrollTo({ top: n.getBoundingClientRect().top + window.scrollY - kopfHoehe() - 12, behavior: "smooth" }); onZu?.(); }}
                    />
                    <Abschnittsliste toc={toc} aktiv={aktiv} offen={aktivesKapitel === `kapitel-alt-${k.id}` && k.offen} zeilen={zeilen} onZu={onZu} />
                  </li>
                ))}
                {/* 🚨 Während einer Navigation steht das alte Kapitel schon als Verlaufseintrag
                    in der Liste, ist als lebendes aber noch im DOM (nur ausgeblendet). Ohne
                    diesen Zweig stünde es doppelt da und wechselte nach dem Laden den Namen.
                    Stattdessen hält diese Zeile den Platz — mit dem Titel des Ziels, sobald
                    der Link ihn hergibt, sonst als Schimmer; der Name ändert sich nach der
                    Ankunft nicht mehr. */}
                {laedt ? (
                  <li className="verlauf__laedt" data-k="laedt" aria-hidden="true">
                    <Kapitelzeile nr={kapitelNr} titel={ladeZiel?.titel || ""} typ="" aktiv={false} linie="0%"
                      zeilen={ladeZiel?.titel ? kZeilen(ladeZiel.titel) : undefined}
                      statt={ladeZiel?.titel ? undefined : <span className="skelett-zeile" />} />
                  </li>
                ) : live ? (
                  <li key="live" data-k="live">
                    <Kapitelzeile
                      nr={kapitelNr} titel={live.titel} typ={typ(live.titel, liveKey)} zeilen={kZeilen(live.titel)}
                      aktiv={aktivesKapitel === "kapitel-live"} linie={strichBreite(verlauf.length)}
                      onClick={() => { if (liveZu) liveUmschalten(); const n = document.getElementById("kapitel-live"); if (n) window.scrollTo({ top: n.getBoundingClientRect().top + window.scrollY - kopfHoehe() - 12, behavior: "smooth" }); onZu?.(); }}
                    />
                    <Abschnittsliste toc={live.toc} aktiv={aktiv} offen={aktivesKapitel === "kapitel-live" && !liveZu} zeilen={zeilen} onZu={onZu} />
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
      {mobil && <button type="button" className="rand__zu knopf knopf--klein knopf--still" onClick={onZu}>Schließen ✕</button>}
    </aside>
  );
}
