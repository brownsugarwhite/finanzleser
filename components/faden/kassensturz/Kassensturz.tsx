"use client";

/**
 * Finanz-Kassensturz (Port aus dem Prototyp, 04-js-inhalt.html `kassensturzKasten()`):
 * acht Fragen als Karten mit Ikon, Bedingungen (`wenn`), Fortschrittslinie, ruhiger
 * Bühnenwechsel, Schätzfrage mit Regler, Mehrfachauswahl. Am Ende Profil, Ampel,
 * Tacho-Score, Lückenkarten mit echten Zielen, Teilen, Aktenkoffer, 30 Punkte + Wappen.
 * Antworten und Ergebnis liegen in localStorage `faden-kassensturz` (Wiederaufnahme,
 * „Neu starten“); der Teaser unter den Ratgebern liest denselben Stand.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { KassensturzDaten, KassensturzFrage } from "@/lib/faden/optionen";
import { useFaden } from "@/components/faden/FadenProvider";
import { reduzierteBewegung } from "@/lib/faden/belohnung";
import Ikon from "./Ikon";
import Tacho from "./Tacho";
import { type Antworten, KASSENSTURZ_URL, betrag, datumLang, ergebnis, heuteLokal, ikonFuer, istSchaetzfrage, naechsterIndex, offeneFragen, schaetzPunkte, standLesen, standSchreiben } from "./logik";

export interface Ziel { href: string; titel: string }

const TEILEN_URL = "https://www.finanzleser.de" + KASSENSTURZ_URL;
const PLUS_HINWEIS = "Kommt mit Finanzleser Plus";

/** Stand-Zeile und Fortschritt für eine Frage (Prototyp `naechste()`). */
function standFuer(fragen: KassensturzFrage[], idx: number, a: Antworten): { breite: number; text: string } {
  if (idx >= fragen.length) return { breite: 100, text: "Ergebnis" };
  const alle = offeneFragen(fragen, a);
  const nr = alle.indexOf(fragen[idx]) + 1;
  return { breite: Math.round((100 * (nr - 1)) / Math.max(1, alle.length)), text: `Frage ${nr} von ${alle.length}` };
}

