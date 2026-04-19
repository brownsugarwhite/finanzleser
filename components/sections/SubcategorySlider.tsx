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
  const [slideStyles, setSlideStyles] = useState<{ opacity: number; scale: number }[]>([]);
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

  const activePosts = activeSlide !== null
    ? allCategoryPosts[categories[activeSlide]?.slug] || []
    : [];

  const isArticleMode = activeSlide !== null && activePosts.length > 0;

  // Category scroll tracking
  const slideStylesRef = useRef<{ opacity: number; scale: number }[]>([]);

  useEffect(() => {
    if (!catEmblaApi) return;

    const slideCount = categories.length;
    const FADE_LEFT = activeSlide !== null ? 120 : 250;
    const FADE_RIGHT = activeSlide !== null ? 100 : 200;
    const SCALE_MIN = activeSlide !== null ? 0.2 : 0.6;
    const FULL = { opacity: 1, scale: 1 };

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
          const eased = t * t * (3 - 2 * t);
          s = { opacity: eased, scale: SCALE_MIN + (1 - SCALE_MIN) * eased };
        } else if (distFromRight < FADE_RIGHT) {
          const t = Math.max(0, distFromRight / FADE_RIGHT);
          const eased = t * t * (3 - 2 * t);
          s = { opacity: eased, scale: SCALE_MIN + (1 - SCALE_MIN) * eased };
        }

        const prev = slideStylesRef.current[i];
        if (!prev || Math.abs(prev.opacity - s.opacity) > 0.01 || Math.abs(prev.scale - s.scale) > 0.005) {
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

  // Detect if all cards fit in viewport (without spacers) — no slider needed
  const [canScroll, setCanScroll] = useState(true);
  useEffect(() => {
    if (!catEmblaApi) return;
    const totalContent = categories.length * CARD_WIDTH + Math.max(0, categories.length - 1) * CAT_GAP;
    const check = () => {
      const fits = window.innerWidth >= totalContent + 40; // +40px breathing room
      setCanScroll(!fits);
      catEmblaApi.reInit({ watchDrag: !fits });
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [catEmblaApi, categories.length]);

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

  const useStaticLayout = !canScroll && staticLayout;

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
                flexGrow: useStaticLayout ? 1 : 0,
                flexShrink: 0,
                flexBasis: useStaticLayout
                  ? '5vw'
                  : (spacerExpanded ? 'calc(5vw + 23px)' : '5vw'),
                minWidth: 0,
                transition: 'flex-grow 0.3s ease, flex-basis 0.3s ease',
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
                    transition: 'opacity 0.3s ease',
                  }}
                >
                  <div
                    onClick={() => setActiveSlide(activeSlide === index ? null : index)}
                    style={{
                      transform: `scale(${slideStyles[index + 1]?.scale ?? 1})`,
                      transition: 'transform 0.3s ease',
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
                      transition: 'opacity 0.3s ease, transform 0.3s ease',
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
                flexBasis: useStaticLayout
                  ? '5vw'
                  : (spacerExpanded ? '18vw' : '5vw'),
                minWidth: 0,
                transition: 'flex-grow 0.3s ease, flex-basis 0.3s ease',
              }}
            />
          </div>
        </div>
        {/* Pill overlay — outside viewport so lines aren't clipped by overflow:hidden */}
        {sliderPill.renderPill()}
      </div>

      {/* Article Slider — key forces fresh Embla per category */}
      {isArticleMode && (
        <ArticleSlider
          key={categories[activeSlide!].slug}
          posts={activePosts}
          onNavReady={handleArticleNavReady}
        />
      )}

      {/* Shared SliderNav — nur wenn scrollbar oder Article-Mode */}
      {(canScroll || isArticleMode) && (
        <div style={{ padding: '0 clamp(20px, 10vw, 200px)', marginTop: 23 }}>
          <SliderNav {...navProps} />
        </div>
      )}
    </section>
  );
}
