"use client";

import "@/lib/gsapConfig"; // ensures GSAP plugins are registered before tweens
import { useRef, useEffect, useLayoutEffect, useState, type CSSProperties } from "react";
import gsap from "@/lib/gsapConfig";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { isMainCategory } from "@/lib/categories";
import type { Post } from "@/lib/types";
import { startMorphNavigation, type MorphItemSource } from "@/lib/morphTransition";
import { captureTextItem, captureVisualItem, hideSourceEls, getElementScale } from "@/lib/morphCapture";
import { getFinanztoolsActiveCard, setFinanztoolsActiveCard, isBackNavigation } from "@/lib/landingState";
import ToolDots from "@/components/ui/ToolDots";

const TOOLS = [
  {
    title: "Rechner",
    description: "Profitieren Sie von unseren tagesaktuellen Rechnern. Zögern Sie nicht. Sie können noch heute anfangen zu sparen!",
    cta: "Zu unseren Rechnern",
    href: "/finanztools/rechner",
    color: "var(--color-tool-rechner)",
    icon: "/icons/iconRechner.svg",
    image: "/assets/finanztoolSlider/rechner_visual.png",
  },
  {
    title: "Vergleiche",
    description: "Vergleichen Sie Tarife, Anbieter und Konditionen. Finden Sie das beste Angebot für Ihre Bedürfnisse.",
    cta: "Zu unseren Vergleichen",
    href: "/finanztools/vergleiche",
    color: "var(--color-tool-vergleiche)",
    icon: "/icons/iconVergleich.svg",
    image: "/assets/finanztoolSlider/vergleich_visual.png",
  },
  {
    title: "Checklisten",
    description: "Unsere interaktiven Checklisten helfen Ihnen, nichts zu vergessen. Schritt für Schritt zum Ziel.",
    cta: "Zu unseren Checklisten",
    href: "/finanztools/checklisten",
    color: "var(--color-tool-checklisten)",
    icon: "/icons/iconCheckliste.svg",
    image: "/assets/finanztoolSlider/checklisten_visual.png",
  },
];

// Intro-Bild — sichtbar wenn kein Tool aktiv ist (Slide-Index 3)
const INTRO_IMAGE = "/assets/toolbox.png";

// ── Desktop-„Revolver"-Bühne: Slot-Geometrie (wie Mobile-Revolver, kein Swipe) ──
// Intro: 3 gleiche Cards in einer Reihe unten. Aktiv: 1 große Card oben + 2 kleine unten.
const ST_W = 330;          // Controls-/Bühnenbreite
const ST_BIG_H = 244;      // Höhe der großen (aktiven) Card (Inhalt + 4px Padding unter dem CTA → Outline nicht geclippt)
const ST_SMALL_H = 96;     // Höhe der kleinen Cards
const ST_HGAP = 12;        // horizontaler Abstand
const ST_GAP_ABOVE = 28;   // 28px zwischen Button und hellgrauer Trennlinie (5px mehr)
const ST_GAP_BELOW = 33;   // 33px unter der Linie zu den Buttons
const ST_SMALL_W = (ST_W - ST_HGAP) / 2;
const ST_INTRO_W = (ST_W - 2 * ST_HGAP) / 3;
const ST_DIVIDER_Y = ST_BIG_H + ST_GAP_ABOVE;   // hellgraue Trennlinie (nur aktiv)
const ST_ROW_Y = ST_DIVIDER_Y + ST_GAP_BELOW;   // kleine Card-Reihe darunter
const STAGE_H = ST_ROW_Y + ST_SMALL_H;
// Die Bühne soll 80px FRÜHER andocken (sticky-Container 80px kürzer): die Flow-Höhe wird
// um ST_SHIFT gekürzt und die gesamte Slot-/Loader-Geometrie um ST_SHIFT nach oben gezogen.
// Die große (aktive) Card ragt dadurch nach oben in den (ausgeblendeten) Beschreibungs-Bereich.
const ST_SHIFT = 100;   // 80 + 20: Slider + Controls-Spalte nochmal 20px kürzer
const STAGE_FLOW_H = STAGE_H - ST_SHIFT;   // tatsächliche Bühnen-Höhe im Flow
type Slot = { x: number; y: number; w: number; h: number };
const SLOT_BIG: Slot = { x: 0, y: -ST_SHIFT, w: ST_W, h: ST_BIG_H };
const SLOT_SMALL_L: Slot = { x: 0, y: ST_ROW_Y - ST_SHIFT, w: ST_SMALL_W, h: ST_SMALL_H };
const SLOT_SMALL_R: Slot = { x: ST_SMALL_W + ST_HGAP, y: ST_ROW_Y - ST_SHIFT, w: ST_SMALL_W, h: ST_SMALL_H };
const SLOT_INTRO: Slot[] = [0, 1, 2].map((i) => ({ x: i * (ST_INTRO_W + ST_HGAP), y: ST_ROW_Y - ST_SHIFT, w: ST_INTRO_W, h: ST_SMALL_H }));
// Zielslot einer Card i bei aktivem Index (−1 = Intro)
function toolSlot(i: number, activeIndex: number): Slot {
  if (activeIndex < 0) return SLOT_INTRO[i];
  if (i === activeIndex) return SLOT_BIG;
  const inactives = [0, 1, 2].filter((k) => k !== activeIndex);
  return inactives.indexOf(i) === 0 ? SLOT_SMALL_L : SLOT_SMALL_R;
}
// Loader-Top: Intro = über der Card-Reihe (wie anfangs); aktiv = am Kopf der großen Card.
const LOADER_TOP_INTRO = ST_ROW_Y - 36 - ST_SHIFT;
const LOADER_TOP_ACTIVE = 6 - ST_SHIFT;

// ── Mobile-Revolver (≤767): GLEICHE Technik wie Desktop (absolut positionierte Cards, auf Slots
// getweent), INVERTIERTES Layout (kleine Buttons oben, große Card unten, Progress dazwischen).
// WICHTIG: Cards sind UNTEN verankert (Slot.y = Abstand zur Stage-Unterkante). Die Stage hat eine
// KOMPAKTE Flow-Höhe (M_INTRO_H, kein Reservegap); der Expand-Inhalt ragt nach OBEN raus
// (overflow visible) und der Slider rutscht per translateY um M_VISUAL_SHIFT hoch → Grundlayout bleibt. ──
const M_SMALL_H = 50;      // Button-Höhe
const M_BIG_H = 190;       // große (aktive) Card-Höhe — knapp = Inhalt, CTA sitzt unten (+4px Outline)
const M_VGAP = 11;         // vertikaler Abstand (gestapelte Intro-Buttons)
const M_HGAP = 12;         // horizontaler Abstand (2 kleine oben)
const M_PROG_GAP = 18;     // Abstand Progress ↔ Buttons/Card
const M_INTRO_ORDER = [0, 2, 1];   // Rechner · Checklisten · Vergleiche
const M_STACK_H = 3 * M_SMALL_H + 2 * M_VGAP;                       // 172 — Höhe des Intro-Stacks
const M_INTRO_H = M_STACK_H + M_PROG_GAP + 6;                       // kompakte Flow-Höhe (Progress über dem Stack)
const M_EXPAND_H = M_BIG_H + M_PROG_GAP + 6 + M_PROG_GAP + M_SMALL_H; // visuelle Höhe expandiert
const M_VISUAL_SHIFT = M_EXPAND_H - M_INTRO_H;                      // so weit rutscht der Slider beim Expand hoch
const M_LOADER_INTRO_YB = M_STACK_H + M_PROG_GAP;                   // Progress-Abstand v. unten (Intro: über Stack)
const M_LOADER_ACTIVE_YB = M_BIG_H + M_PROG_GAP;                    // Progress-Abstand v. unten (aktiv: über Card)
// Slot.y = Abstand der Card-UNTERKANTE zur Stage-Unterkante (bottom-anchored).
function mToolSlot(i: number, activeIndex: number, MW: number, titleW: number[]): Slot {
  if (activeIndex < 0) {
    // Intro: 3 Buttons gestapelt, unten verankert, HUG-CONTENT (Pad 14 + Icon 28 + Gap 10 + Titel + Pad 12).
    const p = M_INTRO_ORDER.indexOf(i);   // 0 = oben
    const w = Math.round(64 + (titleW[i] || 60));
    return { x: 0, y: (2 - p) * (M_SMALL_H + M_VGAP), w, h: M_SMALL_H };
  }
  if (i === activeIndex) {
    // Aktiv: große Card ganz unten, volle Breite.
    return { x: 0, y: 0, w: MW, h: M_BIG_H };
  }
  // Inaktiv: kleiner Button in der Reihe OBEN (ragt über die kompakte Stage hinaus).
  const inactives = M_INTRO_ORDER.filter((k) => k !== activeIndex);
  const idx = inactives.indexOf(i);
  const smallW = Math.round((MW - M_HGAP) / 2);
  return { x: idx === 0 ? 0 : smallW + M_HGAP, y: M_EXPAND_H - M_SMALL_H, w: smallW, h: M_SMALL_H };
}

