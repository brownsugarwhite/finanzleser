"use client";

/**
 * Die Spalten: vier Rubriken als Zeitungsspalten mit ihren Themen. Ein Thema klappt die
 * Spalte auf (die anderen werden zum Buchrücken), zeigt die Ratgeber des Themas in
 * Zeilen wie das alte Megamenü (kleine Titelzeile mit Werkzeugpunkten, fetter
 * Untertitel) und die Werkzeuge zum Thema. Port von spaltenwahl() aus dem Prototyp.
 */
import { Fragment, useEffect, useRef, useState } from "react";
import ToolDots from "@/components/ui/ToolDots";
import { boldYears } from "@/components/ui/MegaPostContent";
import type { SpaltenRubrik } from "@/lib/faden/spalten";

/** So viele Themen stehen auf der Titelseite einer Ausgabe. */
const THEMEN_AUF_TITEL = 4;

/** Drehung je Ausgabe in Grad — bewusst ungleichmaessig, sonst wirkt der Stapel gerastert. */
/**
 * Drehung je Ausgabe in Grad. Sehr klein und bewusst UNREGELMÄSSIG: kein Wechsel der
 * Vorzeichen von Blatt zu Blatt, keine gleichen Beträge. Alternierende Werte lesen sich
 * sofort als Muster und wirken künstlich; so liegt der Stapel, als hätte ihn jemand
 * hingelegt. Die zweite Ausgabe liegt fast gerade.
 */
const DREHUNG = [-1.3, -0.35, 1.1, -0.9];

/**
 * Wie stark sich die Ausgaben je Lücke überdecken — relativ zueinander.
 * Die rechte Ausgabe liegt oben, verdeckt wird also die rechte Kante der linken.
 * „Versicherungen" darf weit über „Finanzen" liegen und „Recht" weit über „Steuern",
 * weil deren Rubriknamen kurz sind; in der Mitte bleibt es knapp, damit
 * „Versicherungen" ganz zu lesen ist.
 */
const LUECKEN_GEWICHT = [1.7, 0.45, 1.7];

/** Breite der Mittelspalte — die angehobene Ausgabe bleibt darin. */
const SPALTE = 728;

