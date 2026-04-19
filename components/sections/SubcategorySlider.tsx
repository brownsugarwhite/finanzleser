'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import SlideCategoryCard, { type CategorySlide } from '@/components/ui/SlideCategoryCard';
import SliderNav from '@/components/ui/SliderNav';
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

  const activePosts = activeSlide !== null
    ? allCategoryPosts[categories[activeSlide]?.slug] || []
    : [];

  const isArticleMode = activeSlide !== null && activePosts.length > 0;

  // Category scroll tracking
  const slideStylesRef = useRef<{ opacity: number; scale: number; origin: 'left' | 'right' | 'center' }[]>([]);

  useEffect(() => {
    if (!catEmblaApi) return;

    const slideCount = categories.length;
    const FADE_LEFT = activeSlide !== null ? 120 : 250;
    const FADE_RIGHT = activeSlide !== null ? 100 : 200;
    const SCALE_MIN = activeSlide !== null ? 0.2 : 0.6;
    const FULL: { opacity: number; scale: number; origin: 'left' | 'right' | 'center' } = { opacity: 1, scale: 1, origin: 'center' };

    const update = () => {
      const progress = Math.max(0, Math.min(1, catEmblaApi.scrollProgress()));
      const idx = Math.max(0, Math.min(slideCount - 1, Math.round(progress * (slideCount - 1))));
      setSelectedIndex(idx);

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
          const t = Math.max(0, distFromLeft / FADE_LEFT);
          const eased = t * (2 - t); // ease-out quadratic
          // Card am linken Rand → Origin rechts (Abstand zum nächsten inneren Nachbarn bleibt konstant)
          s = { opacity: eased, scale: SCALE_MIN + (1 - SCALE_MIN) * eased, origin: 'right' };
        } else if (distFromRight < FADE_RIGHT) {
          const t = Math.max(0, distFromRight / FADE_RIGHT);
          const eased = t * (2 - t); // ease-out quadratic
          // Card am rechten Rand → Origin links
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

    // Während des Morphs (T1 + T2) jeden Frame neu messen, da sich Card-Breiten
    // über CSS-Transitions ändern. RAF statt setInterval — sauberer Tick-Rhythmus.
    let rafId = 0;
    let cancelled = false;
    const morphEndsAt = performance.now() + MORPH_DURATION * 2 + 50;
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
      const t = setTimeout(() => setSpacerExpanded(true), 300); // T1 = 0.3s
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
  useEffect(() => {
    if (!catEmblaApi) return;
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
      // reInit nur wenn sich der Scroll-Status tatsächlich ändert —
      // sonst springt der Scroll-Position bei Active→Active-Wechseln.
      if (prevFitsRef.current !== fits) {
        prevFitsRef.current = fits;
        catEmblaApi.reInit({ watchDrag: !fits });
      }
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
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
    slideStyles,
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
    <section style={{ width: '100%', overflow: 'hidden', padding: '40px 0' }}>
      {/* Slider-Stack mit Edge-Gradients (liegt über beiden Slidern + Pill) */}
      <div style={{ position: 'relative' }}>
      {/* Category Slider — wrapper for pill overlay */}
      <div style={{ position: 'relative' }}>
        <div
          ref={catEmblaRef}
          onMouseMove={morphLock ? undefined : sliderPill.handleContainerMove}
          onMouseLeave={morphLock ? undefined : sliderPill.handleContainerLeave}
          style={{
            overflow: 'hidden',
            cursor: canScroll ? 'grab' : 'default',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', gap: `${CAT_GAP}px` }}>
            <div
              aria-hidden
              style={{
                // Leading Spacer bleibt klein (linksbündig) — nur Trailing wächst.
                flexGrow: 0,
                flexShrink: 0,
                flexBasis: spacerExpanded ? 'calc(5vw + 23px)' : '5vw',
                minWidth: 0,
                transition: 'flex-basis 0.3s ease',
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
                      onClose={() => setActiveSlide(null)}
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
                      <div style={{ width: 1, height: activeSlide !== null ? 0 : 70, background: 'var(--fill-0, #334A27)', transition: `height 0.3s ${activeSlide !== null ? 'ease-in' : 'ease-out'} ${activeSlide !== null ? '0s' : '0.3s'}` }} />
                      <svg width="12" height="12" viewBox="0 0 12 12.0005" fill="none" aria-hidden>
                        <path d="M12 6.00047C10.3384 5.64978 8.28716 5.41362 7.24241 3.91374C6.47491 2.81169 6.27276 1.28871 6.00024 0.000471365C5.61861 1.71435 5.40087 3.79684 3.79407 4.83384C2.69548 5.54325 1.25351 5.72142 0 6.01226C1.28705 6.29225 2.79561 6.48692 3.89751 7.25194C5.4174 8.30686 5.61672 10.3366 6.00024 12.0005C6.17594 11.1204 6.33322 10.2272 6.62463 9.37638C7.27878 7.46453 8.37832 6.85223 10.2643 6.37379L12 6.00047Z" fill="var(--fill-0, #334A27)"/>
                      </svg>
                      <div style={{ width: 1, height: activeSlide !== null ? 0 : 70, background: 'var(--fill-0, #334A27)', transition: `height 0.3s ${activeSlide !== null ? 'ease-in' : 'ease-out'} ${activeSlide !== null ? '0s' : '0.3s'}` }} />
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
                transition: 'flex-grow 0.3s ease',
              }}
            />
          </div>
        </div>
        {/* Pill overlay — outside viewport so lines aren't clipped by overflow:hidden */}
        {sliderPill.renderPill()}

        {/* Prev/Next Arrows im Button-Mode (über dem Gradient) */}
        {activeSlide !== null && canScroll && (
          <>
            <button
              type="button"
              aria-label="Vorherige Kategorie"
              onClick={() => catEmblaApi?.scrollPrev()}
              style={{
                position: 'absolute',
                top: '50%',
                left: 15,
                transform: 'translateY(calc(-50% - 5px))',
                width: 30,
                height: 30,
                borderRadius: '50%',
                border: '1px solid var(--color-text-primary)',
                background: 'rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                cursor: canPrev ? 'pointer' : 'default',
                opacity: canPrev ? 1 : 0,
                pointerEvents: canPrev ? 'auto' : 'none',
                transition: 'opacity 0.2s ease',
                zIndex: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
            >
              <svg width="10" height="10" viewBox="0 0 17.45 15.77" fill="none" aria-hidden>
                <polyline
                  points="16.95 15.27 8.27 8.11 16.95 .5"
                  stroke="var(--color-text-primary)"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Nächste Kategorie"
              onClick={() => catEmblaApi?.scrollNext()}
              style={{
                position: 'absolute',
                top: '50%',
                right: 15,
                transform: 'translateY(calc(-50% - 5px))',
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: '1px solid var(--color-text-primary)',
                background: 'rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                cursor: canNext ? 'pointer' : 'default',
                opacity: canNext ? 1 : 0,
                pointerEvents: canNext ? 'auto' : 'none',
                transition: 'opacity 0.2s ease',
                zIndex: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
            >
              <svg width="10" height="10" viewBox="0 0 17.45 15.77" fill="none" aria-hidden style={{ transform: 'rotate(180deg)' }}>
                <polyline
                  points="16.95 15.27 8.27 8.11 16.95 .5"
                  stroke="var(--color-text-primary)"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Article Slider — key forces fresh Embla per category */}
      {isArticleMode && (
        <ArticleSlider
          key={categories[activeSlide!].slug}
          posts={activePosts}
          onNavReady={handleArticleNavReady}
          onCanScrollChange={handleArticleCanScrollChange}
        />
      )}

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

      {/* Shared SliderNav — nur wenn Category- ODER Article-Slider scrollbar */}
      {((canScroll && !isArticleMode) || (isArticleMode && articleCanScroll)) && (
        <div style={{ padding: '0 clamp(20px, 10vw, 200px)', marginTop: 23 }}>
          <SliderNav {...navProps} />
        </div>
      )}
    </section>
  );
}
