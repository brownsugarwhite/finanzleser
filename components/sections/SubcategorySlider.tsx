'use client';

import { useEffect, useLayoutEffect, useState, useCallback, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import SlideCategoryCard, { type CategorySlide } from '@/components/ui/SlideCategoryCard';
import SliderNav from '@/components/ui/SliderNav';
import SliderSideArrows from '@/components/ui/SliderSideArrows';
import SliderEdgeSpark from '@/components/ui/SliderEdgeSpark';
import SliderHoverBox from '@/components/ui/SliderHoverBox';
import ArticleSlider from '@/components/sections/ArticleSlider';
import { useSliderPill } from '@/lib/hooks/useSliderPill';
import { useSliderHoverBox } from '@/lib/hooks/useSliderHoverBox';
import { getSliderActive, setSliderActive, isBackNavigation } from '@/lib/landingState';
import type { Post } from '@/lib/types';

const CAT_GAP = 65;
const CARD_WIDTH = 360;
export const MORPH_DURATION = 300; // ms — muss zu T1 in SlideCategoryCard passen

// ── Main SubcategorySlider ──

interface SubcategorySliderProps {
  categories: CategorySlide[];
  parentSlug: string;
  allCategoryPosts?: Record<string, Post[]>;
  /** Meldet, ob eine Kategorie gewählt ist (Button-Modus) — für den Überschrift-Morph. */
  onActiveChange?: (active: boolean) => void;
  /** Erhöhter Zähler schließt die aktive Kategorie (Klick auf „schließen"). */
  closeToken?: number;
}

export default function SubcategorySlider({ categories, parentSlug, allCategoryPosts = {}, onActiveChange, closeToken }: SubcategorySliderProps) {
  const [catEmblaRef, catEmblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    dragFree: true,
    containScroll: 'trimSnaps',
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [slideStyles, setSlideStyles] = useState<{ opacity: number; scale: number; origin: 'left' | 'right' | 'center' }[]>([]);
  // Bei Browser-Zurück (Back-Flag) den vorherigen Slider-Zustand synchron + INSTANT
  // wiederherstellen → Landing rendert sofort im finalen Artikelmodus (volle Höhe,
  // keine Öffnungs-Animation), damit es exakt so aussieht wie beim Klick auf den
  // Artikel und Nexts native Scroll-Restoration greift. Nur bei Back; sonst Default.
  const [backOpen] = useState(
    () => typeof window !== 'undefined' && isBackNavigation() && getSliderActive(parentSlug) !== null
  );
  const [activeSlide, setActiveSlide] = useState<number | null>(
    () => (backOpen ? getSliderActive(parentSlug) : null)
  );
  // Aktiv-Zustand (Kategorie gewählt) nach oben melden — treibt den Überschrift-Morph.
  useEffect(() => {
    onActiveChange?.(activeSlide !== null);
  }, [activeSlide, onActiveChange]);
  // Klick auf „schließen" (Token-Erhöhung) → aktive Kategorie schließen.
  const closeTokenRef = useRef(closeToken);
  useEffect(() => {
    if (closeToken === undefined || closeToken === closeTokenRef.current) return;
    closeTokenRef.current = closeToken;
    setActiveSlide(null);
  }, [closeToken]);
  // Zustand für die nächste Zurück-Navigation merken.
  useEffect(() => {
    setSliderActive(parentSlug, activeSlide);
  }, [parentSlug, activeSlide]);

  const [isMobile, setIsMobile] = useState(false);
  // useLayoutEffect: Breakpoint VOR dem Paint festlegen → der Mobile-/Desktop-
  // DOM-Swap (Zeilen ~577/604) flippt vor dem Paint statt sichtbar danach.
  useLayoutEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // Measure all title widths for pill lens + SlideCategoryCard
  const [titleWidths, setTitleWidths] = useState<number[]>([]);
  // useLayoutEffect: Titelbreiten VOR Paint messen, damit Fit/Spacer/Button-Breiten
  // beim Back-Restore sofort korrekt sind (kein nachträglicher Sprung der Button-Reihe).
  useLayoutEffect(() => {
    const widths = categories.map((cat) => {
      const el = document.createElement('span');
      el.style.cssText = `
        position: absolute; visibility: hidden; white-space: nowrap;
        font-family: var(--font-heading, 'Merriweather', serif);
        font-size: 16px; font-weight: 600; line-height: 1.3;
      `;
      el.textContent = cat.name;
      document.body.appendChild(el);
      const w = el.offsetWidth + 4;
      document.body.removeChild(el);
      return w;
    });
    setTitleWidths(widths);
  }, [categories]);

  // Nav state — switches between category and article
  const [articleNav, setArticleNav] = useState<{
    current: number; total: number;
    onPrev: () => void; onNext: () => void; onGoTo: (i: number) => void;
  } | null>(null);

  const handleArticleNavReady = useCallback((nav: typeof articleNav) => {
    setArticleNav(nav);
  }, []);

  // Article-Slider meldet, ob er scrollbar ist (sonst soll die Nav unten
  // ausgeblendet und die Cards zentriert angezeigt werden).
  const [articleCanScroll, setArticleCanScroll] = useState(true);
  const handleArticleCanScrollChange = useCallback((scroll: boolean) => {
    setArticleCanScroll(scroll);
  }, []);

  // Slider-Stack hat feste Höhen für Card- und Button-Mode. Zwischen diesen
  // wird mit ease-in-out über die volle Morphdauer animiert. So wandert die
  // Pagination smooth in eine Richtung, unabhängig vom Natural-Flow des Contents.
  const STACK_HEIGHT_CLOSED = 350;
  const STACK_HEIGHT_OPEN = 440;

  const activePosts = activeSlide !== null
    ? allCategoryPosts[categories[activeSlide]?.slug] || []
    : [];

  const isArticleMode = activeSlide !== null && activePosts.length > 0;

  // Merkt ob beim letzten Render bereits Button-Mode aktiv war.
  // Verhindert Pre-Scroll bei Active→Active (nur bei card→button nötig).
  const wasInButtonModeRef = useRef(backOpen);
  // Back-Restore: erster Lauf(e) des Open-Effekts mit unverändertem activeSlide
  // überspringen (Zustand ist via Initializer schon offen → keine Animation).
  const restoredRef = useRef(backOpen);

  // renderedSlide als State: entkoppelt vom activeSlide für den A→B-OUT-Delay.
  const [renderedSlide, setRenderedSlide] = useState<number | null>(
    backOpen ? getSliderActive(parentSlug) : null
  );
  const prevCatRef = useRef<number | null>(backOpen ? getSliderActive(parentSlug) : null);
  const [categoryTransition, setCategoryTransition] = useState<'idle' | 'out' | 'in'>('idle');

  const renderedPosts = renderedSlide !== null
    ? (allCategoryPosts[categories[renderedSlide]?.slug] || [])
    : [];

  // 2-Phasen-Animation für Artikel-Slider
  // Phase 1: Sparks/Linien/Artikel-Visuals (parallel zum Card-Visual-Collapse)
  // Phase 2: Artikel-Text (parallel zur Card-Breiten-Änderung)
  const [phase1Visible, setPhase1Visible] = useState(backOpen);
  const [phase2Visible, setPhase2Visible] = useState(backOpen);
  const [articleMounted, setArticleMounted] = useState(backOpen);
  const articleRef = useRef<HTMLDivElement>(null);
  const [articleHeight, setArticleHeight] = useState(0);
  useEffect(() => {
    if (!articleMounted) {
      setArticleHeight(0);
      return;
    }
    if (!articleRef.current) return;
    const el = articleRef.current;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setArticleHeight(entry.contentRect.height);
      }
    });
    ro.observe(el);
    setArticleHeight(el.getBoundingClientRect().height);
    return () => ro.disconnect();
  }, [articleMounted]);
  // fullyOpen: nach Abschluss der gesamten Öffnen-Animation true, sofort beim
  // Schließen-Start wieder false. Steuert overflow-Switch (hidden während
  // Transition, visible im Ruhezustand), damit Card-Hover-Scale nicht geclippt.
  const [fullyOpen, setFullyOpen] = useState(backOpen);
  useEffect(() => {
    const prev = prevCatRef.current;
    prevCatRef.current = activeSlide;

    // Back-Restore: solange activeSlide unverändert dem initial wiederhergestellten
    // Wert entspricht, ist der Zustand bereits final offen (Initializer) → KEINE
    // Öffnungs-Animation. Erst eine echte Änderung schaltet auf normale Animationen.
    if (restoredRef.current) {
      if (activeSlide === prev) return;
      restoredRef.current = false;
    }

    // A → B: OUT-Animation (200ms), dann Slide wechseln + IN-Animation
    if (activeSlide !== null && prev !== null && activeSlide !== prev) {
      setCategoryTransition('out');
      const tIdleRef = { current: null as ReturnType<typeof setTimeout> | null };
      const tSwitch = setTimeout(() => {
        setRenderedSlide(activeSlide);
        setCategoryTransition('in');
        tIdleRef.current = setTimeout(() => setCategoryTransition('idle'), 300);
      }, 200);
      return () => {
        clearTimeout(tSwitch);
        if (tIdleRef.current) clearTimeout(tIdleRef.current);
      };
    }

    if (activeSlide !== null) {
      setRenderedSlide(activeSlide);
      const isFromCardMode = !wasInButtonModeRef.current;
      wasInButtonModeRef.current = true;
      const startMorph = () => {
        setArticleMounted(true);
        setPhase1Visible(true);
      };
      // Pre-scroll: NUR beim Wechsel card→button (nicht bei Active→Active),
      // und nur wenn alle Buttons passen (fits=true). Sonst würde scrollTo(0)
      // ein laufendes Momentum unterbrechen und der Slider springt.
      const buttonFits = (() => {
        if (titleWidths.length !== categories.length) return false;
        const spacerBasis = window.innerWidth * 0.05;
        const gaps = (categories.length + 1) * CAT_GAP;
        const buttonContentWidth = titleWidths.reduce((a, b) => a + b, 0);
        const needed = buttonContentWidth + gaps + 2 * spacerBasis + 40;
        return window.innerWidth >= needed;
      })();
      const needsPreScroll = isFromCardMode && buttonFits && !!catEmblaApi?.canScrollPrev();
      let tPre: ReturnType<typeof setTimeout> | null = null;
      if (needsPreScroll && catEmblaApi) {
        catEmblaApi.scrollTo(0, false);
        tPre = setTimeout(startMorph, 400);
      } else {
        startMorph();
      }
      const t = setTimeout(() => setPhase2Visible(true), MORPH_DURATION + (needsPreScroll ? 400 : 0));
      const tFull = setTimeout(() => setFullyOpen(true), MORPH_DURATION * 2 + (needsPreScroll ? 400 : 0));
      return () => {
        if (tPre) clearTimeout(tPre);
        clearTimeout(t);
        clearTimeout(tFull);
      };
    } else {
      wasInButtonModeRef.current = false;
      setFullyOpen(false);
      setPhase2Visible(false);
      const t1 = setTimeout(() => setPhase1Visible(false), MORPH_DURATION);
      const t2 = setTimeout(() => {
        setArticleMounted(false);
        setRenderedSlide(null);
      }, MORPH_DURATION * 2 + 50);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [activeSlide, catEmblaApi]);

  // Category scroll tracking
  const slideStylesRef = useRef<{ opacity: number; scale: number; origin: 'left' | 'right' | 'center' }[]>([]);
  // Vorheriger Mode (button vs card) zur Erkennung von echten Mode-Wechseln.
  // Category-Wechsel (X → Y, beide non-null) ist KEIN Mode-Wechsel → FADE-
  // Params nicht interpolieren (sonst springt der erste Button).
  const prevActiveModeRef = useRef<boolean>(backOpen);

  useEffect(() => {
    if (!catEmblaApi) return;

    const slideCount = categories.length;
    // FADE-Params: volle Werte für Card- und Button-Mode. Während Morph
    // (MORPH_DURATION * 2) werden sie linear zwischen den Modes interpoliert,
    // damit die Scale der ersten/letzten Card nicht instant springt bei
    // Mode-Wechsel.
    // Mobile: kürzere Right-Fade-Zone im Card-Mode (Button-Mode bleibt
    // unverändert — Wert wirkt dort bereits passend).
    // left bewusst flach: die erste Card/Button (im Ruhezustand) soll NICHT
    // skaliert/gefaded sein — erst beim Weiterscrollen nach links fadet sie.
    const CARD_PARAMS = { left: 290, right: isMobile ? 200 : 320, scaleMin: 0.2, overshoot: isMobile ? 80 : 150 };
    const BTN_PARAMS = { left: 170, right: 200, scaleMin: 0, overshoot: 40 };
    const morphDurationMs = MORPH_DURATION * 2;
    const morphStartMs = performance.now();
    // Echter Mode-Wechsel nur bei button↔card, nicht bei Category-Switch
    // (X → Y, beide non-null).
    const currMode = activeSlide !== null;
    const isModeChange = prevActiveModeRef.current !== currMode;
    prevActiveModeRef.current = currMode;

    const FULL: { opacity: number; scale: number; origin: 'left' | 'right' | 'center' } = { opacity: 1, scale: 1, origin: 'center' };

    const update = () => {
      const progress = Math.max(0, Math.min(1, catEmblaApi.scrollProgress()));
      const idx = Math.max(0, Math.min(slideCount - 1, Math.round(progress * (slideCount - 1))));
      setSelectedIndex(idx);

      // Morph-Progress: 0 = Start dieser Effekt-Iteration (vorheriger Mode),
      // 1 = fully in neuem Mode. Nur interpolieren bei echtem Mode-Wechsel.
      // Bei Category-Switch (X → Y) bleibt cardness stabil bei 0 (button).
      const sinceMorph = performance.now() - morphStartMs;
      const mProgress = Math.min(1, Math.max(0, sinceMorph / morphDurationMs));
      // cardness: 0 = fully button, 1 = fully card
      const cardness = isModeChange
        ? (activeSlide !== null ? (1 - mProgress) : mProgress)
        : (activeSlide !== null ? 0 : 1);
      const FADE_LEFT = BTN_PARAMS.left + (CARD_PARAMS.left - BTN_PARAMS.left) * cardness;
      const FADE_RIGHT = BTN_PARAMS.right + (CARD_PARAMS.right - BTN_PARAMS.right) * cardness;
      const SCALE_MIN = BTN_PARAMS.scaleMin + (CARD_PARAMS.scaleMin - BTN_PARAMS.scaleMin) * cardness;
      const FADE_OVERSHOOT = BTN_PARAMS.overshoot + (CARD_PARAMS.overshoot - BTN_PARAMS.overshoot) * cardness;

      const rootNode = catEmblaApi.rootNode();
      const rootRect = rootNode.getBoundingClientRect();
      const slideNodes = catEmblaApi.slideNodes();
      let changed = false;

      const styles = slideNodes.map((node, i) => {
        const rect = node.getBoundingClientRect();
        const slideCenter = rect.left + rect.width / 2;
        const distFromLeft = slideCenter - rootRect.left;
        const distFromRight = rootRect.right - slideCenter;

        let s = FULL;
        if (!isMobile && distFromLeft < FADE_LEFT) {
          const t = Math.max(0, Math.min(1, (distFromLeft + FADE_OVERSHOOT) / (FADE_LEFT + FADE_OVERSHOOT)));
          const eased = t * (2 - t); // ease-out quadratic
          s = { opacity: eased, scale: SCALE_MIN + (1 - SCALE_MIN) * eased, origin: 'right' };
        } else if (distFromRight < FADE_RIGHT) {
          const t = Math.max(0, Math.min(1, (distFromRight + FADE_OVERSHOOT) / (FADE_RIGHT + FADE_OVERSHOOT)));
          const eased = t * (2 - t); // ease-out quadratic
          s = { opacity: eased, scale: SCALE_MIN + (1 - SCALE_MIN) * eased, origin: 'left' };
        }

        const prev = slideStylesRef.current[i];
        if (!prev || Math.abs(prev.opacity - s.opacity) > 0.01 || Math.abs(prev.scale - s.scale) > 0.005 || prev.origin !== s.origin) {
          changed = true;
        }
        return s;
      });

      if (changed) {
        slideStylesRef.current = styles;
        setSlideStyles(styles);
      }
    };

    catEmblaApi.on('scroll', update);
    catEmblaApi.on('reInit', update);
    catEmblaApi.on('resize', update);
    update();

    // RAF während des Morphs — tickt die Interpolation der FADE-Params
    // sowie die per-Frame Layout-Messung (Card-Breiten ändern sich via CSS).
    let rafId = 0;
    let cancelled = false;
    const morphEndsAt = morphStartMs + morphDurationMs + 50;
    const morphTick = () => {
      if (cancelled) return;
      update();
      if (performance.now() < morphEndsAt) {
        rafId = requestAnimationFrame(morphTick);
      }
    };
    rafId = requestAnimationFrame(morphTick);

    return () => {
      catEmblaApi.off('scroll', update);
      catEmblaApi.off('reInit', update);
      catEmblaApi.off('resize', update);
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [catEmblaApi, categories.length, activeSlide, isMobile]);

  // Reset article nav when closing
  // Delayed phase2 for spacer width (synced with card phase2)
  const [spacerExpanded, setSpacerExpanded] = useState(backOpen);
  useEffect(() => {
    if (activeSlide === null) {
      setArticleNav(null);
      setSpacerExpanded(false);
    } else {
      const t = setTimeout(() => setSpacerExpanded(true), MORPH_DURATION); // Phase 2 Start
      return () => clearTimeout(t);
    }
  }, [activeSlide]);

  // Detect if all cards fit in viewport — no slider needed.
  // Berücksichtigt den aktuellen Modus: in Card-Mode nimmt CARD_WIDTH, in
  // Button-Mode die Summe der titleWidths. Fit-Formel identisch zum
  // ArticleSlider: Spacer (5vw je Seite) + (n+1) Gaps mit einbeziehen.
  const [canScroll, setCanScroll] = useState(true);

  // Scroll-Enabled-State pro Richtung für das Fade der Prev/Next-Arrows.
  // Prev nutzt die native Embla-Logik (die mit Snap-Punkten sauber arbeitet).
  // Next wird manuell anhand der letzten Card gemessen, weil der Trailing-
  // Spacer sonst einen extra Scroll-Schritt zulassen würde.
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  useEffect(() => {
    if (!catEmblaApi) return;
    const updateCanScroll = () => {
      setCanPrev(catEmblaApi.canScrollPrev());

      const slides = catEmblaApi.slideNodes() as HTMLElement[];
      const viewport = catEmblaApi.rootNode() as HTMLElement | null;
      if (!viewport || slides.length < 3) {
        setCanNext(false);
        return;
      }
      const lastCard = slides[slides.length - 2]; // -2: Trailing-Spacer überspringen
      const vRect = viewport.getBoundingClientRect();
      const lRect = lastCard.getBoundingClientRect();
      setCanNext(lRect.right > vRect.right + 1);
    };
    updateCanScroll();
    catEmblaApi.on('select', updateCanScroll);
    catEmblaApi.on('scroll', updateCanScroll);
    catEmblaApi.on('reInit', updateCanScroll);
    catEmblaApi.on('resize', updateCanScroll);
    return () => {
      catEmblaApi.off('select', updateCanScroll);
      catEmblaApi.off('scroll', updateCanScroll);
      catEmblaApi.off('reInit', updateCanScroll);
      catEmblaApi.off('resize', updateCanScroll);
    };
  }, [catEmblaApi]);
  const prevFitsRef = useRef<boolean | null>(null);
  // useLayoutEffect: canScroll muss synchron vor dem nächsten Paint
  // aktualisiert werden wenn activeSlide sich ändert — sonst blinkt die
  // Pagination für 1 Frame weg beim Close-Morph.
  useLayoutEffect(() => {
    if (!catEmblaApi) return;
    let reInitTimer: ReturnType<typeof setTimeout> | null = null;
    const doReInit = (fits: boolean) => {
      const savedIndex = catEmblaApi.selectedScrollSnap();
      catEmblaApi.reInit({ watchDrag: !fits });
      if (savedIndex > 0) catEmblaApi.scrollTo(savedIndex, true);
    };
    const check = () => {
      // Static (kein Slider), sobald die letzte Card noch >40px Abstand zum
      // rechten Rand hat. Maßgeblich: Leading-Spacer (5vw) + n Gaps (Leading-Gap
      // + interne) + Content. Trailing-Spacer/Gap zählt NICHT mit (wird im
      // Static-Mode ausgeblendet, sonst würde er Overflow erzwingen).
      const spacerBasis = window.innerWidth * 0.05;
      const gaps = categories.length * CAT_GAP;
      const contentWidth =
        activeSlide !== null && titleWidths.length === categories.length
          ? titleWidths.reduce((a, b) => a + b, 0)
          : categories.length * CARD_WIDTH;
      const needed = spacerBasis + contentWidth + gaps + 40;
      const fits = window.innerWidth >= needed;
      setCanScroll(!fits);
      if (prevFitsRef.current !== fits) {
        prevFitsRef.current = fits;
        if (activeSlide === null) {
          // Auf Close: reInit verzögern bis nach Morph-Ende, damit embla die
          // bereits zurückanimierten Card-Breiten misst (nicht die Button-
          // Breiten während der Animation). Verhindert 1px-Snap am Ende.
          reInitTimer = setTimeout(() => doReInit(fits), MORPH_DURATION * 2 + 50);
        } else {
          doReInit(fits);
        }
      }
    };
    check();
    window.addEventListener('resize', check);
    return () => {
      window.removeEventListener('resize', check);
      if (reInitTimer) clearTimeout(reInitTimer);
    };
  }, [catEmblaApi, categories.length, titleWidths, activeSlide]);

  // Delay static-layout expand on close so Card morphs first, THEN spacer grows
  const [staticLayout, setStaticLayout] = useState(true);
  useEffect(() => {
    if (activeSlide !== null) {
      // Open: collapse static layout immediately
      setStaticLayout(false);
    } else {
      // Close: wait for card morph, then expand spacer
      const t = setTimeout(() => setStaticLayout(true), MORPH_DURATION);
      return () => clearTimeout(t);
    }
  }, [activeSlide]);

  // Hard lock against hover-pill movement only during card↔button morph
  // (active → active wechsel löst KEINEN Lock aus)
  const prevActiveSlideRef = useRef<number | null>(null);
  const [morphLock, setMorphLock] = useState(false);
  useEffect(() => {
    const prev = prevActiveSlideRef.current;
    prevActiveSlideRef.current = activeSlide;
    const isModeChange = (prev === null) !== (activeSlide === null);
    if (!isModeChange) return;
    setMorphLock(true);
    const t = setTimeout(() => setMorphLock(false), 900);
    return () => clearTimeout(t);
  }, [activeSlide]);

  // Im Button-Mode (activeSlide !== null) zählt staticLayout-Delay nicht —
  // Spacer sollen sofort mitwachsen wenn die Buttons in den Viewport passen.
  // Der staticLayout-Delay ist nur für's Card-Mode-Close (damit Cards erst
  // expandieren bevor Spacer schrumpfen).
  const useStaticLayout = !canScroll && (activeSlide !== null || staticLayout);
  // Nur die Kategorie-Cards im Card-Modus zentrieren, wenn sie KEIN Slider sind
  // (static). Button-Modus + Artikel-Slider bleiben linksbündig.
  const centerStaticCards = useStaticLayout && activeSlide === null;
  // Der card→button-Morph ist 2-teilig: erst Höhe (Phase 1), dann Breite (Phase 2).
  // Die Zentrierung→Linksbündig soll NUR im 2. Teil (Breite) laufen — daher schaltet
  // cardsCentered bei einem echten Card↔Button-Morph erst nach MORPH_DURATION um.
  // Initial-Load/Resize (kein Morph): sofort.
  const [cardsCentered, setCardsCentered] = useState(centerStaticCards);
  const prevActiveForCenterRef = useRef(activeSlide);
  useEffect(() => {
    const prev = prevActiveForCenterRef.current;
    prevActiveForCenterRef.current = activeSlide;
    const isMorph = (prev === null) !== (activeSlide === null);
    if (isMorph && activeSlide !== null) {
      // ÖFFNEN: Breiten-Phase ist der 2. Teil → Zentrierung erst nach MORPH_DURATION lösen.
      const t = setTimeout(() => setCardsCentered(false), MORPH_DURATION);
      return () => clearTimeout(t);
    }
    if (isMorph && activeSlide === null) {
      // SCHLIESSEN: Breiten-(Rück-)Phase ist der 1. Teil → SOFORT (re-)zentrieren,
      // synchron zur Breiten-Animation (sonst Sprung an der Phasengrenze). Ziel:
      // passt der Card-Modus in den Viewport? (centerStaticCards ist hier noch
      // false, da staticLayout erst bei MORPH_DURATION kippt → direkt messen.)
      const spacerBasis = window.innerWidth * 0.05;
      const cardFits = window.innerWidth >= spacerBasis + categories.length * CARD_WIDTH + categories.length * CAT_GAP + 40;
      setCardsCentered(cardFits);
      return;
    }
    setCardsCentered(centerStaticCards);
  }, [activeSlide, centerStaticCards, categories.length]);
  // Easing der Zentrierung EXAKT wie die Card-Breiten-Animation (SlideCategoryCard
  // phase2Ease = active ? 'ease-out' : 'ease-in'): sonst läuft die Zentrierung der
  // Breitenänderung voraus (erst zentriert, dann wächst die Breite → ruckelig).
  const centerEase = activeSlide !== null ? 'ease-out' : 'ease-in';

  // Slider pill hover effect
  const sliderPill = useSliderPill({
    items: categories,
    emblaApi: catEmblaApi,
    isActiveMode: activeSlide !== null,
    titleWidths,
    gap: CAT_GAP,
    spacerExpanded,
    hasLens: true,
    activeIndex: activeSlide,
    slideStylesRef,
    isMobile,
  });

  // Hover-Kasten (nur Desktop + Card-Modus; Button-Modus nutzt die Pill).
  // Hover erst NACH dem Morph aktiv — während/direkt nach dem card↔button-Morph
  // (morphLock, 900ms) ist die Card-Höhe noch nicht final → Kasten erfasst sie
  // falsch. morphLock deckt die ~650ms Morphdauer + Settle-Puffer ab.
  const hoverEnabled = !isMobile && activeSlide === null && !morphLock;
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const hoverBox = useSliderHoverBox({
    cardSelector: '[data-slider-card]',
    enabled: hoverEnabled,
    onBoxClosed: (i) => setHoveredIndex((h) => (h === i ? null : h)),
  });

  if (!categories || categories.length === 0) return null;

  const navProps = isArticleMode && articleNav
    ? articleNav
    : {
        current: selectedIndex,
        total: categories.length,
        onPrev: () => catEmblaApi?.scrollPrev(),
        onNext: () => catEmblaApi?.scrollNext(),
        onGoTo: (i: number) => catEmblaApi?.scrollTo(i),
      };
  const navVisible = (canScroll && !isArticleMode) || (isArticleMode && articleCanScroll);

  return (
    <section style={{ width: '100%', overflowX: 'clip', padding: '40px 0' }}>
      {/* Slider-Stack mit Edge-Gradients (liegt über beiden Slidern + Pill).
          Eigene animierte Höhe (closed↔open) damit die Pagination smooth in
          eine Richtung wandert, ohne vom Natural-Flow des Contents beeinflusst. */}
      <div
        style={{
          position: 'relative',
          height: activeSlide !== null ? STACK_HEIGHT_OPEN : STACK_HEIGHT_CLOSED,
          transition: `height ${(MORPH_DURATION * 2) / 1400}s ease-out`,
        }}>
      {/* Einfache Pfeil-Badges mittig über dem Slider (Desktop + Mobile, mobil schmaler). */}
      <SliderSideArrows
        onPrev={navProps.onPrev}
        onNext={navProps.onNext}
        canPrev={navVisible && navProps.current > 0}
        canNext={navVisible && navProps.current < navProps.total - 1}
      />
      {/* Category Slider — wrapper for pill overlay */}
      <div style={{ position: 'relative' }}>
        {/* Punkt 8c: Edge-Pfeile (Linie + Dreieck) im Button-Mode — jetzt Mobile
            UND Desktop. Scale-in wenn in die jeweilige Richtung scrollbar
            (Anfang/Ende erreicht → aus). Dark, bei Hover/Klick brand-secondary
            + leichter Squeeze. Der eigene Page-Gradient nur mobil (Desktop hat
            bereits die 150px subcat-edge-Gradients → sonst doppelter Fade). */}
        {activeSlide !== null && ([
          { dir: "left" as const, show: canScroll && canPrev, onClick: () => catEmblaApi?.scrollPrev(), label: "Zurück" },
          { dir: "right" as const, show: canScroll && canNext, onClick: () => catEmblaApi?.scrollNext(), label: "Weiter" },
        ]).map(({ dir, show, onClick, label }) => (
          <div
            key={dir}
            aria-hidden={!show}
            style={{ position: "absolute", top: 0, bottom: 0, [dir]: 0, width: 56, zIndex: 20, pointerEvents: "none" }}
          >
            {/* Page-Color-Gradient maskiert die Buttons am Rand. top/bottom -60,
                damit auch die (höhere) aktive Pill samt Linien voll abgedeckt wird.
                Nur Mobile — Desktop maskiert über die subcat-edge-Gradients. */}
            {isMobile && (
            <div
              style={{
                position: "absolute", top: -60, bottom: -60, [dir]: 0, width: "100%",
                background: `linear-gradient(to ${dir === "left" ? "right" : "left"}, var(--color-bg-page) 35%, rgba(250,249,246,0))`,
                opacity: show ? 1 : 0,
                transition: "opacity 0.25s ease",
              }}
            />
            )}
            <button
              aria-label={label}
              onClick={onClick}
              className="subcat-edge-arrow"
              data-show={show ? "true" : "false"}
              style={{ [dir]: 7 }}
            >
              <span className="subcat-edge-arrow-line" />
              <svg width={16.7} height={20} viewBox="0 0 15 18" aria-hidden
                style={{ display: "block", flexShrink: 0, transform: dir === "left" ? "scaleX(-1)" : undefined }}>
                <path d="M15 9L0 18V0L15 9Z" />
              </svg>
              <span className="subcat-edge-arrow-line" />
            </button>
          </div>
        ))}
        <div
          ref={catEmblaRef}
          style={{
            cursor: canScroll ? 'grab' : 'default',
            boxSizing: 'border-box',
            position: 'relative',
          }}
        >
          <div
            onMouseMove={morphLock ? undefined : sliderPill.handleContainerMove}
            onMouseLeave={morphLock ? undefined : () => { sliderPill.handleContainerLeave(); hoverBox.leaveRegion(); }}
            // Mobile: Abstand zum linken Rand (Leading-Spacer ist mobil display:none).
            // Button-Mode 36px (Pill überhängt den Text links ~16px → sonst am Rand
            // abgeschnitten), Card-Mode 20px. Desktop unverändert.
            style={{ display: 'flex', gap: `${CAT_GAP}px`, paddingLeft: isMobile ? (activeSlide !== null ? 36 : 20) : 0 }}
          >
            <div
              aria-hidden
              className="subcat-leading-spacer"
              data-expanded={spacerExpanded ? "true" : "false"}
              style={{
                // Static-Card-Modus: Leading wächst symmetrisch zum Trailing
                // (beide flex-grow:1, flex-basis:0) → Cards zentriert. Sonst bleibt
                // er der kleine 5vw-Rand (flex-basis via CSS). Da flex-grow/flex-basis
                // animierbar sind, gleitet der card→button-Morph weich von zentriert
                // nach linksbündig statt zu springen.
                // Mobile: Leading-Spacer entfällt komplett (display:none) via CSS.
                flexGrow: cardsCentered ? 1 : 0,
                flexShrink: 0,
                flexBasis: cardsCentered ? 0 : undefined,
                minWidth: 0,
                // Back-Restore: instant (sonst schiebt die animierte Spacer-Breite die Button-Reihe).
                // Easing = centerEase (deckt sich mit der Card-Breiten-Animation).
                transition: backOpen ? 'none' : `flex-grow ${MORPH_DURATION / 1000}s ${centerEase}, flex-basis ${MORPH_DURATION / 1000}s ${centerEase}`,
              }}
            />
            {categories.map((cat, index) => {
              const isLast = index === categories.length - 1;
              const cardFull = hoverEnabled && hoveredIndex === index;
              const decoFull = hoverEnabled && (hoveredIndex === index || hoveredIndex === index + 1);
              const wrapOpacity = cardFull ? 1 : (slideStyles[index + 1]?.opacity ?? 1);
              const innerScale = cardFull ? 1 : (slideStyles[index + 1]?.scale ?? 1);
              const decoScale = decoFull ? 1 : Math.min(slideStyles[index + 1]?.scale ?? 1, slideStyles[index + 2]?.scale ?? 1);
              const decoOpacity = decoFull ? 1 : Math.min(slideStyles[index + 1]?.opacity ?? 1, slideStyles[index + 2]?.opacity ?? 1);

              return (
                <div
                  key={cat.slug}
                  ref={(el) => { if (el) sliderPill.cardRefs.current[index] = el; hoverBox.registerCard(index, el); }}
                  onMouseEnter={hoverEnabled ? () => { setHoveredIndex(index); hoverBox.onEnter(index); } : undefined}
                  onMouseLeave={hoverEnabled ? () => hoverBox.onLeave(index) : undefined}
                  style={{
                    flex: '0 0 auto',
                    minWidth: 0,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: wrapOpacity,
                    // KEINE CSS-transition — die RAF-Loop in update() setzt
                    // slideStyles pro Frame neu. Eine 0.3s-Transition würde
                    // bei jedem Update einen neuen Tween gegen ein bewegtes
                    // Ziel starten → sichtbares Wiggle beim Card-Morph.
                  }}
                >
                  <div
                    onClick={() => setActiveSlide(activeSlide === index ? null : index)}
                    style={{
                      transform: `scale(${innerScale})`,
                      transformOrigin:
                        slideStyles[index + 1]?.origin === 'right' ? 'right center' :
                        slideStyles[index + 1]?.origin === 'left' ? 'left center' :
                        'center center',
                      cursor: 'pointer',
                    }}
                  >
                    <SlideCategoryCard
                      category={cat}
                      parentSlug={parentSlug}
                      active={activeSlide !== null}

                      titleWidth={titleWidths[index]}
                    />
                  </div>

                  {/* Spark + Linien */}
                  {!isLast && (
                    <SliderEdgeSpark
                      sparkRef={(el) => hoverBox.registerSpark(index, el)}
                      wrapperStyle={{
                        position: 'absolute',
                        right: -CAT_GAP / 2 - 6,
                        top: '50%',
                        transform: `translateY(-50%) scale(${decoScale})`,
                        transformOrigin: 'center center',
                        opacity: decoOpacity,
                        // Keine CSS-transition (siehe Card-Wrapper oben)
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 5,
                        pointerEvents: 'none',
                      }}
                      topLineStyle={{ width: 1, height: activeSlide !== null ? 0 : 70, background: 'var(--fill-0, #334A27)', transition: `height ${MORPH_DURATION / 1000}s ${activeSlide !== null ? 'ease-in' : 'ease-out'} ${activeSlide !== null ? '0s' : `${MORPH_DURATION / 1000}s`}` }}
                      bottomLineStyle={{ width: 1, height: activeSlide !== null ? 0 : 70, background: 'var(--fill-0, #334A27)', transition: `height ${MORPH_DURATION / 1000}s ${activeSlide !== null ? 'ease-in' : 'ease-out'} ${activeSlide !== null ? '0s' : `${MORPH_DURATION / 1000}s`}` }}
                    />
                  )}

                  {hoverEnabled && (
                    <SliderHoverBox index={index} gap={CAT_GAP} register={hoverBox.registerBox} />
                  )}
                </div>
              );
            })}
            <div
              aria-hidden
              style={{
                // An `canScroll` (NICHT am verzögerten useStaticLayout) gekoppelt,
                // damit der Trailing-Spacer beim Rück-Morph KONSTANT bleibt (canScroll
                // springt synchron) und nur der Leading animiert — sonst springen beide
                // Spacer gleichzeitig an der Phasengrenze. Fits: flex-basis 0 + flex-grow 1
                // → nimmt nur den Rest-Platz (kein Overflow, letzte Card behält >40px Rand;
                // im zentrierten Card-Modus symmetrisch zum Leading). Slider: fixe 5vw rechts.
                flexGrow: !canScroll ? 1 : 0,
                flexShrink: 0,
                flexBasis: !canScroll ? 0 : '5vw',
                minWidth: 0,
                // Back-Restore: instant (sonst „wächst" der Trailing-Spacer animiert).
                transition: backOpen ? 'none' : `flex-grow ${MORPH_DURATION / 1000}s ease, flex-basis ${MORPH_DURATION / 1000}s ease`,
              }}
            />
          </div>
        </div>
        {/* Pill overlay — outside viewport so lines aren't clipped by overflow:hidden */}
        {sliderPill.renderPill()}
      </div>

      {/* Article Slider — absolut positioniert mit top:0. Der Slider-Content
          bleibt an fester Position am oberen Rand des Wrappers. Der Spacer
          daneben animiert die Layout-Höhe 0 → articleHeight parallel zum
          Category-Visual-Collapse und schiebt die Pagination nach unten.
          Kein overflow:hidden. */}
      <div style={{ position: 'relative' }}>
        {articleMounted && renderedSlide !== null && renderedPosts.length > 0 && (
          <div
            ref={articleRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              pointerEvents: phase1Visible ? 'auto' : 'none',
            }}
          >
            <ArticleSlider
              key={categories[renderedSlide].slug}
              persistKey={categories[renderedSlide].slug}
              posts={renderedPosts}
              onNavReady={handleArticleNavReady}
              onCanScrollChange={handleArticleCanScrollChange}
              phase1Visible={phase1Visible}
              phase2Visible={phase2Visible}
              categoryTransition={categoryTransition}
            />
          </div>
        )}
        {/* Spacer: animiert von 0 → articleHeight (natürliche Höhe via
            ResizeObserver gemessen) parallel zur Kategorie-Card-Höhen-Collapse. */}
        <div
          aria-hidden
          style={{
            height: phase1Visible ? articleHeight : 0,
            transition: backOpen ? 'none' : `height ${MORPH_DURATION / 1000}s ease`,
          }}
        />
      </div>

        {/* Edge-Gradients — links (auf Mobile via CSS gehidet) */}
        <div
          aria-hidden
          className="subcat-edge-left"
          style={{
            position: 'absolute',
            // 5px höher (−10 statt −5), damit die Hover-Pill oben nicht 2px überragt.
            top: -10,
            bottom: 0,
            left: 0,
            width: 150,
            background: 'linear-gradient(to right, var(--color-bg-page), transparent)',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        />
        {/* Edge-Gradients — rechts (Mobile-Width via CSS) */}
        <div
          aria-hidden
          className="subcat-edge-right"
          style={{
            position: 'absolute',
            // 5px höher, damit die Hover-Pill oben nicht 2px überragt.
            top: -10,
            bottom: 0,
            right: 0,
            width: 150,
            background: 'linear-gradient(to left, var(--color-bg-page), transparent)',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        />
      </div>

      {/* Shared SliderNav — immer gemountet, damit die Pfeile und Dots beim
          Wegfall der Sichtbarkeits-Bedingung smooth ausfahren (statt hart zu
          unmounten). `visible` steuert die Scale-Animation. */}
      <div className="subcat-nav-wrap">
        <SliderNav
          {...navProps}
          visible={navVisible}
        />
      </div>
    </section>
  );
}