function kopfHoehe(): number {
  const k = document.getElementById("kopf");
  return k ? k.offsetHeight : 64;
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

/** Antworten als Karten mit Ikon; die gewählte füllt sich dunkel (Morph von links). */
function Karten({ daten, f, gewaehlt, onKlick }: { daten: KassensturzDaten; f: KassensturzFrage; gewaehlt: (o: string) => boolean; onKlick: (o: string) => void }) {
  return (
    <div className="ks__karten">
      {(f.optionen || []).map((o, i) => (
        <button key={o} type="button" className={"ks__karte" + (gewaehlt(o) ? " gewaehlt" : "")} style={{ animationDelay: `${i * 60}ms` }} onClick={() => onKlick(o)} aria-pressed={gewaehlt(o)}>
          <Ikon name={ikonFuer(daten, f, o)} />
          <span>{o}</span>
        </button>
      ))}
    </div>
  );
}

/** Schätzfrage mit Regler: Tipp abgeben, Auflösung mit Quelle, dann Weiter. */
function SchaetzFrage({ f, onTipp, onWeiter }: { f: KassensturzFrage; onTipp: (wert: number, punkte: number) => void; onWeiter: (wert: number) => void }) {
  const min = f.min ?? 0, max = f.max ?? 100, schritt = f.schritt ?? 10;
  const einheit = f.einheit ?? "€";
  const richtig = f.richtig ?? 0;
  // Startwert wie im Prototyp (1500), in die Spanne der Frage geklemmt; das CMS kann `start` setzen.
  const [wert, setWert] = useState(() => Math.min(max, Math.max(min, f.start ?? 1500)));
  const [aufgeloest, setAufgeloest] = useState(false);
  const abw = Math.abs(wert - richtig);
  const pts = schaetzPunkte(wert, richtig);
  return (
    <>
      <div className="ks__frage">{f.text}</div>
      <div className="ks__schaetz">{betrag(wert, einheit)}</div>
      <input type="range" min={min} max={max} step={schritt} value={wert} disabled={aufgeloest} aria-label="Schätzung" onChange={(e) => setWert(+e.target.value)} />
      {!aufgeloest ? (
        <button type="button" className="ks__weiter" onClick={() => { setAufgeloest(true); onTipp(wert, pts); }}>Das ist mein Tipp<i>→</i></button>
      ) : (
        <>
          <div className="ks__aufloesung ks__rein">
            <b>{betrag(richtig, einheit)}</b>. {abw <= 100 ? `Fast genau getroffen, ${pts} Punkte.` : abw <= 400 ? `Nah dran, ${pts} Punkte.` : "Weiter weg, als die meisten denken."}
            {f.quelle && <small>{f.quelle}</small>}
          </div>
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
  const [datum, setDatum] = useState("");
  const gesperrt = useRef(false); // eine Einzelwahl je Frage, bis die Bühne gewechselt hat
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
      setStand({ breite: 100, text: "Ergebnis" });
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

  const waehlen = (f: KassensturzFrage, o: string) => {
    if (gesperrt.current || antworten[f.id] === o) return;
    gesperrt.current = true;
    const neu = { ...antworten, [f.id]: o };
    setAntworten(neu);
    spaeter(() => naechste(neu, idx + 1), reduzierteBewegung() ? 0 : 320);
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
    <div className={"kasten kasten--pink kasten--ks" + (fertig ? " fertig" : "")} id="kassensturz" ref={kastenRef}>
      <div className="ks">
        <div className="ks__kopf">
          <span className="kicker kicker--pink">{daten.titel}{daten.untertitel ? ` · ${daten.untertitel}` : ""}</span>
          <span className="ks__stand">{stand.text}</span>
        </div>
        <div className="ks__fortschritt"><i style={{ width: `${stand.breite}%` }} /></div>
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
              <Karten daten={daten} f={frage} gewaehlt={gewaehltIn(frage)} onKlick={(o) => waehlen(frage, o)} />
            </>
          )}
          {fertig && (
            <>
              <div className="ks__zier ks__rein" style={verzug(0)}><i /><SparkZier /><i /></div>
              <span className="kicker ks__rein" style={verzug(1)}>Ihr Ergebnis · sofort und vollständig</span>
              <div className="ks__kopfzeile ks__rein" style={verzug(2)}>
                <div className="ks__profilblock">
                  <p className="ks__profil">{erg.profil}</p>
                  <div className="ks__ampel">
                    {erg.gut.map((g) => <span key={`gut-${g}`}>{g}</span>)}
                    {erg.luecken.map((l) => <span key={`rot-${l.kurz}`} className="rot">{l.kurz}</span>)}
                  </div>
                </div>
                <div className="ks__tacho"><Tacho wert={erg.score} max={100} label="von 100" verzug={500} /></div>
              </div>
              <div className="ks__erg-karten ks__rein" style={verzug(3)}>
                {erg.luecken.map((l, i) => (
                  <div className="ks__erg" key={l.kurz || i}>
                    <span className="ks__erg-ikon"><Ikon name={l.ikon} /></span>
                    <span className="ks__nr">{i + 1}</span>
                    <h4>{l.titel}</h4>
                    <p>{l.text}</p>
                    <div className="links">
                      {l.links.map((x) => {
                        const z = ziele[`${x.typ}:${x.slug}`] || { href: `/suche?q=${encodeURIComponent(x.text)}`, titel: x.text };
                        return <a key={`${x.typ}:${x.slug}`} className="textlink" href={z.href} title={z.titel !== x.text ? z.titel : undefined}>{x.text}</a>;
                      })}
                    </div>
                  </div>
                ))}
                {!erg.luecken.length && (
                  <div className="ks__erg ks__erg--gut">
                    <span className="ks__erg-ikon"><Ikon name="schildJa" /></span>
                    <h4>Nichts Dringendes.</h4>
                    <p>Wiederholen Sie den Kassensturz in sechs Monaten; die Werte ändern sich jedes Jahr.</p>
                  </div>
                )}
              </div>
              <div className="ks__aktionen ks__rein" style={verzug(4)}>
                <button type="button" className="textlink" onClick={teilen}>Ergebnis teilen</button>
                <button type="button" className="textlink textlink--still" onClick={() => inDenKoffer(`Kassensturz vom ${datumLang(datum || heuteLokal())}`)}>In den Aktenkoffer</button>
                <button type="button" className="textlink textlink--still" onClick={neuStarten}>Neu starten</button>
              </div>
              <div className="ks__nachher ks__rein" style={verzug(5)}>
                <span className="ks__erg-ikon"><Ikon name="mail" /></span>
                <p><b>Soll ich Ihnen das als PDF schicken?</b> Dann erinnere ich Sie in sechs Monaten daran, den Kassensturz zu wiederholen, mit Vorher-nachher-Vergleich. Die Zahlen ändern sich jedes Jahr.</p>
                <div className="ks__feld">
                  <button type="button" className="btn btn--primary" onClick={() => toast(PLUS_HINWEIS)}>Per E-Mail</button>
                  <button type="button" className="btn" onClick={() => toast(PLUS_HINWEIS)}><Ikon name="flieger" /> Per WhatsApp</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
