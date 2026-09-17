"use client";

/**
 * Finanz-Kassensturz — Baustein 3 der Übergabe „Finanzleser Heute" (17.09.2026): links
 * die Bühne, rechts der Beleg, der bei jeder Antwort eine Zeile mitdruckt. Die Punkte
 * fliegen von der gedrückten Taste zur Zwischensumme.
 *
 * Port aus dem Prototyp, 04-js-inhalt.html `kassensturzKasten()`:
 * acht Fragen als Karten mit Ikon, Bedingungen (`wenn`), Fortschrittslinie, ruhiger
 * Bühnenwechsel, Schätzfrage mit Regler, Mehrfachauswahl. Am Ende Profil, Ampel,
 * Tacho-Score, Lückenkarten mit echten Zielen, Teilen, Aktenkoffer, 30 Punkte + Wappen.
 * Antworten und Ergebnis liegen in localStorage `faden-kassensturz` (Wiederaufnahme,
 * „Neu starten“); der Teaser unter den Ratgebern liest denselben Stand.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { kopfHoehe } from "@/lib/faden/scrollen";
import type { KassensturzDaten, KassensturzFrage } from "@/lib/faden/optionen";
import { useFaden } from "@/components/faden/FadenProvider";
import { reduzierteBewegung } from "@/lib/faden/belohnung";
import Ikon from "./Ikon";
import Fortschrittsreihe from "./Fortschrittsreihe";
import Beleg from "./Beleg";
import Lineal from "@/components/kursblatt/eingabe/Lineal";
import Adresszeile from "@/components/faden/Adresszeile";
import Button from "@/components/ui/Button";
import { LeoRede } from "@/components/faden/leo/Blase";
import Tacho from "./Tacho";
import { type Antworten, KASSENSTURZ_URL, betrag, datumLang, ergebnis, heuteLokal, ikonFuer, istSchaetzfrage, naechsterIndex, offeneFragen, schaetzPunkte, standLesen, standSchreiben } from "./logik";

export interface Ziel { href: string; titel: string }

const TEILEN_URL = "https://www.finanzleser.de" + KASSENSTURZ_URL;
const PLUS_HINWEIS = "Kommt mit Finanzleser Plus";

/**
 * Stand-Zeile und Fortschritt für eine Frage (Prototyp `naechste()`).
 *
 * Der Fortschritt ist seit dem 12.09.2026 eine Reihe von Segmenten wie in Design A v2
 * (Zeile 829–831 der Übergabe), kein durchgehender Balken mehr — deshalb `nr` und
 * `gesamt` statt einer Prozentbreite.
 *
 * 🚨 `gesamt` ist KEINE feste Fünf. Die Zahl kommt aus den offenen Fragen, und die
 * `wenn`-Bedingungen filtern je nach Antwort. Wer sie hart setzt, lässt das Raster
 * mitten im Lauf springen.
 */
function standFuer(fragen: KassensturzFrage[], idx: number, a: Antworten): { nr: number; gesamt: number; text: string } {
  const alle = offeneFragen(fragen, a);
  if (idx >= fragen.length) return { nr: alle.length + 1, gesamt: alle.length, text: "Ergebnis" };
  const nr = alle.indexOf(fragen[idx]) + 1;
  return { nr, gesamt: alle.length, text: `Frage ${nr} von ${alle.length}` };
}

function verzug(i: number): CSSProperties {
  return { animationDelay: `${i * 90}ms` };
}

function SparkZier() {
  return (
    <svg className="spark" viewBox="0 0 12 12.0005" aria-hidden="true">
      <path d="M12 6.00047C10.3384 5.64978 8.28716 5.41362 7.24241 3.91374C6.47491 2.81169 6.27276 1.28871 6.00024 0.000471365C5.61861 1.71435 5.40087 3.79684 3.79407 4.83384C2.69548 5.54325 1.25351 5.72142 0 6.01226C1.28705 6.29225 2.79561 6.48692 3.89751 7.25194C5.4174 8.30686 5.61672 10.3366 6.00024 12.0005C6.17594 11.1204 6.33322 10.2272 6.62463 9.37638C7.27878 7.46453 8.37832 6.85223 10.2643 6.37379L12 6.00047Z" fill="currentColor" />
    </svg>
  );
}