export default function FinanztoolsHero({ posts = [], latestPosts = [] }: { posts?: Post[]; latestPosts?: Post[] }) {
  const innerRowRef = useRef<HTMLDivElement>(null);
  const sliderBoxRef = useRef<HTMLDivElement>(null);
  const rightSpacerRef = useRef<HTMLDivElement>(null);
  const dotGapRef = useRef<HTMLDivElement>(null);
  const segment2Ref = useRef<HTMLDivElement>(null);
  const dotFillerRef = useRef<HTMLDivElement>(null);
  const anbieterVertRef = useRef<HTMLDivElement>(null);
  const anbieterRef = useRef<HTMLDivElement>(null);
  const [contentProgs, setContentProgs] = useState<number[]>([0, 0, 0]);
  const contentProgObjs = useRef([{ v: 0 }, { v: 0 }, { v: 0 }]);
  // Card-Layout (x/y/w/h pro Card) — getweent auf die Zielslots (Big-Top/Two-Small/Intro).
  const cardLayoutObjs = useRef<Slot[]>(SLOT_INTRO.map((s) => ({ ...s })));
  const [cardLayouts, setCardLayouts] = useState<Slot[]>(SLOT_INTRO.map((s) => ({ ...s })));
  // Loader-Position (fährt nach oben, wenn ein Tool aktiv ist).
  const loaderTopObj = useRef({ v: LOADER_TOP_INTRO });
  const [loaderTop, setLoaderTop] = useState(LOADER_TOP_INTRO);
  // ── Mobile-Revolver-State (gemessene Breite + getweente Card-Slots + Loader-Position) ──
  const [mStageW, setMStageW] = useState(0);
  const mCardLayoutObjs = useRef<Slot[]>([]);
  const [mCardLayouts, setMCardLayouts] = useState<Slot[]>([]);
  const mLoaderTopObj = useRef({ v: M_LOADER_INTRO_YB });
  const [mLoaderTop, setMLoaderTop] = useState(M_LOADER_INTRO_YB);
  // Gecachter Andock-Scroll (gemessen wenn untransformiert/nicht aktiv) — von Loader-Trigger UND
  // Autoscroll genutzt → exakt gleiche Position, auch im Expanded-Zustand (Slider translateY).
  const mUndockRef = useRef(0);
  const [titleWidths, setTitleWidths] = useState<number[]>([0, 0, 0]);
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const alleinHandRef = useRef<HTMLParagraphElement>(null);
  const desc1Ref = useRef<HTMLParagraphElement>(null);
  const desc2Ref = useRef<HTMLParagraphElement>(null);
  const stageLineRef = useRef<HTMLDivElement>(null);
  const mobileWrapRef = useRef<HTMLDivElement>(null);
  const activeCardRef = useRef<string | null>(null);
  const isScrollingToTarget = useRef(false);
  const lastPastRef = useRef(false);
  const [activeCard, setActiveCard] = useState<string | null>(
    () => (isBackNavigation() ? getFinanztoolsActiveCard() : null)
  );
  useEffect(() => { setFinanztoolsActiveCard(activeCard); }, [activeCard]);

  // Intro-Progress: füllt sich am Auto-Expand-Trigger in 3s, danach öffnet Rechner.
  const [introProgress, setIntroProgress] = useState(0);
  const introProgObj = useRef({ v: 0 });
  const introTweenRef = useRef<gsap.core.Tween | null>(null);
  // Progress-Linie: aktiv (zeichnet sich ein + füllt) sobald der Auto-Expand-Bereich
  // erreicht ist; per Play/Pause anhaltbar.
  const [loaderActive, setLoaderActive] = useState(false);
  const [loaderPaused, setLoaderPaused] = useState(false);
  const loaderPausedRef = useRef(false);
  useEffect(() => {
    loaderPausedRef.current = loaderPaused;
    const tw = introTweenRef.current;
    if (tw) { if (loaderPaused) tw.pause(); else tw.resume(); }
  }, [loaderPaused]);

  // Aktueller Slide-Index: 3 (Intro) wenn kein Tool aktiv, sonst Tool-Index.
  // Crossfade läuft rein über opacity (siehe Render), keine Richtungs-/Phasen-Logik nötig.
  const currentSlide = activeCard === null ? 3 : TOOLS.findIndex((t) => t.title === activeCard);
  const activeTool = activeCard ? TOOLS.find((t) => t.title === activeCard) : null;
  // Mobile-Card ist IMMER im DOM (für den Flip-Morph) — behält den zuletzt aktiven Inhalt,
  // damit beim Zuklappen nichts „leer" wird, während die Card rausmorpht.
  const lastCardToolRef = useRef(TOOLS[0]);
  if (activeTool) lastCardToolRef.current = activeTool;
  const cardTool = activeTool ?? lastCardToolRef.current;

  // Visual/Slider-Boxhöhe = 4:3 der Box-Breite, min 350px. Treibt --stage-h, das
  // sowohl die Stage-Boxen (height) als auch die Newsletter-min-height steuert →
  // „Die Finanztools" bleibt auf der Linie (= Visual-Unterkante). Desktop only.
  useLayoutEffect(() => {
    const row = innerRowRef.current;
    if (!row) return;
    const apply = () => {
      const w = row.clientWidth;
      if (w <= 0) return;
      const visualW = w - 330 - 72;        // Controls 330 + 2×36px Box-Margins
      const h = Math.max(0, visualW * 0.75); // exakt 4:3 der Box-Breite
      row.style.setProperty("--stage-h", `${Math.round(h)}px`);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(row);
    window.addEventListener("resize", apply);
    return () => { ro.disconnect(); window.removeEventListener("resize", apply); };
  }, []);

  // Mobile: „Alles in eigener Hand", Beschreibung 1 + Progress-Linie faden/bluren beim
  // Scrollen ein. Start sobald die Objekt-Oberkante die Button-Oberkante berührt, voll
  // sichtbar wenn die Oberkante 60% des Viewports erreicht.
  useEffect(() => {
    const wrap = mobileWrapRef.current;
    if (!wrap || !window.matchMedia("(max-width: 767px)").matches) return;
    const targets = ([".ftools-m-allein", ".ftools-m-desc"]
      .map((s) => wrap.querySelector<HTMLElement>(s)).filter(Boolean)) as HTMLElement[];
    const btns = wrap.querySelector<HTMLElement>(".ftools-m-stage");
    if (!targets.length || !btns) return;
    const apply = () => {
      const start = btns.getBoundingClientRect().top;   // Stage-/Button-Oberkante
      const end = 0.6 * window.innerHeight;             // 60% Viewport
      const range = Math.max(1, start - end);
      for (const el of targets) {
        const p = Math.min(1, Math.max(0, (start - el.getBoundingClientRect().top) / range));
        el.style.opacity = String(p);
        el.style.filter = `blur(${(10 * (1 - p)).toFixed(2)}px)`;
      }
    };
    apply();
    window.addEventListener("scroll", apply, { passive: true });
    window.addEventListener("resize", apply);
    return () => { window.removeEventListener("scroll", apply); window.removeEventListener("resize", apply); };
  }, []);

  // Mobile: Progress-Linie zeichnet sich von links nach rechts ein (scaleX) sobald sie den
  // Andock-Bereich erreicht (Buttons docken ab) — einmalige Animation, NICHT scroll-gebunden.
  // Gleichzeitig läuft der Progress-Balken automatisch los (Lead-in 5s, wie Desktop) + der
  // Pause/Play-Button (loaderActive) faded ein. Beim Re-Docken: alles zurücksetzen.
  useEffect(() => {
    const wrap = mobileWrapRef.current;
    if (!wrap || !window.matchMedia("(max-width: 767px)").matches) return;
    const track = wrap.querySelector<HTMLElement>(".ftools-m-loader-track");
    const stage = wrap.querySelector<HTMLElement>(".ftools-m-stage");
    if (!track || !stage) return;
    let drawn = false;
    const startLeadIn = () => {
      introTweenRef.current?.kill();
      introProgObj.current.v = 0;
      setIntroProgress(0);
      setLoaderActive(true);
      // Lead-in IMMER unpausiert starten (sonst füllt sich der Balken im collapsed Zustand nicht,
      // falls vorher per X/Slideshow-Ende pausiert wurde).
      setLoaderPaused(false);
      loaderPausedRef.current = false;
      introTweenRef.current = gsap.to(introProgObj.current, {
        v: 1,
        duration: 5,
        ease: "none",
        paused: false,
        onUpdate: () => setIntroProgress(introProgObj.current.v),
        // Lead-in einmal durch → erstes Tool (Rechner) expandieren, danach Auto-Advance (wie Desktop).
        onComplete: () => { introTweenRef.current = null; activateToolRef.current(0); },
      });
    };
    const cancel = () => {
      introTweenRef.current?.kill();
      introTweenRef.current = null;
      introProgObj.current.v = 0;
      setIntroProgress(0);
      setLoaderActive(false);
      if (activeCardRef.current !== null) setActiveCard(null);
    };
    const onScroll = () => {
      // Während programmatischem Scroll (Button-Klick) nicht canceln/collapsen.
      if (isScrollingToTarget.current) return;
      // Andock-Scroll EXAKT wie der Autoscroll berechnen (gleiche Slider-Referenz + Konstanten),
      // damit Loader-Einzeichnen und Autoscroll-Ziel an DERSELBEN Stelle liegen (= wo die Buttons
      // mit der Seite zu scrollen beginnen). Nur messen wenn untransformiert (nicht aktiv) → cachen.
      const slider = wrap.querySelector<HTMLElement>(".ftools-m-slider");
      if (slider && activeCardRef.current === null) {
        mUndockRef.current = slider.getBoundingClientRect().bottom + window.scrollY + 22 + M_INTRO_H - (window.innerHeight - 16);
      }
      const undocked = window.scrollY >= mUndockRef.current - 1;
      // Linie/Balken laufen über loaderActive (deklarativ via startLeadIn/cancel) — NICHT imperativ,
      // damit sie auch nach dem Autoscroll (ohne weiteres Scroll-Event) sofort sichtbar sind.
      if (undocked && !drawn) { drawn = true; startLeadIn(); }
      else if (!undocked && drawn) { drawn = false; cancel(); }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); introTweenRef.current?.kill(); };
  }, []);


  // Dot-Spalte mit ZWEI gepunkteten Segmenten um den vertikalen Schriftzug:
  //  • Segment 1 (oben): Dotline aus dem Section-Top, Sticky-Pfeil ruht GAP über „ANBIETER".
  //  • Schriftzug (liegt in der Preview-Spalte, per translateX auf die Pfeil-Achse zentriert).
  //  • Segment 2 (unten): startet GAP unter „KONTAKTE", eigener Sticky-Pfeil ruht am
  //    Ende des Anbieter-Blocks (Button-Unterkante) — exakt wie Segment 1.
  // Drei Spacer (gap/segment2/filler) bekommen ihre Höhen via JS; Differenzen von
  // getBoundingClientRect sind scroll-stabil → einmal messen + bei Reflow/Resize/Font neu.
  useLayoutEffect(() => {
    const spacer = rightSpacerRef.current;
    const gapEl = dotGapRef.current;
    const seg2 = segment2Ref.current;
    const filler = dotFillerRef.current;
    const vert = anbieterVertRef.current;
    const anbieter = anbieterRef.current;
    const section = sectionRef.current;
    if (!spacer || !gapEl || !seg2 || !filler || !vert || !anbieter) return;

    const GAP = 10;    // vertikaler Abstand Pfeilspitze ↔ Schriftzug (oben + Start Segment 2)
    const GAP_X = 0;   // horizontaler Versatz des Schriftzugs (0 = exakt auf der Pfeil-Achse)

    const measure = () => {
      // Mobile: Spalte ausgeblendet → nichts messen, Höhen platt.
      if (spacer.offsetParent === null) {
        vert.style.transform = "none";
        gapEl.style.height = "0px"; seg2.style.height = "0px"; filler.style.height = "0px";
        return;
      }

      // Horizontal: Schriftzug exakt auf die Mitte der Dot-/Pfeil-Spalte zentrieren.
      vert.style.transform = "none"; // für saubere Messung zurücksetzen
      const spacerRect = spacer.getBoundingClientRect();
      const vertRect = vert.getBoundingClientRect();
      const dx = (spacerRect.left + spacerRect.width / 2) - (vertRect.left + vertRect.width / 2) - GAP_X;
      vert.style.transform = `translateX(${dx}px)`;

      // Vertikale Messpunkte. Buchstaben überlaufen die Box → echte Ober-/Unterkante
      // = erstes/letztes Wort-Span. translateX ändert Top/Bottom nicht.
      const firstWord = (vert.firstElementChild as HTMLElement | null) ?? vert;
      const lastWord = (vert.lastElementChild as HTMLElement | null) ?? vert;
      const LT = firstWord.getBoundingClientRect().top;       // Oberkante „ANBIETER"
      const LB = lastWord.getBoundingClientRect().bottom;     // Unterkante „KONTAKTE"
      const CB = spacerRect.bottom;                            // Spalten-Unterkante
      // Segment 2 reicht bis 80px UNTER den Slider-Container (nicht mehr bis zum Anbieter-Ende).
      const sliderEl = sliderBoxRef.current;
      const sliderBottom = sliderEl ? sliderEl.getBoundingClientRect().bottom : anbieter.getBoundingClientRect().bottom;
      const seg2End = Math.min(CB, sliderBottom + 80);

      // gap: lässt Segment-1-Pfeil GAP über LT ruhen + reserviert die Schriftzughöhe + GAP unten.
      gapEl.style.height = `${Math.max(0, (LB - LT) + GAP + GAP)}px`;
      // Segment 2: von (LB + GAP) bis seg2End → eigene Dotline + Sticky-Pfeil, ruht bei seg2End.
      seg2.style.height = `${Math.max(0, seg2End - LB - GAP)}px`;
      // filler: Rest bis zur Spalten-Unterkante.
      filler.style.height = `${Math.max(0, CB - seg2End)}px`;
    };

    measure();
    const ro = new ResizeObserver(measure);
    if (section) ro.observe(section);
    ro.observe(spacer);
    ro.observe(vert);       // Schriftzug ist absolut → bei Font-/Größenänderung trotzdem neu messen
    ro.observe(anbieter);   // Anbieter-Block-Größe ändert sich → Schriftzug neu zentrieren
    window.addEventListener("resize", measure);
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(measure).catch(() => {});
    }
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, []);

  useLayoutEffect(() => {
    cardLayoutObjs.current.forEach((obj) => gsap.killTweensOf(obj));
    contentProgObjs.current.forEach((obj) => gsap.killTweensOf(obj));
    gsap.killTweensOf(loaderTopObj.current);
  }, []);

  useEffect(() => {
    const measure = () => {
      const widths = TOOLS.map((tool) => {
        const span = document.createElement("span");
        span.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font-family:var(--font-heading,'Merriweather',serif);font-size:13.5px;font-weight:600;`;
        span.textContent = tool.title;
        document.body.appendChild(span);
        const w = span.offsetWidth;
        document.body.removeChild(span);
        return w;
      });
      setTitleWidths(widths);
    };
    measure();
    document.fonts.ready.then(measure);
  }, []);

  // Scroll-Reveal: „Alles in eigener Hand" + die beiden Beschreibungen starten bei opacity 0
  // und faden beim Reinscrollen ein. Pro Textfeld: Beginn wenn die Oberkante 80px von unten
  // reingescrollt ist (top = vh−80 → opacity 0), voll da bei Viewport-Mitte (top = vh/2 → 1).
  // Opacity wird direkt am DOM gesetzt (kein React-Inline-Opacity → kein Konflikt/Re-Render).
  useEffect(() => {
    const apply = () => {
      const els = [alleinHandRef.current, desc1Ref.current, desc2Ref.current].filter(Boolean) as HTMLElement[];
      if (!els.length) return;
      const vh = window.innerHeight;
      const start = vh - 120;           // Oberkante hier → opacity 0
      const end = start - 100;         // 100px weiter hochgescrollt → opacity 1
      const range = Math.max(1, start - end);
      for (const el of els) {
        const top = el.getBoundingClientRect().top;
        const p = Math.min(1, Math.max(0, (start - top) / range)); // 0 → 1
        el.style.opacity = String(p);
        el.style.filter = `blur(${(10 * (1 - p)).toFixed(2)}px)`;   // 10px → 0px Blur
      }

      // Horizontale Linie unter dem Visual wächst von rechts nach links: 50% Breite wenn die
      // Oberkante unten reinkommt (top = vh), volle Länge bei 40% Viewport von unten (top = 0.6·vh).
      const line = stageLineRef.current;
      if (line) {
        const top = line.getBoundingClientRect().top;
        const lp = Math.min(1, Math.max(0, (vh - top) / (0.4 * vh)));
        line.style.transform = `scaleX(${(0.5 + 0.5 * lp).toFixed(4)})`;
      }
    };
    apply();
    window.addEventListener("scroll", apply, { passive: true });
    window.addEventListener("resize", apply);
    return () => {
      window.removeEventListener("scroll", apply);
      window.removeEventListener("resize", apply);
    };
  }, []);

  // Sync activeCard → ref (readable inside scroll listeners without closure stale-value issues)
  useEffect(() => { activeCardRef.current = activeCard; }, [activeCard]);

  // Aktiviert Tool i: setzt activeCard, Timer auf 0, 5s-Progress; danach Auto-Advance zum
  // nächsten Tool (Loop). Über Ref, damit der onComplete-Callback nicht stale ist.
  const activateToolRef = useRef<(i: number) => void>(() => {});
  activateToolRef.current = (index: number) => {
    const i = ((index % 3) + 3) % 3;
    setActiveCard(TOOLS[i].title);
    introTweenRef.current?.kill();
    introProgObj.current.v = 0;
    setIntroProgress(0);
    setLoaderActive(true);
    introTweenRef.current = gsap.to(introProgObj.current, {
      v: 1,
      duration: 5,
      ease: "none",
      paused: loaderPausedRef.current,
      onUpdate: () => setIntroProgress(introProgObj.current.v),
      onComplete: () => {
        introTweenRef.current = null;
        // Slideshow läuft genau EINMAL durch (… → Checklisten), danach collapsen + pausieren (kein Loop).
        if (i === TOOLS.length - 1) collapseAndPauseRef.current();
        else activateToolRef.current(i + 1);
      },
    });
  };

  // Collapse zu Intro + Balken über den Buttons sichtbar lassen + pausieren (X-Schließen & Ende der Slideshow).
  const collapseAndPauseRef = useRef<() => void>(() => {});
  collapseAndPauseRef.current = () => {
    introTweenRef.current?.kill();
    introTweenRef.current = null;
    introProgObj.current.v = 0;
    setIntroProgress(0);
    setLoaderActive(true);   // Balken bleibt über den Buttons sichtbar …
    setLoaderPaused(true);   // … pausiert; Play startet die Slideshow neu
    loaderPausedRef.current = true;
    setActiveCard(null);     // Intro-Layout
    lastPastRef.current = true; // verhindert sofortiges Re-Triggern
  };

  // Klick auf einen Button: erst an die richtige Stelle scrollen (Slider voll sichtbar),
  // DANN das Tool aufklappen (wie früher). Ist der Slider schon (fast) ganz sichtbar →
  // direkt aufklappen.
  const cardClickRef = useRef<(i: number) => void>(() => {});
  cardClickRef.current = (i: number) => {
    const slider = sliderBoxRef.current;
    if (!slider) { activateToolRef.current(i); return; }
    const r = slider.getBoundingClientRect();
    const vh = window.innerHeight;
    // Schon (fast) am Andock-Punkt (Slider-Unterkante an der Linie vh−23)? → direkt aufklappen.
    if (Math.abs(r.bottom - (vh - 23)) <= 16) {
      activateToolRef.current(i);
      return;
    }
    // Sonst exakt zum Andock-Punkt scrollen (wo die Buttons mit dem Flow zu scrollen beginnen).
    isScrollingToTarget.current = true;
    const targetY = window.scrollY + r.bottom - (vh - 23);
    gsap.to(window, {
      scrollTo: { y: targetY, autoKill: false },
      duration: 0.6,
      ease: "power2.inOut",
      onComplete: () => {
        isScrollingToTarget.current = false;
        activateToolRef.current(i);
      },
    });
  };

  // Mobile-Pendant: erst zum Finanztool-Bereich scrollen — exakt an die Stelle, an der die Buttons
  // abdocken (natürliche Stage-Unterkante = vh−16) — DANN das Tool aufklappen + Timeline starten.
  // Die Stage ist sticky → ihre gerenderte Unterkante ist immer vh−16; deshalb die NATÜRLICHE
  // Flow-Position via offsetTop/offsetHeight rechnen (sticky-unabhängig).
  const mobileCardClickRef = useRef<(i: number) => void>(() => {});
  mobileCardClickRef.current = (i: number) => {
    // Gecachter Andock-Scroll (vom Loader-Trigger gemessen, untransformiert) → EXAKT die gleiche
    // Position wie das Loader-Einzeichnen, und korrekt auch im Expanded-Zustand (Slider translateY).
    const targetY = Math.round(mUndockRef.current);
    // Noch nicht gemessen ODER schon (fast) am Andock-Punkt? → direkt aufklappen (kein Scroll).
    if (!targetY || Math.abs(window.scrollY - targetY) <= 8) { activateToolRef.current(i); return; }
    isScrollingToTarget.current = true;
    gsap.to(window, {
      scrollTo: { y: targetY, autoKill: false },
      duration: 0.6,
      ease: "power2.inOut",
      onComplete: () => {
        isScrollingToTarget.current = false;
        activateToolRef.current(i);
      },
    });
  };

  // Lead-in: Balken läuft einmal durch (5s, kein Tool) → danach öffnet Rechner + Auto-Advance.
  // Wird vom Scroll-Trigger UND vom Play-Button (nach X-Collapse) genutzt.
  const startLeadInRef = useRef<() => void>(() => {});
  startLeadInRef.current = () => {
    introTweenRef.current?.kill();
    setLoaderActive(true);
    setLoaderPaused(false);
    loaderPausedRef.current = false;
    introProgObj.current.v = 0;
    setIntroProgress(0);
    introTweenRef.current = gsap.to(introProgObj.current, {
      v: 1,
      duration: 5,
      ease: "none",
      paused: false,
      onUpdate: () => setIntroProgress(introProgObj.current.v),
      onComplete: () => {
        introTweenRef.current = null;
        activateToolRef.current(0);
      },
    });
  };

  // Auto-Advance startet, sobald 2/3 des Sliders sichtbar sind; collapse beim Hochscrollen.
  useEffect(() => {
    const cancelFill = () => {
      if (introTweenRef.current) {
        introTweenRef.current.kill();
        introTweenRef.current = null;
      }
      introProgObj.current.v = 0;
      setIntroProgress(0);
      setLoaderActive(false);
      setLoaderPaused(false);
      loaderPausedRef.current = false;
    };
    const onScroll = () => {
      // Mobile hat einen eigenen Lead-in (Desktop-Slider ist hidden → würde sonst dauernd cancelFill feuern).
      if (window.matchMedia("(max-width: 767px)").matches) return;
      // Skip while GSAP is programmatically scrolling to avoid premature collapse mid-animation
      if (isScrollingToTarget.current) return;
      const slider = sliderBoxRef.current;
      if (!slider) return;
      // Trigger GENAU dort, wo die 3 Buttons anfangen mit dem Flow zu scrollen: Der Slider
      // schließt unten bündig mit den Buttons ab; sie docken (sticky bottom:23) ab, sobald
      // ihre Unterkante die Linie vh−23 erreicht. Davor sind sie gepinnt.
      const r = slider.getBoundingClientRect();
      const vh = window.innerHeight;
      const triggered = r.bottom > 0 && r.bottom <= vh - 23;

      // Noch nicht (genug) sichtbar: laufende Füllung abbrechen + offene Karte schließen
      if (!triggered) {
        cancelFill();
        if (activeCardRef.current !== null) setActiveCard(null);
        lastPastRef.current = false;
        return;
      }

      // Flanke: Lead-in starten — der erste Balken läuft einmal durch (kein Tool),
      // danach expandiert die erste Card (Rechner) und der Auto-Advance läuft weiter.
      if (triggered !== lastPastRef.current) {
        lastPastRef.current = triggered;
        if (activeCardRef.current === null && !introTweenRef.current) {
          setLoaderActive(true);
          introProgObj.current.v = 0;
          setIntroProgress(0);
          introTweenRef.current = gsap.to(introProgObj.current, {
            v: 1,
            duration: 5,
            ease: "none",
            paused: loaderPausedRef.current,
            onUpdate: () => setIntroProgress(introProgObj.current.v),
            onComplete: () => {
              introTweenRef.current = null;
              activateToolRef.current(0);
            },
          });
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      introTweenRef.current?.kill();
    };
  }, []);

  // Card-Layout-Morph (Big-Top/Two-Small/Intro) + Content-Fade + Loader-Position.
  // Manuelle Interpolation via GSAP-Tweens auf die Zielslots, bestehende Eases.
  useEffect(() => {
    const activeIndex = activeCard ? TOOLS.findIndex((t) => t.title === activeCard) : -1;
    const pushLayout = () => setCardLayouts(cardLayoutObjs.current.map((o) => ({ ...o })));
    TOOLS.forEach((tool, i) => {
      const isActive = i === activeIndex;
      const slot = toolSlot(i, activeIndex);
      gsap.to(cardLayoutObjs.current[i], {
        x: slot.x, y: slot.y, w: slot.w, h: slot.h,
        duration: 0.65,
        ease: "power3.inOut",
        overwrite: true,
        onUpdate: pushLayout,
      });
      gsap.to(contentProgObjs.current[i], {
        v: isActive ? 1 : 0,
        duration: 0.65,
        ease: isActive ? "power2.out" : "power2.inOut",
        overwrite: true,
        onUpdate: () => setContentProgs([
          contentProgObjs.current[0].v,
          contentProgObjs.current[1].v,
          contentProgObjs.current[2].v,
        ]),
      });
    });
  }, [activeCard]);

  // Loader: Intro/Lead-in = über den 3 Buttons; slided erst beim Öffnen einer Card nach oben.
  useEffect(() => {
    gsap.to(loaderTopObj.current, {
      v: activeCard ? LOADER_TOP_ACTIVE : LOADER_TOP_INTRO,
      duration: 0.6,
      ease: "power2.inOut",
      overwrite: true,
      onUpdate: () => setLoaderTop(loaderTopObj.current.v),
    });
  }, [activeCard]);

  // Mobile: Stage-Breite messen (fluid) → treibt die Card-Slot-Geometrie.
  useEffect(() => {
    const wrap = mobileWrapRef.current;
    if (!wrap) return;
    const apply = () => {
      if (!window.matchMedia("(max-width: 767px)").matches) return;
      const stage = wrap.querySelector<HTMLElement>(".ftools-m-stage");
      if (stage && stage.clientWidth > 0) setMStageW(stage.clientWidth);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(wrap);
    window.addEventListener("resize", apply);
    return () => { ro.disconnect(); window.removeEventListener("resize", apply); };
  }, []);

  // Mobile-Revolver-Morph: Card-Slots + Loader-Position auf die Zielwerte tweenen (wie Desktop).
  useEffect(() => {
    if (mStageW <= 0) return;
    const activeIndex = activeCard ? TOOLS.findIndex((t) => t.title === activeCard) : -1;
    // Erstinitialisierung (oder nach Breitenänderung ohne bestehende Objs): direkt setzen.
    if (mCardLayoutObjs.current.length === 0) {
      mCardLayoutObjs.current = TOOLS.map((_, i) => ({ ...mToolSlot(i, activeIndex, mStageW, titleWidths) }));
      setMCardLayouts(mCardLayoutObjs.current.map((o) => ({ ...o })));
    }
    const push = () => setMCardLayouts(mCardLayoutObjs.current.map((o) => ({ ...o })));
    TOOLS.forEach((_, i) => {
      const slot = mToolSlot(i, activeIndex, mStageW, titleWidths);
      gsap.to(mCardLayoutObjs.current[i], {
        x: slot.x, y: slot.y, w: slot.w, h: slot.h,
        duration: 0.6, ease: "power3.inOut", overwrite: true, onUpdate: push,
      });
    });
    gsap.to(mLoaderTopObj.current, {
      v: activeCard ? M_LOADER_ACTIVE_YB : M_LOADER_INTRO_YB,
      duration: 0.6, ease: "power2.inOut", overwrite: true,
      onUpdate: () => setMLoaderTop(mLoaderTopObj.current.v),
    });
  }, [activeCard, mStageW, titleWidths]);

  return (
    <section ref={sectionRef} style={{ width: "100%", marginBottom: 100 }}>
      <div className="ftools-row" style={{ display: "flex", maxWidth: 1600, margin: "0 auto", padding: "0 clamp(20px, 4vw, 60px)" }}>
        {/* Left: finanztools_container — CONTROLS (links 300px) + STAGE (Visual+Slider) */}
        <div className="ftools-left-col">
         <div ref={innerRowRef} className="ftools-inner-row">

          {/* ===== CONTROLS (links, 300px) ===== */}
          <div className="ftools-controls">

            {/* Newsletter — oben */}
            <div className="ftools-newsletter-box" style={{ display: "flex", flexDirection: "column", gap: 9, alignItems: "flex-end" }}>
                <p style={{ fontFamily: "var(--font-heading, 'Merriweather', serif)", fontWeight: 700, fontSize: 19, lineHeight: 1.38, color: "var(--color-text-primary)", textAlign: "right", marginTop: 56 }}>
                  Newsletter
                </p>
                <p
                  lang="de"
                  style={{
                    fontFamily: "var(--font-heading, 'Merriweather', serif)",
                    fontWeight: 650,
                    fontSize: 16,
                    lineHeight: 1.3,
                    color: "var(--color-text-primary)",
                    textAlign: "right",
                    hyphens: "auto",
                    WebkitHyphens: "auto",
                    wordBreak: "break-word",
                  }}
                >
                  Bleiben Sie mit unserem Finanzleser.de<br />Newsletter immer auf dem neusten Stand!
                </p>
                <div style={{ display: "flex", justifyContent: "flex-end", width: "100%",  marginTop: 12 }}>
                  <Button onClick={() => {}} label="Jetzt abonnieren" />
                </div>

                {/* Horizontale Linie */}
                <div style={{ width: "100%", height: 1, background: "rgba(0, 0, 0, 0.07)", marginTop: 30 }} />
            </div>

            {/* „Die Finanztools" — sitzt auf der durchgehenden Linie, sticky, mit Blende.
                Die Linie hier (Controls-Teil) + die Stage-Linie liegen beide sticky
                bottom:140 → fluchten zu einer durchgehenden Linie. Blende (#faf9f6,
                niedriger z-index) überdeckt die Linie hinter dem Text → smooth-cut. */}
            <div className="ftools-finanztools">
              <span data-finanztools-heading className="ftools-subheading-text" style={{ fontFamily: "var(--font-heading, 'Merriweather', serif)", fontWeight: 700, fontSize: 19, lineHeight: 1.38, color: "var(--color-text-primary)" }}>
                Die Finanztools
              </span>
            </div>

            {/* „Alles in eigener Hand" — unter der Linie */}
            <p ref={alleinHandRef} className="ftools-allein" style={{ fontFamily: "var(--font-heading, 'Merriweather', serif)", fontWeight: 900, fontSize: 40, lineHeight: 1.3, color: "var(--color-text-primary)", margin: "5px 0 0" }}>
              Alles in eigener Hand
            </p>

            {/* Beschreibung (Intro) — im Flow, NICHT sticky; äußerer Wrapper = Scroll-Reveal-Opacity
                (per JS), innerer = Ausblenden sobald ein Tool aktiv ist. */}
            <div className="ftools-intro-descs" style={{ opacity: activeCard ? 0 : 1, transition: "opacity 0.4s ease", pointerEvents: activeCard ? "none" : "auto" }}>
              {/* Jeder Absatz hat seinen eigenen Scroll-Reveal (eigener Ref → eigener Bereich). */}
              <p ref={desc1Ref} className="ftools-allein-desc">
                Behalten Sie die Kontrolle über Ihre<br />Finanzen und Versicherungen.
              </p>
              <p ref={desc2Ref} className="ftools-allein-desc ftools-allein-desc-2">
                Von Brutto-Netto-Rechner bis zum komplexen Versicherungsvergleich. Wir haben das passende Tool für Sie
              </p>
            </div>

            {/* ── Tool-Bühne (sticky am unteren Rand): Intro (3 Cards) ↔ Aktiv (große Card oben
                  + Trennlinie + 2 kleine unten). Kein Swipe; Auto-Advance + Klick. ── */}
            <div className="ftools-tool-stage" style={{ position: "sticky", bottom: 23, marginTop: "auto", width: ST_W, height: STAGE_FLOW_H, overflow: "visible" }}>

              {/* Loader (fährt nach oben bei aktiv) + Play/Pause + Lesezeichen in Tool-Farbe */}
              <div className="ftools-loader-wrap" style={{ position: "absolute", left: 0, top: loaderTop, opacity: loaderActive ? 1 : 0, transition: "opacity 0.3s ease", zIndex: 6 }}>
                <button type="button" className="ftools-loader-toggle" style={{ opacity: loaderActive ? 1 : 0, pointerEvents: loaderActive ? "auto" : "none" }} onClick={() => {
                  // Play aus dem X-Collapse-Zustand (keine Card, kein Tween) → Slideshow neu starten
                  if (loaderPaused && activeCardRef.current === null && !introTweenRef.current) {
                    startLeadInRef.current();
                  } else {
                    setLoaderPaused((p) => !p);
                  }
                }} aria-label={loaderPaused ? "Abspielen" : "Pause"}>
                  {loaderPaused ? (
                    <svg width="11" height="13" viewBox="0 0 11 13" aria-hidden><path d="M0 0v13l11-6.5z" fill="currentColor" /></svg>
                  ) : (
                    <svg width="10" height="13" viewBox="0 0 10 13" aria-hidden><rect width="3.2" height="13" fill="currentColor" /><rect x="6.8" width="3.2" height="13" fill="currentColor" /></svg>
                  )}
                </button>
                <div className="ftools-loader" style={{ transform: `scaleX(${loaderActive ? 1 : 0})` }} />
                <div className="ftools-loader-fill" style={{ width: `${introProgress * 100}%` }} />
                <div className="ftools-loader-bookmark" style={{ opacity: activeTool ? 1 : 0 }} aria-hidden>
                  <div style={{ width: 28, height: 9, background: activeTool?.color ?? "transparent" }} />
                  <svg width="28" height="23" viewBox="0 0 28 23" fill="none" style={{ display: "block", marginTop: -1 }}>
                    <path d="M13.9991 8.58256L28 22.5817V6.8343e-07L0 1.90735e-06L0 22.5817L13.9991 8.58256Z" fill={activeTool?.color ?? "transparent"} />
                  </svg>
                </div>
              </div>

              {/* Hellgraue Trennlinie zwischen aktiver Box und den 2 kleinen Buttons (nur aktiv) */}
              <div style={{ position: "absolute", left: 0, top: ST_DIVIDER_Y - ST_SHIFT, width: ST_W, height: 1, background: "rgba(0,0,0,0.10)", opacity: activeCard ? 1 : 0, transition: "opacity 0.3s ease" }} aria-hidden />

              {/* Desktop-Cards (absolut, morphen zwischen Intro-Reihe ↔ Big-Top/Two-Small) */}
              <div className="ftools-cards-desktop">
                {TOOLS.map((tool, i) => {
                  const L = cardLayouts[i];
                  const cp = contentProgs[i];
                  const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
                  const ss = (v: number) => v * v * (3 - 2 * v);
                  const cw = Math.max(0, L.w - 48);
                  const tX = ss(clamp01(cp / 0.6));
                  const tY = ss(clamp01((cp - 0.4) / 0.6));
                  const iconLeft = (1 - tX) * (cw / 2 - 17);
                  const titleW = titleWidths[i] || 60;
                  const titleTX = ((L.w - 48) / 2 - titleW / 2) * (1 - tX) + 44 * tX;
                  return (
                    <div
                      key={tool.title}
                      onClick={() => cardClickRef.current(i)}
                      className="ftools-tcard"
                      style={{
                        position: "absolute", left: 0, top: 0,
                        transform: `translate3d(${L.x}px, ${L.y}px, 0)`,
                        width: L.w, height: L.h,
                        borderRadius: 30,
                        background: `rgba(255, 255, 255, ${0.8 * (1 - cp)})`,
                        // backdrop-filter clippt absolute Kinder an die Border-Box → im aktiven
                        // Zustand auf "none", damit der Inhalt nicht beschnitten wird.
                        backdropFilter: cp > 0.5 ? "none" : `brightness(${1 + 0.3 * (1 - cp)}) blur(${13 * (1 - cp)}px)`,
                        WebkitBackdropFilter: cp > 0.5 ? "none" : `brightness(${1 + 0.3 * (1 - cp)}) blur(${13 * (1 - cp)}px)`,
                        boxShadow: `0 3px 23px rgba(0, 0, 0, ${0.02 * (1 - cp)})`,
                        zIndex: cp > 0.5 ? 5 : 4,
                      }}
                    >
                      {tool.icon && (
                        <img src={tool.icon} alt="" aria-hidden style={{ position: "absolute", left: 24 + iconLeft, top: 22 + 30 * cp, width: 34, height: 34, objectFit: "contain" }} />
                      )}
                      <p style={{
                        position: "absolute", left: 24, top: 0, margin: 0,
                        paddingTop: 56 * (1 - tY) + 60 * tY,
                        fontFamily: "var(--font-heading, 'Merriweather', serif)",
                        fontWeight: 600, fontSize: 13.5 + 10.5 * cp, lineHeight: "34px",
                        color: "var(--color-text-primary)", whiteSpace: "nowrap",
                        transform: `translateX(${titleTX}px)`,
                      }}>
                        {tool.title}
                      </p>
                      <div style={{ position: "absolute", left: 24, top: 100, width: ST_W - 48, opacity: cp, pointerEvents: cp > 0.5 ? "auto" : "none" }}>
                        <p style={{ fontFamily: "var(--font-body, 'Open Sans', sans-serif)", fontWeight: 400, fontSize: 16, lineHeight: 1.4, color: "var(--color-text-medium)", margin: 0, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {tool.description}
                        </p>
                        <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 23 }}>
                          <Button label={tool.cta} href={tool.href} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Schließen-X auf Höhe der Card-Überschrift — schließt die Card → Intro (3 Buttons) */}
              <button
                type="button"
                className="ftools-tool-close"
                style={{ opacity: activeCard ? 1 : 0, pointerEvents: activeCard ? "auto" : "none" }}
                onClick={() => collapseAndPauseRef.current()}
                aria-label="Schließen"
              >
                <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden>
                  <circle cx="17" cy="17" r="16" stroke="var(--color-text-primary)" strokeWidth="1.3" />
                  <path d="M11.5 11.5l11 11M22.5 11.5l-11 11" stroke="var(--color-text-primary)" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              </button>

              {/* Mobile: 3 Tool-Buttons vertikal gestapelt (sticky unten links).
                  Klick aktiviert das Tool (Slider-Crossfade wie Desktop).
                  Reihenfolge wie im Screenshot: Rechner · Checklisten · Vergleiche. */}
              <div className="ftools-cards-mobile">
                {[0, 2, 1].map((origIdx) => {
                  const tool = TOOLS[origIdx];
                  return (
                    <button key={tool.title} type="button" className="ftools-mbtn" onClick={() => cardClickRef.current(origIdx)}>
                      {tool.icon && <img src={tool.icon} alt="" aria-hidden />}
                      <span>{tool.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>{/* ftools-tool-stage */}
          </div>{/* ftools-controls */}

          {/* ===== STAGE (Mitte: Visual oben · Linie · Slider unten, gleich groß) ===== */}
          <div className="ftools-stage">
            {/* Visual-Box */}
            <div className="ftools-stage-box">
              <img src="/assets/visuals/mainVisualLanding.png" alt="" aria-hidden className="ftools-stage-img" />
            </div>
            {/* Durchgehende Linie zwischen Visual & Slider — NICHT sticky, reicht über
                die komplette Breite inkl. der 330px-Controls (negativer margin-left). */}
            <div ref={stageLineRef} className="ftools-stage-line" />
            {/* Slider-Box (gleich groß) — Toolbox + 3 Tool-Bilder Crossfade, button-getrieben */}
            <div ref={sliderBoxRef} className="ftools-stage-box ftools-lottie-slider" style={{ position: "relative" }}>
              <img
                src={INTRO_IMAGE}
                alt=""
                aria-hidden
                className="ftools-stage-img"
                style={{ opacity: currentSlide === 3 ? 1 : 0, transition: "opacity 0.5s ease" }}
              />
              {TOOLS.map((tool, i) => (
                <img
                  key={i}
                  src={tool.image}
                  alt=""
                  aria-hidden
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    opacity: i === currentSlide ? 1 : 0,
                    transition: "opacity 0.5s ease",
                    pointerEvents: "none",
                  }}
                />
              ))}
            </div>
          </div>

         </div>{/* ftools-inner-row */}
         {/* 80px Puffer unter dem Slider → Section wird 80px höher, damit die rechte Dotline
             80px unter den Slider-Container reichen kann (Slider/Buttons/Trigger bleiben oben). */}
         <div style={{ height: 80, flexShrink: 0 }} aria-hidden />
        </div>{/* ftools-left-col */}

        {/* Right: preview_container */}
        {/* Vertical dot spacer */}
        <div ref={rightSpacerRef} className="ftools-right-spacer" style={{ width: 14, flexShrink: 0, alignSelf: "stretch", display: "flex", flexDirection: "column" }}>
          {/* Kleiner Pfeil in Dot-Farbe oben über der gepunkteten Linie */}
          <div style={{ marginTop: 72, display: "flex", justifyContent: "center" }}>
            <svg width="9" height="6" viewBox="0 0 12 8" fill="none" aria-hidden style={{ transform: "rotate(180deg)" }}>
              <polyline points="1 7 6 1.5 11 7" stroke="#686c6a" strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {/* Dots */}
          <div style={{
            flex: 1,
            marginTop: 4,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='3' height='9'%3E%3Ccircle cx='1.5' cy='1.5' r='1.5' fill='%23686c6a' opacity='0.7'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat-y",
            backgroundPosition: "center top",
            backgroundSize: "3px 9px",
          }} />
          {/* Fade mask — fixed to viewport bottom */}
          <div style={{
            position: "sticky",
            bottom: 0,
            height: "33px",
            marginTop: "-33px",
            marginBottom: "-33px",
            background: "var(--color-bg-page)",
            pointerEvents: "none",
            zIndex: 2,
          }} />
          {/* Pfeil Segment 1 — ruht GAP über „ANBIETER" */}
          <div style={{ position: "sticky", bottom: 23, display: "flex", justifyContent: "center", zIndex: 3 }}>
            <img src="/icons/arrow down.svg" alt="" style={{ width: 12, height: "auto" }} />
          </div>
          {/* Gap-Block — reserviert die Höhe des (in der Preview-Spalte liegenden)
              Schriftzugs zwischen Segment 1 und Segment 2. Höhe via JS. */}
          <div ref={dotGapRef} style={{ flexShrink: 0, height: 0 }} aria-hidden />
          {/* Segment 2 — exakt wie Segment 1 (kleiner Pfeil, Dotline, Fade, Sticky-Pfeil).
              Startet unter „KONTAKTE", endet am Anbieter-Block-Ende. Höhe via JS. */}
          <div ref={segment2Ref} style={{ flexShrink: 0, height: 0, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <svg width="9" height="6" viewBox="0 0 12 8" fill="none" aria-hidden style={{ transform: "rotate(180deg)" }}>
                <polyline points="1 7 6 1.5 11 7" stroke="#686c6a" strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{
              flex: 1,
              marginTop: 4,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='3' height='9'%3E%3Ccircle cx='1.5' cy='1.5' r='1.5' fill='%23686c6a' opacity='0.7'/%3E%3C/svg%3E")`,
              backgroundRepeat: "repeat-y",
              backgroundPosition: "center top",
              backgroundSize: "3px 9px",
            }} />
            <div style={{
              position: "sticky", bottom: 0, height: "33px", marginTop: "-33px", marginBottom: "-33px",
              background: "var(--color-bg-page)", pointerEvents: "none", zIndex: 2,
            }} />
            <div style={{ position: "sticky", bottom: 23, display: "flex", justifyContent: "center", zIndex: 3 }}>
              <img src="/icons/arrow down.svg" alt="" style={{ width: 12, height: "auto" }} />
            </div>
          </div>
          {/* Filler — Rest bis zur Spalten-Unterkante (hält Segment 2 am Anbieter-Ende). */}
          <div ref={dotFillerRef} style={{ flexShrink: 0, height: 0 }} aria-hidden />
        </div>

        {/* Right: preview_container */}
        <div className="ftools-right-preview" style={{ width: 300, flexShrink: 0, alignSelf: "stretch", display: "block" }}>
          {/* Fixbreiter, rechtsbündiger Inner-Container → Text bleibt fix beim Expanden */}
          <div className="ftools-preview-inner" style={{ paddingTop: 56, paddingLeft: 23, paddingBottom: 16 }}>
          <p className="ftools-preview-heading" style={{
            fontFamily: "'Merriweather', serif",
            fontSize: "19px",
            fontWeight: 700,
            lineHeight: 1.3,
            color: "var(--color-text-primary)",
            margin: "0 0 20px 0",
          }}>
            Neuste Beiträge
          </p>

          <div className="ftools-preview-list" style={{ display: "flex", flexDirection: "column", gap: 17, paddingTop: 3 }}>
            {(latestPosts.length > 0 ? latestPosts : posts).slice(0, 3).map((post, i) => {
              const mainCategory = post.categories?.nodes?.find((cat) => isMainCategory(cat.slug));
              const category = post.categories?.nodes?.find((cat) => !isMainCategory(cat.slug)) || post.categories?.nodes?.[0];
              const postLink = `/${mainCategory?.slug || "beitraege"}/${category?.slug || "allgemein"}/${post.slug}`;

              return (
                <div
                  key={post.id}
                  className="latest-post-item"
                  data-morph-card={post.slug}
                  style={{ display: "flex", alignItems: "center", cursor: "pointer", ["--i" as string]: i } as CSSProperties}
                  onMouseEnter={() => { try { router.prefetch(postLink); } catch { /* noop */ } }}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("a")) return; // „Ratgeber lesen" navigiert selbst
                    const item = e.currentTarget as HTMLElement;
                    const scale = getElementScale(item);
                    const thumbEl = item.querySelector<HTMLElement>(".latest-post-thumb");
                    const boldEl = item.querySelector<HTMLElement>(".latest-post-title");
                    const italicEl = item.querySelector<HTMLElement>(".latest-post-category");
                    const items: MorphItemSource[] = [];
                    // Vorschaubild → article-visual (nur wenn Thumbnail vorhanden/aufgeklappt).
                    const visual = captureVisualItem(thumbEl, post.featuredImage?.node.sourceUrl);
                    if (visual) items.push(visual);
                    // Untertitel (fett) → article-subtitle; post.title (Kategorie-Zeile) → article-title (pink).
                    const bold = captureTextItem(boldEl, "bold", scale);
                    if (bold) items.push(bold);
                    const italic = captureTextItem(italicEl, "italic", scale);
                    if (italic) items.push(italic);
                    hideSourceEls(thumbEl, boldEl, italicEl);
                    startMorphNavigation({ href: postLink, items }, (h) => router.push(h));
                  }}
                >
                  {post.featuredImage?.node.sourceUrl && (
                    <div className="latest-post-thumb" data-morph-role="visual">
                      <img src={post.featuredImage.node.sourceUrl} alt={post.featuredImage.node.altText || ""} loading="lazy" />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="latest-post-category" data-morph-role="italic" style={{
                      fontSize: 12,
                      fontFamily: "var(--font-body)",
                      marginBottom: 4,
                      lineHeight: 1.3,
                      color: "var(--color-text-secondary)",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      flexWrap: "wrap",
                    }}>
                      <span>{post.title}</span>
                      <ToolDots tools={post.tools} size={8} style={{ marginLeft: 0 }} />
                    </p>
                    {post.beitragFelder?.beitragUntertitel && (
                      <p className="latest-post-title" data-morph-role="bold" style={{
                        fontSize: 16,
                        fontFamily: "var(--font-heading, 'Merriweather', serif)",
                        fontWeight: 700,
                        margin: "0 0 8px 0",
                        lineHeight: 1.35,
                        hyphens: "auto",
                        WebkitHyphens: "auto",
                        wordBreak: "break-word",
                      }} lang="de">
                        {post.beitragFelder.beitragUntertitel}
                      </p>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Link
                        href={postLink}
                        className="article-read-link"
                        style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "13px",
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                        }}>
                          Ratgeber lesen
                        </span>
                        <span
                          className="article-read-line"
                          style={{ height: 0, borderTop: "1px solid currentColor", flexShrink: 0 }}
                        />
                        <svg
                          width="8"
                          height="8"
                          viewBox="0 0 17.45 15.77"
                          fill="none"
                          aria-hidden
                          style={{ flexShrink: 0, transform: "rotate(180deg)", marginLeft: "-12px" }}
                        >
                          <polyline
                            points="16.95 15.27 8.27 8.11 16.95 .5"
                            stroke="currentColor"
                            strokeWidth="1"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                            vectorEffect="non-scaling-stroke"
                          />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA: Ratgeber durchsuchen — wie der Anbieter-Button (hugt Inhalt, Pfeil nach unten) */}
          <div style={{ marginTop: 24, display: "flex" }}>
            <Button label="Alle Ratgeber" href="/suche" icon="arrow-down" />
          </div>

          {/* hellgraue Trennlinie nach „Ratgeber durchsuchen" */}
          <div style={{ height: 1, background: "rgba(0, 0, 0, 0.10)", marginTop: 40 }} aria-hidden />

          {/* Anbieter-Kontakte-Block — unter den neuesten Beiträgen */}
          <div ref={anbieterRef} className="ftools-anbieter" style={{ marginTop: 44 }}>
            {/* Vertikaler Schriftzug — Buchstaben staggern beim Hover-Expand von links ein */}
            <div ref={anbieterVertRef} className="ftools-anbieter-vert" aria-hidden="true">
              <span className="ftools-anbieter-vert-word">
                {"ANBIETER".split("").map((ch, i) => (
                  <span key={i}>{ch}</span>
                ))}
              </span>
              <span className="ftools-anbieter-vert-word">
                {"KONTAKTE".split("").map((ch, i) => (
                  <span key={i}>{ch}</span>
                ))}
              </span>
            </div>
            <div className="ftools-anbieter-main">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/kontaktAnbieter.png" alt="" className="ftools-anbieter-img" loading="lazy" />
              <p className="ftools-anbieter-text">
                Wir haben die aktuellen Kontakte von über 100 deutschen Topversicherungen und Finanzanbietern für Sie aufgelistet.
              </p>
              <Button label="Anbieter" href="/anbieter" />
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* ===== MOBILE-Layout (≤767) — eigener Aufbau; Desktop-Row darüber wird ≤767 ausgeblendet ===== */}
      <div className="ftools-mobile" ref={mobileWrapRef}>
        {/* 1. Landing-Visual (Bird), full width, natürliche Höhe (keine JS-Berechnung mehr). */}
        <img src="/assets/visuals/mainVisualLanding.png" alt="" aria-hidden className="ftools-m-bird" />

        {/* Platzhalter über „Die Finanztools" → drückt dessen Flow-Position runter, damit das Label
            (sticky bottom) wie Desktop unten klebt und erst nach etwas Scrollen mit hochscrollt. */}
        <div className="ftools-m-finanztools-spacer" aria-hidden />

        {/* 2. Überschriften — „Die Finanztools" + Wolke. STICKY BOTTOM (wie Desktop): klebt perfekt
              über den 3 Buttons; scrollt erst mit, wenn die Wolke 36px Abstand zum Bird darüber hat. */}
        <div className="ftools-m-finanztools-row">
          <img src="/assets/finanztoolBlendMobile.svg" alt="" aria-hidden className="ftools-m-blend" />
          <p className="ftools-m-finanztools">Die Finanztools</p>
        </div>
        <h2 className="ftools-m-allein">Alles in eigener Hand</h2>

        {/* 3. Beschreibung 1 — fadet aus UND kollabiert sobald ein Tool expanded ist, damit der
              freiwerdende Platz nach oben genutzt wird (Slider rutscht hoch, Stage wächst nicht nach unten).
              Innerer .ftools-m-desc = Scroll-Reveal. */}
        <div
          className="ftools-m-desc-wrap"
          style={{
            position: "relative",
            zIndex: 2,
            opacity: activeCard ? 0 : 1,
            // Nur ausfaden (NICHT kollabieren) — der Platz fürs Hochrutschen kommt aus dem Slider-translateY,
            // damit das Grundlayout/die Höhe gleich bleibt (kein Reflow/Sprung).
            transition: "opacity 0.3s ease",
          }}
        >
          <p className="ftools-m-desc">Behalten Sie die Kontrolle über Ihre Finanzen und Versicherungen.</p>
        </div>

        {/* 4. Toolbox / Tool-Slider (Crossfade wie Desktop). Rutscht beim Expand per translateY hoch,
              damit die nach oben öffnende Card Platz hat — Grundlayout bleibt (visual-only). */}
        <div
          className="ftools-m-slider"
          style={{ transform: `translateY(${activeCard ? -M_VISUAL_SHIFT : 0}px)`, transition: "transform 0.6s cubic-bezier(0.77,0,0.18,1)" }}
        >
          <img src={INTRO_IMAGE} alt="" aria-hidden style={{ opacity: currentSlide === 3 ? 1 : 0 }} />
          {TOOLS.map((tool, i) => (
            <img key={i} src={tool.image} alt="" aria-hidden style={{ opacity: i === currentSlide ? 1 : 0 }} />
          ))}
        </div>

        {/* 5. Sticky-Revolver-Stage (≤767): Desktop-Technik, bottom-anchored. KOMPAKTE Flow-Höhe
              (kein Reservegap im Intro); der Expand-Inhalt ragt nach OBEN raus (overflow visible).
              Cards/Loader sind über `bottom` (Abstand zur Unterkante) verankert. */}
        <div className="ftools-m-stage" style={{ height: M_INTRO_H, overflow: "visible" }}>
          {/* Progress-Linie + Pause/Play + Bookmark — absolut, bottom = mLoaderTop (slided wie Desktop). */}
          <div className="ftools-m-loader" style={{ position: "absolute", left: 0, right: 0, bottom: mLoaderTop }}>
            <button
              type="button"
              className="ftools-m-loader-toggle"
              style={{ top: activeCard ? -98 : -28, opacity: loaderActive ? 1 : 0, pointerEvents: loaderActive ? "auto" : "none" }}
              onClick={() => {
                // Play aus dem X-Collapse-Zustand (keine Card, kein Tween) → Lead-in neu starten.
                if (loaderPaused && activeCardRef.current === null && !introTweenRef.current) {
                  startLeadInRef.current();
                } else {
                  setLoaderPaused((p) => !p);
                }
              }}
              aria-label={loaderPaused ? "Abspielen" : "Pause"}
            >
              {loaderPaused ? (
                <svg width="11" height="13" viewBox="0 0 11 13" aria-hidden><path d="M0 0v13l11-6.5z" fill="currentColor" /></svg>
              ) : (
                <svg width="10" height="13" viewBox="0 0 10 13" aria-hidden><rect width="3.2" height="13" fill="currentColor" /><rect x="6.8" width="3.2" height="13" fill="currentColor" /></svg>
              )}
            </button>
            <div className="ftools-m-loader-track" style={{ transform: loaderActive ? "scaleX(1)" : "scaleX(0)" }} />
            <div className="ftools-m-loader-fill" style={{ width: `${Math.round(introProgress * 100)}%` }} />
            <div className="ftools-m-loader-bookmark" style={{ opacity: activeTool ? 1 : 0 }} aria-hidden>
              <div style={{ width: 28, height: 9, background: activeTool?.color ?? "transparent" }} />
              <svg width="28" height="23" viewBox="0 0 28 23" fill="none" style={{ display: "block", marginTop: -1 }}>
                <path d="M13.9991 8.58256L28 22.5817V6.8343e-07L0 1.90735e-06L0 22.5817L13.9991 8.58256Z" fill={activeTool?.color ?? "transparent"} />
              </svg>
            </div>
          </div>

          {/* 3 Tool-Cards (absolut, getweent). Header (Icon+Titel) immer sichtbar; Body (Desc+CTA)
              opacity = contentProg → erscheint beim Aufmorphen zur großen Card. */}
          {TOOLS.map((tool, i) => {
            const activeIndex = activeCard ? TOOLS.findIndex((t) => t.title === activeCard) : -1;
            const L = mCardLayouts[i] ?? mToolSlot(i, activeIndex, mStageW || 320, titleWidths);
            const cp = contentProgs[i];
            const isActiveTool = activeCard === tool.title;
            return (
              <div
                key={tool.title}
                className="ftools-m-tcard"
                onClick={() => { if (!isActiveTool) mobileCardClickRef.current(i); }}
                style={{
                  position: "absolute",
                  left: Math.round(L.x), bottom: Math.round(L.y),
                  width: L.w, height: L.h,
                  overflow: "hidden",   // Content vom Button geclippt → reveal beim Aufmorphen (wie Desktop)
                  // Glass NUR als Button — fadet zur großen Card komplett raus (wie Desktop):
                  // kein Radius/Background/Blur/Schatten/Füllung mehr bei cp=1.
                  borderRadius: 17 * (1 - cp),
                  background: `rgba(255, 255, 255, ${(0.8 * (1 - cp)).toFixed(3)})`,
                  backdropFilter: cp > 0.5 ? "none" : "brightness(1.3) blur(13px)",
                  WebkitBackdropFilter: cp > 0.5 ? "none" : "brightness(1.3) blur(13px)",
                  boxShadow: `0 3px 23px rgba(0, 0, 0, ${(0.05 * (1 - cp)).toFixed(3)})`,
                  zIndex: cp > 0.5 ? 3 : 2,
                }}
              >
                {/* Header: Icon NEBEN Titel — Titel unten bündig mit dem Icon (align-end), nah dran.
                    Größen morphen Button→Card: Icon 28→38, Titel 14→28. */}
                <div className="ftools-m-tcard-head">
                  {tool.icon && <img src={tool.icon} alt="" aria-hidden style={{ width: 28 + 10 * cp, height: 28 + 10 * cp }} />}
                  {/* Titel rutscht mit cp leicht runter → unten bündig mit dem (größeren) Icon. */}
                  <span style={{ fontSize: 14 + 14 * cp, transform: `translateY(${(5 * cp).toFixed(2)}px)` }}>{tool.title}</span>
                </div>
                {/* Beschreibung — oben verankert, FESTE Breite (große Card) → bricht beim Morph nicht um. */}
                <p className="ftools-m-card-desc" style={{ width: (mStageW || 320) - 36, opacity: cp, pointerEvents: cp > 0.5 ? "auto" : "none" }}>{tool.description}</p>
                {/* CTA — TOP-verankert an seiner FINALEN Position (M_BIG_H − 52 → unten, 4px Outline-Luft).
                    So bewegt er sich beim Morph nicht (die Card-Oberkante steht ~fest), nur Clip/Opacity. */}
                <div className="ftools-m-card-cta" style={{ top: M_BIG_H - 52, opacity: cp, pointerEvents: cp > 0.5 ? "auto" : "none" }}>
                  <Button label={tool.cta.replace("Zu unseren", "Zu den")} href={tool.href} />
                </div>
              </div>
            );
          })}

          {/* Schließen-X — EINE feste Instanz wie Desktop (morpht NICHT mit den Cards). Oben rechts
              an der großen Card, bottom-anchored, faded mit activeCard. */}
          <button
            type="button"
            className="ftools-m-card-close"
            onClick={() => collapseAndPauseRef.current()}
            aria-label="Schließen"
            tabIndex={activeCard ? 0 : -1}
            style={{ bottom: M_BIG_H - 9 - 34, opacity: activeCard ? 1 : 0, pointerEvents: activeCard ? "auto" : "none" }}
          >
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden>
              <circle cx="17" cy="17" r="16" stroke="var(--color-text-primary)" strokeWidth="1.3" />
              <path d="M11.5 11.5l11 11M22.5 11.5l-11 11" stroke="var(--color-text-primary)" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </button>
        </div>{/* ftools-m-stage */}

        {/* Beschreibung 2 — im Section-Flow (scrollt mit, NICHT sticky). Flex-Reihe mit einem LEEREN
            Platzhalter in EXAKTER Größe des Button-Stacks (Breite = breitester Button, Höhe = Stack) +
            desc2 daneben (top-aligned, streckt nach rechts). So sitzt der Text immer korrekt — keine
            Schätzung. bottom = padding-bottom (56) → Platzhalter deckt sich mit dem Button-Stack. */}
        <div className="ftools-m-desc2-row" style={{ opacity: activeCard ? 0 : 1, transition: "opacity 0.3s ease" }}>
          <div className="ftools-m-desc2-spacer" style={{ width: 64 + Math.max(60, ...titleWidths), height: M_STACK_H }} aria-hidden />
          <p className="ftools-m-desc2">Von Brutto-Netto-Rechner bis zum komplexen Versicherungsvergleich. Wir haben das passende Tool für Sie</p>
        </div>
      </div>{/* ftools-mobile */}
    </section>
  );
}
