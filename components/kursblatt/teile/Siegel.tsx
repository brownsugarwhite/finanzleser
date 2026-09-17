"use client";

/**
 * Das Siegel — „BESTWERT" als BRIEFMARKE: Rechteck mit gezahntem Rand, Holo-Folie,
 * dünner Innenrahmen, und ein Schimmer, der bei jedem Scrollen einmal darüberläuft.
 *
 * Zweite Form seit dem 17.09.2026: `form="kreis"` — dieselbe Folie, derselbe Schimmer,
 * aber rund und mit gestricheltem Ring statt Zahnung. Sie trägt das „KOSTENLOS" auf dem
 * Abo-Coupon (Übergabe „Finanzleser Heute", Baustein 5). Die Folie und ihre Mechanik
 * stehen genau einmal; wer eine dritte Form braucht, gibt ihr hier eine Maske.
 *
 * Vorlage: `design_handoff_finanzleser_kursblatt 3/FL Siegel.dc.html` (Runde 2, Punkt 1).
 * Die Maße sind dort Vielfache des Zahns (7 px): 98×35 groß, 112×35 in der Liste.
 * Die Löcher sind Kreise mit r = 0,3 · Zahn, die per `<mask>` aus der Fläche gestanzt
 * werden — alle vier Kanten entlang, im Abstand eines Zahns.
 *
 * 🚨 ZWEI Dinge, die leicht durcheinandergehen:
 *
 *   1. Die FOLIE steht still. Sie liegt als gekachelter `<pattern>` IM FENSTER; das
 *      Siegel ist nur der Ausschnitt darauf. Scrollt die Seite, wandert das Siegel über
 *      ein stehendes Bild — genau so bricht sich das Licht an einer echten Folie.
 *      `background-attachment: fixed` kann das hier NICHT: es bezieht sich nur dann aufs
 *      Fenster, wenn KEIN Vorfahr transformiert ist, und das Siegel ist gedreht. Deshalb
 *      wird gerechnet: `patternTransform` = negative Fensterposition, modulo Kachel.
 *   2. Der SCHIMMER läuft. Ein schräger Weißverlauf zieht beim Scrollen einmal über die
 *      Marke, höchstens alle 1,8 s und nur, solange sie im Bild ist.
 *
 * Beides ist billig gehalten: ein passiver Scroll-Zuhörer, auf einen Frame gedrosselt,
 * und er arbeitet nur, während ein IntersectionObserver das Siegel im Bild meldet.
 */
import { useEffect, useRef, useState } from "react";

/** Kantenlänge eines Zahns. Breite und Höhe müssen Vielfache davon sein. */
const ZAHN = 7;

/* Die Kachel, in der die Folie im Fenster liegt (public/holo.jpg misst 897×705).
   🚨 Kleiner als das Fenster, sonst füllt ein 112-px-Siegel nur acht Prozent des Bildes
   und zeigt eine fast einfarbige Stelle. Bei 420 px liegen mehrere Schlieren im
   Ausschnitt, und ein kurzer Scrollweg wechselt sie sichtbar. Als `<pattern>`, damit die
   Kachel nahtlos weiterläuft — ein einzelnes `<image>` hätte an jeder Kachelgrenze ein
   Loch. */
const KACHEL_B = 300;
const KACHEL_H = 236;