/**
 * Antworten als Karten mit Ikon — in der Übergabe sind es Tasten einer Registrierkasse:
 * gedrückt sinken sie ein, füllen sich mit Tinte und schicken ihre Punkte zum Beleg.
 *
 * 🚨 `onKlick` bekommt den Knoten mit: Der Punkte-Flug startet an der gedrückten Taste,
 * und ihre Lage ist nur hier bekannt.
 */
function Karten({ daten, f, gewaehlt, onKlick }: { daten: KassensturzDaten; f: KassensturzFrage; gewaehlt: (o: string) => boolean; onKlick: (o: string, el: HTMLElement) => void }) {
  return (
    <div className="ks__karten">
      {(f.optionen || []).map((o, i) => (
        <button key={o} type="button" className={"ks__karte" + (gewaehlt(o) ? " gewaehlt" : "")} style={{ animationDelay: `${i * 70}ms` }} onClick={(e) => onKlick(o, e.currentTarget)} aria-pressed={gewaehlt(o)}>
          <Ikon name={ikonFuer(daten, f, o)} />
          <b>{o}</b>
        </button>
      ))}
    </div>
  );
}

/** Schätzfrage mit Regler: Tipp abgeben, Auflösung mit Quelle, dann Weiter. */
/** Lage eines Werts auf der Bahn in Prozent. */
function anteil(w: number, min: number, max: number): number {
  return max > min ? Math.max(0, Math.min(100, ((w - min) / (max - min)) * 100)) : 0;
}

function SchaetzFrage({ f, onTipp, onWeiter }: { f: KassensturzFrage; onTipp: (wert: number, punkte: number) => void; onWeiter: (wert: number) => void }) {
  const min = f.min ?? 600, max = f.max ?? 2400, schritt = f.schritt ?? 50;
  const einheit = f.einheit ?? "€";
  const richtig = f.richtig ?? 0;
  // Startwert wie im Prototyp, in die Spanne der Frage geklemmt; das CMS kann `start` setzen.
  const [wert, setWert] = useState(() => Math.min(max, Math.max(min, f.start ?? 1400)));
  const [aufgeloest, setAufgeloest] = useState(false);
  const pts = schaetzPunkte(wert, richtig);
  // Urteil und Farbe wie in der Übergabe: Volltreffer ≤ 150, nah dran ≤ 350, sonst weit weg.
  const abw = Math.abs(wert - richtig);
  const urteil = abw <= 150 ? "gut" : abw <= 350 ? "nah" : "weit";
  return (
    <>
      <div className="ks__frage">{f.text}</div>
      <p className="ks__hinweis">Ziehen Sie das Lineal unter der Nadel hindurch. Danach zeige ich den echten Wert.</p>
      {/* 🚨 Dasselbe Lineal wie im Kursblatt (FL Lineal aus der Kursblatt-Übergabe), nicht
          ein zweiter Regler daneben. Nach dem Tipp liegt eine durchsichtige Sperre darauf:
          Das Lineal soll stehen bleiben, wo der Leser es gelassen hat — ein `disabled`
          könnte es nicht, das Bauteil kennt keinen solchen Zustand. */}
      <div className={"ks-schaetz" + (aufgeloest ? " ist-gesperrt" : "")}>
        <Lineal
          wert={wert}
          onWert={setWert}
          min={min}
          max={max}
          schritt={schritt}
          px={7}
          major={Math.max(1, Math.round(500 / schritt))}
          mittel={Math.max(1, Math.round(250 / schritt))}
          einheit={einheit}
          werkzeug="gruen"
          ariaLabel="Ihre Schätzung"
        />
        {aufgeloest && <i className="ks-schaetz__sperre" aria-hidden="true" />}
      </div>
      {!aufgeloest ? (
        <span className="ks-deck__start"><Button label="Tipp abgeben" onClick={() => { setAufgeloest(true); onTipp(wert, pts); }} /></span>
      ) : (
        <>
          {/* Die Auflösung: eine Zeile mit Tipp-Marke, Spanne und Wahrheits-Knoten. */}
          <div className="ks-aufl" data-urteil={urteil}>
            <i className="ks-aufl__grund" aria-hidden="true" />
            <i className="ks-aufl__spanne" style={{ left: `${Math.min(anteil(wert, min, max), anteil(richtig, min, max))}%`, width: `${Math.abs(anteil(richtig, min, max) - anteil(wert, min, max))}%` }} aria-hidden="true" />
            <span className="ks-aufl__tipp" style={{ left: `${anteil(wert, min, max)}%` }}><em>Ihr Tipp {betrag(wert, einheit)}</em></span>
            <span className="ks-aufl__wahr" style={{ left: `${anteil(richtig, min, max)}%` }}><em>tatsächlich {betrag(richtig, einheit)}</em></span>
          </div>
          <p className="ks-aufl__urteil" data-urteil={urteil}>
            {urteil === "gut" ? "Volltreffer — Sie kennen Ihre Zahlen." : urteil === "nah" ? "Nah dran." : "Weit weg — gut, dass Sie es jetzt wissen."}
            {pts > 0 && <b> +{pts} Punkte</b>}
            {f.quelle && <small>{f.quelle}</small>}
          </p>
          <button type="button" className="ks__weiter ks__rein" onClick={() => onWeiter(wert)}>Weiter<i>→</i></button>
        </>
      )}
    </>
  );
}