export default function Spalten({ rubriken }: { rubriken: SpaltenRubrik[] }) {
  const [offen, setOffen] = useState<{ rk: string; tk: string } | null>(null);
  // Hover-Rahmen um die Spalten (Prototyp: hoverBox(reihe, ".spalte", 16, { oben: 4, unten: 4 }), 03-js-core.html:511);
  // klappt eine Spalte auf, zieht er sich zurück wie setze() im Prototyp.
  // Der Hover-Rahmen um die Ausgaben ist vorerst aus (Wunsch 10.09.2026) — er gehörte
  // zum Satz mit Trennlinien und Funken. Der Ref bleibt, das Raster hängt daran.
  const reihe = useRef<HTMLDivElement>(null);
  const n = rubriken.length || 1;
  const [schwebt, setSchwebt] = useState<number | null>(null);
  // 🚨 Flex statt Raster, und zwar in BEIDEN Zustaenden.
  //
  // Der Kiosk liegt geschlossen als Stapel: feste Kartenbreite, negative Raender fuer die
  // Ueberlappung, jede Ausgabe leicht gedreht. Aufgeschlagen wird daraus eine breite Seite
  // mit schmalen Ruecken daneben. Ein Wechsel des `grid-template-columns` laesst sich nicht
  // weich ueberblenden — `flex-basis` schon. Deshalb traegt eine einzige Flex-Reihe beide
  // Zustaende, und der Uebergang ist eine echte Bewegung statt eines Sprungs.
  const RUECKEN = 40;   // Breite eines zugeklappten Rückens
  const LUFT = 9;       // Abstand zwischen Rücken und aufgeschlagener Seite

  // 🚨 Die Überlappung wird GEMESSEN, nicht in CSS gerechnet.
  //
  // Erster Versuch war `--ueberlapp: calc((n * var(--karte) - 100%) / (n-1))`. Das geht
  // schief: ein Prozentwert in einer Custom Property löst sich erst dort auf, wo die
  // Variable BENUTZT wird. Im `margin-left` der Karte meint `100%` die Reihe (richtig),
  // im `padding-left` des Karteninhalts aber die Karte selbst — daraus wurden 290 px
  // Einzug statt 26, und drei von vier Ausgaben standen leer da.
  const [reihenBreite, setReihenBreite] = useState(0);
  const [spaltenBreite, setSpaltenBreite] = useState(0);
  useEffect(() => {
    const el = reihe.current;
    if (!el) return;
    const messen = () => {
      setReihenBreite(el.clientWidth);
      setSpaltenBreite(el.parentElement?.clientWidth ?? el.clientWidth);
    };
    messen();
    const ro = new ResizeObserver(messen);
    ro.observe(el);
    if (el.parentElement) ro.observe(el.parentElement);
    return () => ro.disconnect();
  }, []);

  /**
   * 🚨 Die Breite der Ausgabe kommt von der längsten Rubrik.
   *
   * „Versicherungen" ist das Maß aller Dinge: der Kasten ist so breit, dass die Zeile
   * ihn genau ausfüllt. Damit hat die Doppellinie dort exakt die Länge der Überschrift —
   * und keine Rubrik bricht mehr um oder läuft in die Nachbarin.
   */
  const KARTE = 213;              // Kastenbreite (= „Versicherungen" bei 22 px + 2 × Einzug)
  const EINZUG = 18;              // seitlicher Einzug im Kasten, muss zu faden.css passen
  const LUFT_AM_TITEL = 3;        // was hinter der Überschrift frei bleibt
  const MIN_UEBER = 10;           // so viel überlappen sie mindestens
  const LUFT_BEIM_SCHWEBEN = 8;   // sichtbare Luft neben der angehobenen Ausgabe
  const NOT_DECKEL = 0.62;        // Deckel, solange die Titel noch nicht gemessen sind
  const HUB = 1.09;               // Vergrößerung der angehobenen Ausgabe
  const HALB = (KARTE * (HUB - 1)) / 2;  // was die Vergrößerung je Seite zusätzlich braucht

  // 🚨 Keine Rubrik darf verdeckt werden. Jede Lücke deckt die RECHTE Seite der linken
  // Ausgabe zu; deren Überschrift muss stehen bleiben. Deshalb wird die Textbreite jeder
  // Überschrift gemessen und daraus der Deckel für die Lücke daneben gebildet.
  const [titelBreite, setTitelBreite] = useState<number[]>([]);
  useEffect(() => {
    const el = reihe.current;
    if (!el) return;
    let tot = false;
    const messen = () => {
      if (tot) return;
      const breiten = Array.from(el.querySelectorAll(".spalte__titel"), (t) => {
        const r = document.createRange();
        r.selectNodeContents(t);
        return r.getBoundingClientRect().width;
      });
      setTitelBreite((alt) => (alt.length === breiten.length && alt.every((v, i) => Math.abs(v - breiten[i]) < 0.5) ? alt : breiten));
    };
    messen();
    document.fonts?.ready.then(messen);
    return () => { tot = true; };
  }, [rubriken]);
  const deckel = (k: number): number =>
    titelBreite[k] ? Math.max(MIN_UEBER, KARTE - EINZUG - titelBreite[k] - LUFT_AM_TITEL) : KARTE * NOT_DECKEL;

  /**
   * Die Lage des Stapels für einen Zustand: die n−1 Lücken und die linken Kanten.
   *
   * 🚨 Das ist die AUSWEICHLAGE — der Stand, den die anderen Ausgaben kurz einnehmen,
   * damit die angehobene ohne Schnitt hochkommen kann. Rechts liegt oben, deshalb braucht
   * die Lücke rechts der angehobenen die volle Luft; links genügt der Platz, den die
   * Vergrößerung selbst einnimmt.
   *
   * Dazu drei harte Bedingungen: die angehobene Ausgabe liegt ganz in der Mittelspalte,
   * der Stapel wird nie breiter als die Reihe (Spalte + zweimal Ausbruch), und keine
   * Überschrift wird verdeckt. Reicht das Umverteilen nicht, wird nachgezogen — in
   * Runden, weil ein Deckel greifen kann und sich die Kanten dabei erneut verschieben.
   */
  const lage = (h: number | null): { g: number[]; x: number[] } => {
    const luecken = Math.max(0, n - 1);
    if (!luecken) return { g: [], x: [0] };
    const gew = LUECKEN_GEWICHT.slice(0, luecken);
    const summeGew = gew.reduce((a, b) => a + b, 0) || 1;
    const noetig = reihenBreite ? Math.max(0, n * KARTE - reihenBreite) : 0;
    const rest = Math.max(0, noetig - MIN_UEBER * luecken);
    const g = gew.map((w, k) => Math.min(deckel(k), MIN_UEBER + rest * (w / summeGew)));
    const stellen = (gg: number[]) => {
      const x = [0];
      for (let k = 1; k < n; k++) x.push(x[k - 1] + KARTE - (gg[k - 1] ?? 0));
      return x;
    };
    if (h === null || !reihenBreite) {
      const x = stellen(g);
      const o = (reihenBreite - (x[n - 1] + KARTE)) / 2;
      return { g, x: x.map((v) => v + o) };
    }
    // Rechts die volle Luft, links nur so viel, wie die Vergrößerung braucht.
    const nachbarn: number[] = [];
    if (h < luecken) { g[h] = -(LUFT_BEIM_SCHWEBEN + HALB); nachbarn.push(h); }
    if (h > 0) { g[h - 1] = -HALB; nachbarn.push(h - 1); }
    const uebrige = g.map((_, k) => k).filter((k) => !nachbarn.includes(k));
    const ausbruch = Math.max(0, (reihenBreite - Math.min(spaltenBreite || SPALTE, SPALTE)) / 2);
    const verteilen = (menge: number) => {
      let offen = uebrige.filter((k) => g[k] < deckel(k) - 0.5);
      for (let p = 0; p < 4 && menge > 0.5 && offen.length; p++) {
        const summe = offen.reduce((a, k) => a + gew[k], 0) || 1;
        let uebrigMenge = 0;
        offen.forEach((k) => {
          const anteil = menge * (gew[k] / summe);
          const platz = deckel(k) - g[k];
          g[k] += Math.min(anteil, platz);
          uebrigMenge += Math.max(0, anteil - platz);
        });
        menge = uebrigMenge;
        offen = offen.filter((k) => g[k] < deckel(k) - 0.5);
      }
    };
    let o = 0;
    for (let runde = 0; runde < 8; runde++) {
      const x = stellen(g);
      const breite = x[n - 1] + KARTE;
      const oMin = Math.max(0, ausbruch + HALB - x[h]);
      const oMax = Math.min(reihenBreite - breite, reihenBreite - ausbruch - HALB - x[h] - KARTE);
      o = Math.min(Math.max((reihenBreite - breite) / 2, oMin), Math.max(oMin, oMax));
      const fehlt = Math.max(0, oMin - oMax);
      if (fehlt <= 0.5) break;
      verteilen(fehlt);
    }
    return { g, x: stellen(g).map((v) => v + o) };
  };

  // 🚨 Ein Zug in zwei Etappen.
  //
  //  1. FREIFAHREN: die anderen Ausgaben weichen zur Seite, die angehobene schiebt sich
  //     seitlich unter der Nachbarin hervor. Wo eine Nachbarin nicht ausweichen kann
  //     („Recht" am Rand), fährt die angehobene selbst weiter — lage() rechnet aus, wer
  //     sich wie weit bewegen muss.
  //  2. NACH VORN: erst jetzt richtet sie sich auf und hebt ab, während die anderen
  //     hinter ihr zurück an ihren Platz entstauchen.
  //
  // Die Endlage der anderen ist wieder ihre Ruhelage — der Umweg dorthin IST die
  // Bewegung. Der Wechsel kommt kurz VOR dem Ende der ersten Etappe (260 < 280 ms), damit
  // die zweite in der Fahrt übernimmt und das Ganze eine einzige Bewegung bleibt.
  const [phase, setPhase] = useState<0 | 1 | 2>(0);
  useEffect(() => {
    if (schwebt === null) { setPhase(0); return; }
    setPhase(1);
    const t = setTimeout(() => setPhase(2), 240);
    return () => clearTimeout(t);
  }, [schwebt]);

  const ruhe = lage(null);
  const weicht = schwebt === null ? ruhe : lage(schwebt);
  /**
   * Wie weit eine Ausgabe aus ihrer Ruhelage weicht.
   * Die angehobene rückt einmal (nur so weit, dass sie ganz in der Mittelspalte liegt)
   * und bleibt dort. Die anderen weichen aus und kommen wieder zurück.
   */
  const versatz = (i: number): number => {
    if (schwebt === null) return 0;
    if (i === schwebt) return Math.round(weicht.x[i] - ruhe.x[i]);
    return phase === 1 ? Math.round(weicht.x[i] - ruhe.x[i]) : 0;
  };

  const gesamt = rubriken.reduce((s, r) => s + r.zahl, 0);
  return (
    <article className="kasten kasten--still spalten-kasten" id="rubriken">
      <div className="spalten__kopf">
        <span className="kicker">Aus dem Kiosk · {gesamt} Ratgeber</span>
        <span className="spalten__wink">Eine Ausgabe antippen</span>
      </div>
      <div
        ref={reihe}
        className={"spalten" + (offen ? " offen" : "")}
        data-phase={offen ? 0 : phase}
        style={{ ["--karte" as string]: `${KARTE}px` }}
        onMouseLeave={() => setSchwebt(null)}
      >
        {rubriken.map((r, i) => {
          const istOffen = offen?.rk === r.key;
          const istRuecken = !!offen && !istOffen;
          const tk = istOffen ? offen.tk : r.themen[0]?.key;
          const th = r.themen.find((t) => t.key === tk) || r.themen[0];
          return (
            <Fragment key={r.key}>
              <div
                className={"spalte" + (istOffen ? " ist-offen" : "") + (istRuecken ? " ist-ruecken" : "") + (schwebt === i ? " schwebt" : "")}
                data-key={r.key}
                onMouseEnter={() => { if (!offen) setSchwebt(i); }}
                style={{
                  // Leichte, unregelmaessige Drehung — wie Zeitungen, die jemand nebeneinandergelegt hat.
                  ["--dreh" as string]: offen ? "0deg" : `${DREHUNG[i % DREHUNG.length]}deg`,
                  // Lage im Stapel: geschlossen die Ruhelage, beim Schweben die Ausweichlage.
                  ["--weg" as string]: offen ? "0px" : `${versatz(i)}px`,
                  flexBasis: offen ? (istOffen ? `calc(100% - ${(n - 1) * (RUECKEN + LUFT)}px)` : `${RUECKEN}px`) : undefined,
                  // Die Ruhelücke links von dieser Ausgabe; das Ausweichen macht `--weg`.
                  marginLeft: i > 0 && !offen ? `${-Math.round(ruhe.g[i - 1] ?? 0)}px` : undefined,
                  // Rechts liegt oben: der Stapel liest sich wie aufgefächerte Blätter.
                  zIndex: schwebt === i ? n + 2 : i + 1,
                }}
              >
                <div className="spalte__inhalt">
                  <span className="spalte__kopfsatz">
                    <span className="spalte__zahl">{r.themen.length} Themen</span>
                    <span className="spalte__nr">{r.zahl} Ratgeber</span>
                  </span>
                  <b className="spalte__titel">{r.titel}</b>
                  <i className="doppellinie" />
                  {r.icon && <span className="spalte__visual"><img src={r.icon} alt="" /></span>}
                  <ul className="spalte__themen">
                    {r.themen.slice(0, THEMEN_AUF_TITEL).map((t) => (
                      <li key={t.key}><button type="button" onClick={() => setOffen({ rk: r.key, tk: t.key })}><span>{t.name}</span><small>{t.zahl}</small></button></li>
                    ))}
                  </ul>
                  {r.themen.length > THEMEN_AUF_TITEL && (
                    <small className="spalte__mehr">+ {r.themen.length - THEMEN_AUF_TITEL} weitere Themen</small>
                  )}
                  <button type="button" className="pfeil-link spalte__auf" onClick={() => setOffen({ rk: r.key, tk: r.themen[0]?.key || "" })}>Aufschlagen<i /></button>
                </div>
                <button type="button" className="spalte__ruecken" onClick={() => setOffen({ rk: r.key, tk: r.themen[0]?.key || "" })}>
                  {r.icon && <img src={r.icon} alt="" />}<span>{r.titel}</span>
                </button>
                {istOffen && th && (
                  <div className="spalte__offen">
                    <div className="spalte__kopfzeile">
                      {r.icon && <img src={r.icon} alt="" />}<b>{r.titel}</b><small>{r.zahl} Ratgeber · {r.themen.length} Themen</small>
                      <button type="button" className="textlink textlink--still" onClick={() => setOffen(null)}>Alle Rubriken ✕</button>
                    </div>
                    <div className="spalte__tabs">
                      {r.themen.map((t) => (
                        <button key={t.key} type="button" className={"chip" + (t.key === th.key ? " chip--aktiv" : "")} onClick={() => setOffen({ rk: r.key, tk: t.key })}>{t.name}</button>
                      ))}
                    </div>
                    <div className="spalte__liste">
                      {th.liste.map((e, j) => (
                        <a key={e.slug} className="spalte__artikel" href={e.href} style={{ animationDelay: `${60 + j * 55}ms` }}>
                          <span className="spalte__kleine"><span>{e.titel}</span><ToolDots tools={e.tools} size={8} style={{ marginLeft: 0 }} /></span>
                          <b>{e.untertitel ? boldYears(e.untertitel) : boldYears(e.titel)}</b>
                          <span className="pfeil-link">Ratgeber lesen<i /></span>
                        </a>
                      ))}
                    </div>
                    <div className="spalte__fuss">
                      {th.werkzeuge.length > 0 && <span className="kicker">Finanztools zum Thema</span>}
                      {th.werkzeuge.map((w) => (
                        <a key={w.typ + w.slug} className="chip chip--still" href={w.href}><i className={`dot dot--${w.typ}`} /> {w.titel}</a>
                      ))}
                      <a className="pfeil-link spalte__alle" href={th.zahl > th.liste.length ? th.href : r.href}>{th.zahl > th.liste.length ? `Alle ${th.zahl} Ratgeber in ${th.name}` : `Alle ${r.zahl} Ratgeber in ${r.titel}`}<i /></a>
                    </div>
                  </div>
                )}
              </div>
            </Fragment>
          );
        })}
      </div>
    </article>
  );
}