export default function Siegel({
  text, klein = false, animation, form = "marke", gross,
}: {
  text: string;
  klein?: boolean;
  /** Name der Keyframes aus useLauf — wechselt bei jeder Neuberechnung, damit sie neu läuft. */
  animation?: string;
  /** „marke" ist die gezahnte Briefmarke, „kreis" die runde Plakette mit Strichelring. */
  form?: "marke" | "kreis";
  /** Durchmesser der runden Form; ohne Angabe 132 px. */
  gross?: number;
}) {
  const huelle = useRef<HTMLSpanElement>(null);
  const folie = useRef<SVGPatternElement>(null);
  // Zwei Keyframes im Wechsel, damit ein neuer Lauf auch dann startet, wenn der alte
  // noch läuft — ein zweites Mal derselbe Name tut nichts.
  const [lauf, setLauf] = useState(0);
  /**
   * 🚨 Bewusst KEIN `useId()`. Gemessen 15.09. am Lineal und 17.09. hier: Server und
   * Client vergeben im Faden verschiedene Präfixe, und React verwirft die Hydration mit
   * „some attributes of the server rendered HTML didn't match" — die IDs stehen ja an
   * `mask`, `pattern` und `linearGradient` und damit im gelieferten HTML. Aus Text und
   * Form gebildet ist der Name auf beiden Seiten derselbe; zwei Siegel mit demselben Text
   * und derselben Form sehen ohnehin gleich aus und dürfen sich die Defs teilen.
   */
  const id = "sg" + (text + form + (klein ? "k" : "") + (gross ?? "")).toLowerCase().replace(/[^a-z0-9]/g, "");

  /* Die Maße der Vorlage waren 98×35 (Gewinner) und 112×21 (Liste). Der User hat die
     Marke zweimal größer bestellt — erst mehr Höhe, dann größer insgesamt. Alles bleibt
     ein Vielfaches des Zahns (7): 126 = 18 · 7, 42 = 6 · 7, 140 = 20 · 7.
     🚨 Die Zähnung geht nur auf, solange Breite und Höhe durch 7 teilbar sind. */
  const rund = form === "kreis";
  const d = gross ?? 132;
  const w = rund ? d : klein ? 140 : 126;
  const h = rund ? d : 42;
  const r = +(ZAHN * 0.3).toFixed(2);
  const innen = +(ZAHN * 0.55).toFixed(1);

  const loecher: { x: number; y: number }[] = [];
  if (!rund) {
    for (let x = 0; x <= w + 0.01; x += ZAHN) { loecher.push({ x, y: 0 }); loecher.push({ x, y: h }); }
    for (let y = ZAHN; y < h - 0.01; y += ZAHN) { loecher.push({ x: 0, y }); loecher.push({ x: w, y }); }
  }

  useEffect(() => {
    const box = huelle.current;
    const bild = folie.current;
    if (!box || !bild) return;

    let imBild = false;
    let geplant = 0;
    let zuletzt = -9999;
    const ruhig = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const setzen = () => {
      geplant = 0;
      const rect = box.getBoundingClientRect();
      // Die Folie liegt IM FENSTER und steht darin still; das Siegel ist nur der
      // Ausschnitt darauf. Also wird die Kachel um die Fensterposition des Siegels
      // zurückgeschoben — modulo der Kachel, damit die Zahl klein bleibt.
      const mod = (a: number, n: number) => ((a % n) + n) % n;
      bild.setAttribute("patternTransform", `translate(${-mod(rect.left, KACHEL_B).toFixed(1)} ${-mod(rect.top, KACHEL_H).toFixed(1)})`);
    };
    /* 🚨 ZWEI Dinge beim Scrollen, nicht eines:
         die FOLIE steht still (oben, `setzen`) — sie verschiebt sich gegen die Marke,
         der SCHEIN läuft durch — ein Weißstreifen zieht einmal quer darüber.
       Der Schein hing vorher an derselben Funktion und damit an derselben Drosselung auf
       einen Frame; er startete dadurch fast nie. Jetzt ein eigener Zähler: höchstens alle
       1,8 s ein Lauf, aber bei jedem Scrollen geprüft. */
    const scheinen = () => {
      if (ruhig || !imBild) return;
      const jetzt = performance.now();
      if (jetzt - zuletzt > 1800) { zuletzt = jetzt; setLauf((n) => n + 1); }
    };
    const anstossen = () => {
      if (!imBild) return;
      if (!geplant) geplant = requestAnimationFrame(setzen);
      scheinen();
    };

    const io = new IntersectionObserver(([e]) => { imBild = e.isIntersecting; anstossen(); }, { rootMargin: "80px" });
    io.observe(box);
    window.addEventListener("scroll", anstossen, { passive: true });
    window.addEventListener("resize", anstossen, { passive: true });
    setzen();
    // Ein Lauf kurz nach dem Erscheinen, damit man den Schimmer auch ohne Scrollen sieht.
    const t = setTimeout(() => { if (!ruhig) setLauf((n) => n + 1); }, 700);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", anstossen);
      window.removeEventListener("resize", anstossen);
      if (geplant) cancelAnimationFrame(geplant);
      clearTimeout(t);
    };
  }, []);

  return (
    <span
      ref={huelle}
      className={"kb-siegel" + (klein ? " kb-siegel--klein" : "") + (rund ? " kb-siegel--kreis" : "")}
      style={{
        width: w, height: h,
        ...(animation && animation !== "none" ? { animation: `${animation} .7s var(--kurve) .5s both` } : null),
      }}
    >
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true">
        <defs>
          <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset=".5" stopColor="#fff" stopOpacity=".95" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          {/* Die Zähnung: weiße Fläche minus Löcher. Rund ist die Maske schlicht ein Kreis. */}
          <mask id={`${id}m`}>
            {rund ? (
              <circle cx={w / 2} cy={h / 2} r={w / 2} fill="#fff" />
            ) : (
              <>
                <rect width={w} height={h} fill="#fff" />
                {loecher.map((l, i) => <circle key={i} cx={l.x} cy={l.y} r={r} fill="#000" />)}
              </>
            )}
          </mask>
          {/* Die stehende Folie als Kachel — die Position setzt der Scroll-Zuhörer. */}
          <pattern
            ref={folie}
            id={`${id}f`}
            patternUnits="userSpaceOnUse"
            width={KACHEL_B} height={KACHEL_H}
          >
            {/* 🚨 KEIN Filter. Ich hatte die Folie erst nachgesättigt und dann noch einmal
                kräftiger gedreht — beides ungefragt. Das Bild des Users ist die Vorlage;
                mit `saturate` sah es wie ein Aufkleber aus, ohne wie Folie. Wer hier
                wieder an Sättigung oder Kontrast dreht, ändert sein Bild. */}
            <image
              href="/holo.jpg" x="0" y="0" width={KACHEL_B} height={KACHEL_H}
              preserveAspectRatio="xMidYMid slice"
            />
          </pattern>
        </defs>
        <g mask={`url(#${id}m)`}>
          <rect width={w} height={h} fill={`url(#${id}f)`} />
          <rect
            key={lauf}
            className="kb-siegel__schimmer"
            x="0" y="-4" width={Math.round(w * 0.42)} height={h + 8}
            fill={`url(#${id}s)`}
            style={lauf ? { animation: `kb-schimmer${lauf % 2 ? "" : "2"} 1.5s cubic-bezier(.45,0,.2,1) both` } : undefined}
          />
        </g>
        {/* Der Innenrahmen: bei der Marke ein Rechteck mit 0,55 Zähnen Einzug, beim Kreis
            der gestrichelte Ring — dieselbe Schnittlinie wie am Coupon drumherum. */}
        {rund ? (
          <circle
            cx={w / 2} cy={h / 2} r={w / 2 - ZAHN}
            fill="none" stroke="rgba(51,74,39,.5)" strokeWidth="1.5" strokeDasharray="6 5"
          />
        ) : (
          <rect
            x={innen} y={innen}
            width={+(w - 2 * innen).toFixed(1)} height={+(h - 2 * innen).toFixed(1)}
            fill="none" stroke="rgba(51,74,39,.45)" strokeWidth=".8"
          />
        )}
      </svg>
      <b className="kb-siegel__text">{text}</b>
    </span>
  );
}