export default function Kassensturz({ daten, ziele }: { daten: KassensturzDaten; ziele: Record<string, Ziel> }) {
  const { toast, inDenKoffer, belohne } = useFaden();
  const fragen = daten.fragen;
  const kastenRef = useRef<HTMLDivElement>(null);
  const [antworten, setAntworten] = useState<Antworten>({});
  const [idx, setIdx] = useState(() => naechsterIndex(fragen, 0, {}));
  const [stand, setStand] = useState(() => standFuer(fragen, naechsterIndex(fragen, 0, {}), {}));
  const [buehne, setBuehne] = useState("");
  const [mail, setMail] = useState("");
  const [datum, setDatum] = useState("");
  const gesperrt = useRef(false); // eine Einzelwahl je Frage, bis die Bühne gewechselt hat
  /**
   * Der Punkte-Flug: ein Chip, der von der gedrückten Taste zur Zwischensumme des Belegs
   * fliegt. Die Koordinaten sind SEITENKOORDINATEN (inklusive Scrollstand), damit der
   * Chip im Wurzelelement absolut liegen kann und an keinem `overflow` hängen bleibt.
   */
  const [flug, setFlug] = useState<{ id: number; x0: number; y0: number; x1: number; y1: number; text: string; ton: string } | null>(null);
  const flugId = useRef(0);
  const timer = useRef<number[]>([]);
  const fertig = idx >= fragen.length;
  const frage = fertig ? null : fragen[idx];

  const spaeter = useCallback((fn: () => void, ms: number) => {
    const t = window.setTimeout(() => { timer.current = timer.current.filter((x) => x !== t); fn(); }, ms);
    timer.current.push(t);
  }, []);
  useEffect(() => {
    const t = timer;
    return () => { t.current.forEach((x) => clearTimeout(x)); t.current = []; };
  }, []);

  // Wiederaufnahme: gespeicherter Stand (Ergebnis oder offene Frage) ersetzt den Anfang.
  useEffect(() => {
    const s = standLesen();
    if (!s) return;
    const i = s.fertig ? fragen.length : naechsterIndex(fragen, s.idx, s.antworten);
    setAntworten(s.antworten);
    setIdx(i);
    setStand(standFuer(fragen, i, s.antworten));
    if (i >= fragen.length) setDatum(s.datum || heuteLokal());
  }, [fragen]);

  // Ruhiger Wechsel: die Bühne geht nach oben aus, die nächste Frage kommt von unten (220 ms).
  const wechsel = useCallback((anwenden: () => void) => {
    if (reduzierteBewegung()) { anwenden(); return; }
    setBuehne("geht");
    spaeter(() => {
      anwenden();
      setBuehne("kommt");
      requestAnimationFrame(() => requestAnimationFrame(() => setBuehne("")));
    }, 220);
  }, [spaeter]);

  const zumKasten = useCallback(() => {
    const k = kastenRef.current;
    if (!k) return;
    window.scrollTo({ top: k.getBoundingClientRect().top + window.scrollY - kopfHoehe() - 12, behavior: reduzierteBewegung() ? "auto" : "smooth" });
  }, []);

  const naechste = useCallback((a: Antworten, ab: number) => {
    const i = naechsterIndex(fragen, ab, a);
    const alt = standLesen();
    gesperrt.current = false;
    if (i >= fragen.length) {
      const e = ergebnis(daten, a);
      const heute = heuteLokal();
      standSchreiben({ antworten: a, idx: i, fertig: true, datum: heute, score: e.score, luecken: e.luecken.length, belohnt: true, schaetzBelohnt: !!alt?.schaetzBelohnt });
      setStand(standFuer(fragen, i, a));
      setDatum(heute);
      wechsel(() => {
        setIdx(i);
        spaeter(() => belohne(30, kastenRef.current, { wappen: "kassensturz" }), 500);
        spaeter(zumKasten, 60);
      });
      return;
    }
    standSchreiben({ antworten: a, idx: i, fertig: false, schaetzBelohnt: !!alt?.schaetzBelohnt });
    setStand(standFuer(fragen, i, a));
    wechsel(() => setIdx(i));
  }, [daten, fragen, wechsel, spaeter, belohne, zumKasten]);

  /** Was diese Antwort am Stand bewegt — dieselbe Rechnung wie im Beleg. */
  const punkteFuer = (vorher: Antworten, nachher: Antworten) => ergebnis(daten, nachher).score - ergebnis(daten, vorher).score;

  /** Den Chip von der Taste zur Zwischensumme schicken. */
  const fliegen = (el: HTMLElement | null, punkte: number) => {
    if (!el || reduzierteBewegung()) return;
    const ziel = kastenRef.current?.querySelector<HTMLElement>(".ks-beleg__zahl");
    if (!ziel) return;
    const a = el.getBoundingClientRect();
    const b = ziel.getBoundingClientRect();
    const id = ++flugId.current;
    setFlug({
      id,
      x0: a.right + window.scrollX - 12, y0: a.top + window.scrollY + a.height / 2,
      x1: b.left + window.scrollX + b.width / 2, y1: b.top + window.scrollY + b.height / 2,
      text: punkte > 0 ? `+${punkte}` : String(punkte),
      ton: punkte > 0 ? "plus" : punkte < 0 ? "minus" : "null",
    });
    spaeter(() => setFlug((x) => (x && x.id === id ? null : x)), 700);
  };

  const waehlen = (f: KassensturzFrage, o: string, el?: HTMLElement) => {
    if (gesperrt.current || antworten[f.id] === o) return;
    gesperrt.current = true;
    const neu = { ...antworten, [f.id]: o };
    fliegen(el ?? null, punkteFuer(antworten, neu));
    setAntworten(neu);
    // 640 ms: so lange bleibt die Taste gedrückt, bevor die Bühne wechselt (Übergabe).
    spaeter(() => naechste(neu, idx + 1), reduzierteBewegung() ? 0 : 640);
  };
  const umschalten = (f: KassensturzFrage, o: string) => {
    const alt = antworten[f.id];
    const liste = Array.isArray(alt) ? alt : [];
    setAntworten({ ...antworten, [f.id]: liste.includes(o) ? liste.filter((x) => x !== o) : [...liste, o] });
  };
  const tipp = (f: KassensturzFrage, wert: number, punkte: number) => {
    const s = standLesen();
    if (punkte > 0 && !s?.schaetzBelohnt) belohne(punkte, kastenRef.current);
    standSchreiben({ antworten: { ...antworten, [f.id]: wert }, idx, fertig: false, schaetzBelohnt: (s?.schaetzBelohnt ?? false) || punkte > 0 });
  };

  const erg = useMemo(() => ergebnis(daten, antworten), [daten, antworten]);

  const teilen = async () => {
    try { await navigator.clipboard.writeText(TEILEN_URL); toast("Link kopiert: " + TEILEN_URL); }
    catch { toast(TEILEN_URL); }
  };
  const neuStarten = () => {
    standSchreiben(null);
    const leer: Antworten = {};
    setAntworten(leer);
    setDatum("");
    naechste(leer, 0);
  };

  const gewaehltIn = (f: KassensturzFrage) => (o: string) => {
    const v = antworten[f.id];
    return Array.isArray(v) ? v.includes(o) : v === o;
  };

  return (
    <div className={"ks-satz" + (fertig ? " fertig" : "")} id="kassensturz" ref={kastenRef}>
      {/* 🚨 Einhänger, Kicker und Fortschritt gehören über BEIDE Spalten (Wunsch
          17.09.2026). Sie beschreiben den ganzen Kassensturz, nicht nur die Bühne — und
          eine grüne Linie, die auf halber Satzbreite endet, liest sich wie ein Fehler. */}
      <div className="ks-satz__kopf">
        <div className="ks__kopf">
          <span className="kicker kicker--gruen ks__marke"><i /> {daten.titel}{daten.untertitel ? ` · ${daten.untertitel}` : ""}</span>
          <span className="ks__stand">{stand.text}</span>
        </div>
        <Fortschrittsreihe nr={stand.nr} gesamt={stand.gesamt} />
      </div>
      <div className="ks">
        <div className={"ks__buehne" + (buehne ? ` ${buehne}` : "")}>
          {frage && istSchaetzfrage(frage) && (
            <SchaetzFrage key={frage.id} f={frage} onTipp={(w, p) => tipp(frage, w, p)} onWeiter={(w) => naechste({ ...antworten, [frage.id]: w }, idx + 1)} />
          )}
          {frage && !istSchaetzfrage(frage) && frage.mehrfach && (
            <>
              <div className="ks__frage">{frage.text}</div>
              <Karten daten={daten} f={frage} gewaehlt={gewaehltIn(frage)} onKlick={(o) => umschalten(frage, o)} />
              <button type="button" className="ks__weiter" onClick={() => naechste({ ...antworten, [frage.id]: Array.isArray(antworten[frage.id]) ? antworten[frage.id] : [] }, idx + 1)}>Weiter<i>→</i></button>
              <button type="button" className="ks__still" onClick={() => naechste({ ...antworten, [frage.id]: [] }, idx + 1)}>Keine davon</button>
            </>
          )}
          {frage && !istSchaetzfrage(frage) && !frage.mehrfach && (
            <>
              <div className="ks__frage">{frage.text}</div>
              <Karten daten={daten} f={frage} gewaehlt={gewaehltIn(frage)} onKlick={(o, el) => waehlen(frage, o, el)} />
            </>
          )}
          {fertig && (
            <>
              <div className="ks__zier ks__rein" style={verzug(0)}><i /><SparkZier /><i /></div>
              {/* Tacho links, Urteil rechts — Übergabe „Finanzleser Heute", Baustein 3. */}
              <div className="ks-erg ks__rein" style={verzug(1)}>
                <div className="ks-erg__tacho"><Tacho wert={erg.score} max={100} label="von 100" verzug={500} /></div>
                <div className="ks-erg__urteil">
                  <span className="kicker">Ihr Ergebnis</span>
                  <h4 className="ks-erg__schlag">{erg.score >= 75 ? "Solide aufgestellt." : erg.score >= 45 ? "Gute Basis — mit Lücken." : "Da fehlt Grundlegendes."}</h4>
                  <p className="ks-erg__vorspann">{erg.profil}</p>
                  {/* Die Ampel: drei Punkte, einer leuchtet. Welcher, sagt der Score. */}
                  <div className="ks-ampel" data-stufe={erg.score >= 75 ? "gruen" : erg.score >= 45 ? "gelb" : "rot"}>
                    <i className="ks-ampel__rot" /><i className="ks-ampel__gelb" /><i className="ks-ampel__gruen" />
                    <span>{erg.score >= 75 ? "Grün · gut aufgestellt" : erg.score >= 45 ? "Gelb · Grundlage steht, es fehlt etwas" : "Rot · hier fehlt Grundlegendes"}</span>
                  </div>
                  {erg.gut.length > 0 && <p className="ks-erg__gut">Belegt: {erg.gut.join(" · ")}</p>}
                </div>
              </div>

              {/* Die größten Lücken — `ergebnis()` sortiert sie bereits nach Gewicht. */}
              {erg.luecken.length > 0 && (
                <div className="ks-luecken ks__rein" style={verzug(2)}>
                  <span className="kicker ks-luecken__kopf">{erg.luecken.length === 1 ? "Ihre größte Lücke" : `Ihre ${erg.luecken.length} größten Lücken`}</span>
                  <ol>
                    {erg.luecken.map((l, i) => (
                      <li key={l.kurz || i} style={{ animationDelay: `calc(.25s + ${i} * .12s)` }}>
                        <span className="ks-luecken__nr">{i + 1}</span>
                        <span className="ks-luecken__satz">
                          <b>{l.titel}</b>
                          <small>{l.text}</small>
                        </span>
                        <span className="ks-luecken__wege">
                          {l.links.map((x) => {
                            const z = ziele[`${x.typ}:${x.slug}`] || { href: `/suche?q=${encodeURIComponent(x.text)}`, titel: x.text };
                            return <a key={`${x.typ}:${x.slug}`} className="strich-link" href={z.href} title={z.titel !== x.text ? z.titel : undefined}>{x.text}<i /></a>;
                          })}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {!erg.luecken.length && (
                <div className="ks__erg ks__erg--gut ks__rein" style={verzug(2)}>
                  <span className="ks__erg-ikon"><Ikon name="schildJa" /></span>
                  <h4>Nichts Dringendes.</h4>
                  <p>Wiederholen Sie den Kassensturz in sechs Monaten; die Werte ändern sich jedes Jahr.</p>
                </div>
              )}

              {/* Zustellung: dieselbe Adresszeile wie im Wochenbrief, nur in Markengrün
                  und mit anderem Versprechen. */}
              <div className="ks-zustellung ks__rein" style={verzug(3)}>
                <Adresszeile
                  label="Ergebnis als PDF an"
                  knopf="Schicken"
                  ton="marke"
                  onSenden={() => { toast(PLUS_HINWEIS); return PLUS_HINWEIS; }}
                  hinweis="Nur der Beleg als PDF, kein Newsletter."
                />
              </div>
              <div className="ks__aktionen ks__rein" style={verzug(4)}>
                <button type="button" className="strich-link" onClick={teilen}>Ergebnis teilen</button>
                <button type="button" className="strich-link strich-link--still" onClick={() => inDenKoffer(`Kassensturz vom ${datumLang(datum || heuteLokal())}`)}>In den Aktenkoffer</button>
                <button type="button" className="strich-link strich-link--still" onClick={neuStarten}>Noch einmal</button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Der Beleg steht rechts und klebt beim Scrollen — er ist die zweite Hälfte des
          Bauteils, nicht eine Randnotiz. Im Ergebnis bleibt er stehen und trägt den
          Stempel. */}
      <Beleg daten={daten} antworten={antworten} fertig={fertig} />

      {/* Der Punkte-Flug liegt im Wurzelknoten, damit ihn kein `overflow` beschneidet. */}
      {flug && (
        <span
          key={flug.id}
          className="ks-flug"
          data-ton={flug.ton}
          style={{ ["--x0" as string]: `${flug.x0}px`, ["--y0" as string]: `${flug.y0}px`, ["--x1" as string]: `${flug.x1}px`, ["--y1" as string]: `${flug.y1}px` } as CSSProperties}
          aria-hidden="true"
        >
          {flug.text}
        </span>
      )}
    </div>
  );
}
