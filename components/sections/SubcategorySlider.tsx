'use client';

import { useEffect, useLayoutEffect, useState, useCallback, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import SlideCategoryCard, { type CategorySlide } from '@/components/ui/SlideCategoryCard';
import SliderNav from '@/components/ui/SliderNav';
import SliderSafeZone from '@/components/ui/SliderSafeZone';
import ArticleSlider from '@/components/sections/ArticleSlider';
import { useSliderPill } from '@/hooks/useSliderPill';
import type { Post } from '@/lib/types';

const CAT_GAP = 65;
const CARD_WIDTH = 360;
export const MORPH_DURATION = 300; // ms — muss zu T1 in SlideCategoryCard passen

// ── Main SubcategorySlider ──

interface SubcategorySliderProps {
  categories: CategorySlide[];
  parentSlug: string;
  allCategoryPosts?: Record<string, Post[]>;
}

export default function SubcategorySlider({ categories, parentSlug, allCategoryPosts = {} }: SubcategorySliderProps) {
  const [catEmblaRef, catEmblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    dragFree: true,
    containScroll: 'trimSnaps',
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [slideStyles, setSlideStyles] = useState<{ opacity: number; scale: number; origin: 'left' | 'right' | 'center' }[]>([]);
  const [activeSlide, setActiveSlide] = useState<number | null>(null);

  // Measure all title widths for pill lens + SlideCategoryCard
  const [titleWidths, setTitleWidths] = useState<number[]>([]);
  useEffect(() => {
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

  // Behalte die zuletzt aktive Kategorie während der Schließen-Animation,
  // damit die Cards/Posts bis zum Ende der Ausblend-Animation weiter gerendert
  // werden können.
  const lastActiveRef = useRef<number | null>(null);
  useEffect(() => {
    if (activeSlide !== null) lastActiveRef.current = activeSlide;
  }, [activeSlide]);
  const renderedSlide = activeSlide ?? lastActiveRef.current;
  const renderedPosts = renderedSlide !== null
    ? (allCategoryPosts[categories[renderedSlide]?.slug] || [])
    : [];

  // 2-Phasen-Animation für Artikel-Slider
  // Phase 1: Sparks/Linien/Artikel-Visuals (parallel zum Card-Visual-Collapse)
  // Phase 2: Artikel-Text (parallel zur Card-Breiten-Änderung)
  const [phase1Visible, setPhase1Visible] = useState(false);
  const [phase2Visible, setPhase2Visible] = useState(false);
  const [articleMounted, setArticleMounted] = useState(false);
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
  const [fullyOpen, setFullyOpen] = useState(false);
  useEffect(() => {
    if (activeSlide !== null) {
      const startMorph = () => {
        setArticleMounted(true);
        setPhase1Visible(true);
      };
      // Pre-scroll: NUR wenn der Slider gerade scrollbar ist UND der Button-
      // Mode NICHT scrollbar sein wird (fits=true nach Morph). In dem Fall
      // muss der Scroll auf 0, sonst gibt's am Ende einen Snap. Wenn
      // Button-Mode auch scrollbar bleibt, kein Pre-scroll — User behält
      // seine Scroll-Position.
      const buttonFits = (() => {
        if (titleWidths.length !== categories.length) return false;
        const spacerBasis = window.innerWidth * 0.05;
        const gaps = (categories.length + 1) * CAT_GAP;
        const buttonContentWidth = titleWidths.reduce((a, b) => a + b, 0);
        const needed = buttonContentWidth + gaps + 2 * spacerBasis + 40;
        return window.innerWidth >= needed;
      })();
      const needsPreScroll = buttonFits && !!catEmblaApi?.canScrollPrev();
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
      setFullyOpen(false);
      setPhase2Visible(false);
      const t1 = setTimeout(() => setPhase1Visible(false), MORPH_DURATION);
      const t2 = setTimeout(() => setArticleMounted(false), MORPH_DURATION * 2 + 50);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [activeSlide, catEmblaApi]);

  // Category scroll tracking
  const slideStylesRef = useRef<{ opacity: number; scale: number; origin: 'left' | 'right' | 'center' }[]>([]);
  // Vorheriger Mode (button vs card) zur Erkennung von echten Mode-Wechseln.
  // Category-Wechsel (X → Y, beide non-null) ist KEIN Mode-Wechsel → FADE-
  // Params nicht interpolieren (sonst springt der erste Button).
  const prevActiveModeRef = useRef<boolean>(false);

  useEffect(() => {
    if (!catEmblaApi) return;

    const slideCount = categories.length;
    // FADE-Params: volle Werte für Card- und Button-Mode. Während Morph
    // (MORPH_DURATION * 2) werden sie linear zwischen den Modes interpoliert,
    // damit die Scale der ersten/letzten Card nicht instant springt bei
    // Mode-Wechsel.
    const CARD_PARAMS = { left: 400, right: 320, scaleMin: 0.2, overshoot: 150 };
    const BTN_PARAMS = { left: 260, right: 200, scaleMin: 0, overshoot: 40 };
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
        if (distFromLeft < FADE_LEFT) {
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
  }, [catEmblaApi, categories.length, activeSlide]);

  // Reset article nav when closing
  // Delayed phase2 for spacer width (synced with card phase2)
  const [spacerExpanded, setSpacerExpanded] = useState(false);
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
      const spacerBasis = window.innerWidth * 0.05;
      const gaps = (categories.length + 1) * CAT_GAP;
      const contentWidth =
        activeSlide !== null && titleWidths.length === categories.length
          ? titleWidths.reduce((a, b) => a + b, 0)
          : categories.length * CARD_WIDTH;
      const needed = contentWidth + gaps + 2 * spacerBasis + 40;
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
    onClose: () => setActiveSlide(null),
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
      {/* Category Slider — wrapper for pill overlay */}
      <div style={{ position: 'relative' }}>
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
            onMouseLeave={morphLock ? undefined : sliderPill.handleContainerLeave}
            style={{ display: 'flex', gap: `${CAT_GAP}px` }}
          >
            <div
              aria-hidden
              style={{
                // Leading Spacer bleibt klein (linksbündig) — nur Trailing wächst.
                flexGrow: 0,
                flexShrink: 0,
                flexBasis: spacerExpanded ? 'calc(5vw + 23px)' : '5vw',
                minWidth: 0,
                transition: `flex-basis ${MORPH_DURATION / 1000}s ease`,
              }}
            />
            {categories.map((cat, index) => {
              const isLast = index === categories.length - 1;

              return (
                <div
                  key={cat.slug}
                  ref={(el) => { if (el) sliderPill.cardRefs.current[index] = el; }}
                  style={{
                    flex: '0 0 auto',
                    minWidth: 0,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: slideStyles[index + 1]?.opacity ?? 1,
                    // KEINE CSS-transition — die RAF-Loop in update() setzt
                    // slideStyles pro Frame neu. Eine 0.3s-Transition würde
                    // bei jedem Update einen neuen Tween gegen ein bewegtes
                    // Ziel starten → sichtbares Wiggle beim Card-Morph.
                  }}
                >
                  <div
                    onClick={() => setActiveSlide(activeSlide === index ? null : index)}
                    style={{
                      transform: `scale(${slideStyles[index + 1]?.scale ?? 1})`,
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
                      selected={activeSlide === index}
                      titleWidth={titleWidths[index]}
                    />
                  </div>

                  {/* Spark + Linien */}
                  {!isLast && (
                    <div style={{
                      position: 'absolute',
                      right: -CAT_GAP / 2 - 6,
                      top: '50%',
                      transform: `translateY(-50%) scale(${Math.min(slideStyles[index + 1]?.scale ?? 1, slideStyles[index + 2]?.scale ?? 1)})`,
                      transformOrigin: 'center center',
                      opacity: Math.min(slideStyles[index + 1]?.opacity ?? 1, slideStyles[index + 2]?.opacity ?? 1),
                      // Keine CSS-transition (siehe Card-Wrapper oben)
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 5,
                      pointerEvents: 'none',
                    }}>
                      <div style={{ width: 1, height: activeSlide !== null ? 0 : 70, background: 'var(--fill-0, #334A27)', transition: `height ${MORPH_DURATION / 1000}s ${activeSlide !== null ? 'ease-in' : 'ease-out'} ${activeSlide !== null ? '0s' : `${MORPH_DURATION / 1000}s`}` }} />
                      <svg width="12" height="12" viewBox="0 0 12 12.0005" fill="none" aria-hidden>
                        <path d="M12 6.00047C10.3384 5.64978 8.28716 5.41362 7.24241 3.91374C6.47491 2.81169 6.27276 1.28871 6.00024 0.000471365C5.61861 1.71435 5.40087 3.79684 3.79407 4.83384C2.69548 5.54325 1.25351 5.72142 0 6.01226C1.28705 6.29225 2.79561 6.48692 3.89751 7.25194C5.4174 8.30686 5.61672 10.3366 6.00024 12.0005C6.17594 11.1204 6.33322 10.2272 6.62463 9.37638C7.27878 7.46453 8.37832 6.85223 10.2643 6.37379L12 6.00047Z" fill="var(--fill-0, #334A27)"/>
                      </svg>
                      <div style={{ width: 1, height: activeSlide !== null ? 0 : 70, background: 'var(--fill-0, #334A27)', transition: `height ${MORPH_DURATION / 1000}s ${activeSlide !== null ? 'ease-in' : 'ease-out'} ${activeSlide !== null ? '0s' : `${MORPH_DURATION / 1000}s`}` }} />
                    </div>
                  )}
                </div>
              );
            })}
            <div
              aria-hidden
              style={{
                flexGrow: useStaticLayout ? 1 : 0,
                flexShrink: 0,
                flexBasis: '5vw', // dauerhaft 5vw — Button-Mode endet rechts wie Card-Mode
                minWidth: 0,
                transition: `flex-grow ${MORPH_DURATION / 1000}s ease`,
              }}
            />
          </div>
          {/* Safe-Zones links/rechts — blocken Hover/Klick auf Cards; PointerDown
              bubbelt zum Embla-Viewport, Drag funktioniert weiter. */}
          <SliderSafeZone
            direction="left"
            scrollable={canScroll && canPrev}
            onClick={() => catEmblaApi?.scrollPrev()}
          />
          <SliderSafeZone
            direction="right"
            scrollable={canScroll && canNext}
            onClick={() => catEmblaApi?.scrollNext()}
          />
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
              posts={renderedPosts}
              onNavReady={handleArticleNavReady}
              onCanScrollChange={handleArticleCanScrollChange}
              phase1Visible={phase1Visible}
              phase2Visible={phase2Visible}
            />
          </div>
        )}
        {/* Spacer: animiert von 0 → articleHeight (natürliche Höhe via
            ResizeObserver gemessen) parallel zur Kategorie-Card-Höhen-Collapse. */}
        <div
          aria-hidden
          style={{
            height: phase1Visible ? articleHeight : 0,
            transition: `height ${MORPH_DURATION / 1000}s ease`,
          }}
        />
      </div>

        {/* Edge-Gradients — links */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: 150,
            background: 'linear-gradient(to right, var(--color-bg-page), transparent)',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        />
        {/* Edge-Gradients — rechts */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
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
      <div style={{ padding: '0 clamp(20px, 10vw, 200px)', marginTop: 23 }}>
        <SliderNav
          {...navProps}
          visible={(canScroll && !isArticleMode) || (isArticleMode && articleCanScroll)}
        />
      </div>
    </section>
  );
}
