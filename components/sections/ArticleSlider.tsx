'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import SlideArticleCard, { CARD_MIN_WIDTH, CARD_MAX_WIDTH } from '@/components/ui/SlideArticleCard';
import SliderSafeZone from '@/components/ui/SliderSafeZone';
import type { Post } from '@/lib/types';
import { SliderPreviewContextProvider, type PreviewSliderContext } from '@/components/sections/ArticleSliderContext';

const ART_SLIDE_WIDTH = CARD_MIN_WIDTH;
const ART_GAP = 70;
// Breathing-Puffer für die fit-Prüfung (damit Slider nicht direkt bei
// 100% Content-Breite greift).
const ART_FIT_BUFFER = 40;
// Progressive Mount: bei vielen Posts (50+) blockiert ein Full-Mount aller
// SlideArticleCards den Frame nach Category-Switch (Stutter). Stattdessen
// erst N sichtbare Cards mounten, Rest in Batches via requestIdleCallback.
const INITIAL_MOUNT_COUNT = 8;
const MOUNT_BATCH_SIZE = 6;
// Höhe muss zur tatsächlichen Card-Höhe passen, sonst springt der via
// ResizeObserver gemessene articleHeight-Spacer beim Nachmounten.
const PLACEHOLDER_HEIGHT = 340;

interface ArticleSliderProps {
  posts: Post[];
  onNavReady: (nav: { current: number; total: number; onPrev: () => void; onNext: () => void; onGoTo: (i: number) => void }) => void;
  onCanScrollChange?: (canScroll: boolean) => void;
  phase1Visible?: boolean;
  phase2Visible?: boolean;
  categoryTransition?: 'idle' | 'out' | 'in';
}

const SPARK_DURATION = 0.3;

export default function ArticleSlider({ posts, onNavReady, onCanScrollChange, phase1Visible = true, phase2Visible = true, categoryTransition = 'idle' }: ArticleSliderProps) {
  // Mount-flip: beim ersten Mount rendert die Komponente mit mounted=false, sodass
  // das Visual bei scale(0) startet. Ein rAF flippt auf true → CSS-Transition zu
  // scale(1) läuft parallel zur Spacer-Höhe-Animation. Sonst würde das Visual auf
  // dem ersten Frame bereits bei scale(1) stehen und beim Öffnen "springen".
  const [mounted, setMounted] = useState(false);
  useLayoutEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Progressive Mount: erste N Cards sofort, Rest in Batches per Idle-Callback.
  // Reduziert den initial-Mount-Cost beim Category-Switch dramatisch (50 Cards
  // gleichzeitig mounten = sichtbarer Stutter; 8 + Batches = unsichtbar).
  const [mountedCount, setMountedCount] = useState(() =>
    Math.min(INITIAL_MOUNT_COUNT, posts.length)
  );
  useEffect(() => {
    if (mountedCount >= posts.length) return;
    // Ein Frame zwischen Batches — Browser kann painten, aber alles ist
    // nach wenigen Frames durch. Click-Frame bleibt unblockiert (das ist
    // der eigentliche Stutter-Fix); Staggering selbst ist unsichtbar weil
    // off-screen.
    const raf = requestAnimationFrame(() => {
      setMountedCount((c) => Math.min(c + MOUNT_BATCH_SIZE, posts.length));
    });
    return () => cancelAnimationFrame(raf);
  }, [mountedCount, posts.length]);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  const effectivePhase1 = mounted && phase1Visible;
  // Sparks + Linien: Timing an Phase 2 gekoppelt (Button-Breite ändert sich).
  // Card-Visuals bleiben weiter an Phase 1.
  const effectivePhase2 = mounted && phase2Visible;
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    dragFree: true,
    containScroll: 'trimSnaps',
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [slideStyles, setSlideStyles] = useState<{ opacity: number; scale: number; origin: 'left' | 'right' | 'center' }[]>([]);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  useEffect(() => {
    if (!emblaApi) return;
    const update = () => {
      setCanPrev(emblaApi.canScrollPrev());
      setCanNext(emblaApi.canScrollNext());
    };
    update();
    emblaApi.on('select', update);
    emblaApi.on('scroll', update);
    emblaApi.on('reInit', update);
    emblaApi.on('resize', update);
    return () => {
      emblaApi.off('select', update);
      emblaApi.off('scroll', update);
      emblaApi.off('reInit', update);
      emblaApi.off('resize', update);
    };
  }, [emblaApi]);

  // Wenn alle Cards (bei Minimum-Breite) in den Viewport passen, Slider
  // deaktivieren. Cards werden dann zentriert und wachsen bis CARD_MAX_WIDTH,
  // um die Breite auszunutzen.
  const [canScroll, setCanScroll] = useState(true);
  useEffect(() => {
    if (!emblaApi) return;
    const check = () => {
      // Layout: spacer + n cards + spacer → (n+2) Items, (n+1) Gaps.
      // Beide Spacer 5vw (symmetrisch).
      const spacerBasis = window.innerWidth * 0.05;
      const cards = posts.length * CARD_MIN_WIDTH;
      const gaps = (posts.length + 1) * ART_GAP;
      const needed = cards + gaps + 2 * spacerBasis + ART_FIT_BUFFER;
      const fits = window.innerWidth >= needed;
      setCanScroll(!fits);
      emblaApi.reInit({ watchDrag: !fits });
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [emblaApi, posts.length]);

  useEffect(() => {
    onCanScrollChange?.(canScroll);
  }, [canScroll, onCanScrollChange]);

  // Ref-Spiegel der slideStyles für Change-Detection (siehe SubcategorySlider).
  const slideStylesRef = useRef<typeof slideStyles>([]);
  useEffect(() => {
    if (!emblaApi) return;

    const slideCount = posts.length;
    const FADE_LEFT = 400;
    // Mobile: kürzere Right-Fade-Zone — auf Desktop bleibt 320 erhalten.
    const FADE_RIGHT = isMobile ? 200 : 320;
    // Overshoot: Fade-Strecke reicht FADE_OVERSHOOT Pixel über den Viewport-
    // Rand hinaus. Innere Grenze (voll sichtbar / Beginn Ausfaden) bleibt bei
    // FADE_LEFT/RIGHT; am Bildschirmrand ist die Card dadurch noch minimal
    // sichtbar statt komplett weg.
    const FADE_OVERSHOOT = isMobile ? 50 : 80;

    const update = () => {
      const progress = Math.max(0, Math.min(1, emblaApi.scrollProgress()));
      const idx = Math.round(progress * (slideCount - 1));
      const newIdx = Math.max(0, Math.min(slideCount - 1, idx));
      setSelectedIndex(newIdx);

      const rootNode = emblaApi.rootNode();
      const rootRect = rootNode.getBoundingClientRect();
      const slideNodes = emblaApi.slideNodes();

      let changed = false;
      const styles = slideNodes.map((node, i) => {
        const rect = node.getBoundingClientRect();
        const slideCenter = rect.left + rect.width / 2;
        const distFromLeft = slideCenter - rootRect.left;
        const distFromRight = rootRect.right - slideCenter;

        let s: { opacity: number; scale: number; origin: 'left' | 'right' | 'center' };
        if (!isMobile && distFromLeft < FADE_LEFT) {
          const t = Math.max(0, Math.min(1, (distFromLeft + FADE_OVERSHOOT) / (FADE_LEFT + FADE_OVERSHOOT)));
          const eased = t * (2 - t);
          s = { opacity: eased, scale: 0.6 + 0.4 * eased, origin: 'right' };
        } else if (distFromRight < FADE_RIGHT) {
          const t = Math.max(0, Math.min(1, (distFromRight + FADE_OVERSHOOT) / (FADE_RIGHT + FADE_OVERSHOOT)));
          const eased = t * (2 - t);
          s = { opacity: eased, scale: 0.6 + 0.4 * eased, origin: 'left' };
        } else {
          s = { opacity: 1, scale: 1, origin: 'center' };
        }

        // Change-Detection mit kleinen Toleranzen: bei dragFree-Slidern feuert
        // Embla 50-100× pro Sekunde "scroll", aber meistens ändert sich der
        // visuelle Style der einzelnen Cards minimal. Ohne diesen Check würde
        // setSlideStyles bei jedem Tick eine neue Array-Referenz setzen → React
        // re-rendert die ArticleSlider mit allen Cards. Auf Mobile mit vielen
        // Cards = Hauptthread-Backlog → wachsendes Tap-Delay.
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

    emblaApi.on('scroll', update);
    update();

    return () => { emblaApi.off('scroll', update); };
  }, [emblaApi, posts.length, isMobile]);

  // Push nav state up to parent
  useEffect(() => {
    if (!emblaApi) return;
    onNavReady({
      current: selectedIndex,
      total: posts.length,
      onPrev: () => emblaApi.scrollPrev(),
      onNext: () => emblaApi.scrollNext(),
      onGoTo: (i) => emblaApi.scrollTo(i),
    });
  }, [emblaApi, selectedIndex, posts.length, onNavReady]);

  // Card-lookup per index — emblaApi.slideNodes() enthält Leading-Spacer an Index 0,
  // daher liegt Card N bei slideNodes()[N + 1]. Wir suchen die Card-Wurzel mit data-flip-id.
  const getCardEl = useCallback(
    (index: number): HTMLElement | null => {
      if (!emblaApi) return null;
      const nodes = emblaApi.slideNodes();
      const wrapper = nodes[index + 1]; // +1 wegen Leading-Spacer
      if (!wrapper) return null;
      const card = wrapper.querySelector<HTMLElement>('[data-flip-id$="-box"]');
      return card;
    },
    [emblaApi]
  );

  const previewCtx = useMemo<PreviewSliderContext>(
    () => ({ posts, emblaApi: emblaApi ?? null, getCardEl }),
    [posts, emblaApi, getCardEl]
  );

  return (
    <SliderPreviewContextProvider value={previewCtx}>
    <div ref={emblaRef} style={{ cursor: canScroll ? 'grab' : 'default', marginTop: 30, position: 'relative' }}>
      <div style={{
        display: 'flex',
        gap: `${ART_GAP}px`,
      }}>
        <div
          aria-hidden
          style={{
            // Beide Spacer fix auf 5vw. Cards absorbieren den Rest über ihre
            // eigene flex-grow bis max 450 — symmetrisch und minimal.
            // Mobile: Leading-Spacer entfällt (flexBasis 0), Cards starten am
            // linken Rand und sliden nur von rechts ein.
            flexGrow: 0,
            flexShrink: 0,
            flexBasis: isMobile ? 0 : '5vw',
            minWidth: 0,
          }}
        />
        {posts.map((post, index) => {
          const isLast = index === posts.length - 1;
          const isMountedCard = index < mountedCount;
          return (
            <div
              key={post.id}
              style={{
                // Static-Mode: Cards wachsen bis max 450px, danach absorbiert
                // der Trailing-Spacer den Rest (linksbündig).
                // Slider-Mode: fix auf 265px.
                flexGrow: canScroll ? 0 : 1,
                flexShrink: 0,
                flexBasis: `${ART_SLIDE_WIDTH}px`,
                maxWidth: CARD_MAX_WIDTH,
                minWidth: 0,
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                opacity: slideStyles[index + 1]?.opacity ?? 1,
                // Mobile: keine CSS-Transition für opacity — Embla feuert
                // Scroll-Events pro Frame; eine 0.1s-Transition würde bei
                // jedem Update einen neuen Tween gegen ein bewegtes Ziel
                // starten → sichtbares Wiggle/Größen-Springen auf iPhone.
                // (Gleiche Logik wie im SubcategorySlider.)
                transition: categoryTransition === 'in'
                  ? 'opacity 0.1s ease'
                  : isMobile
                  ? 'flex-grow 0.3s ease'
                  : 'flex-grow 0.3s ease, opacity 0.1s ease',
              }}
            >
              {isMountedCard ? (
                <div style={{
                  width: '100%',
                  transform: `scale(${slideStyles[index + 1]?.scale ?? 1})`,
                  transformOrigin:
                    slideStyles[index + 1]?.origin === 'right' ? 'right center' :
                    slideStyles[index + 1]?.origin === 'left' ? 'left center' :
                    'center center',
                  transition: categoryTransition === 'in' || isMobile ? 'none' : 'transform 0.1s ease',
                }}>
                  <SlideArticleCard post={post} index={index} phase1Visible={effectivePhase1} phase2Visible={effectivePhase2} categoryTransition={categoryTransition} />
                </div>
              ) : (
                // Placeholder bewahrt Slide-Höhe bis die Card via Idle-Callback
                // nachgemountet wird. Höhe muss zur tatsächlichen Card-Höhe
                // passen, sonst springt der ResizeObserver-gemessene
                // articleHeight-Spacer beim Nachmounten.
                <div aria-hidden style={{ width: '100%', height: PLACEHOLDER_HEIGHT, flexShrink: 0 }} />
              )}

              {!isLast && isMountedCard && (
                <div style={{
                  position: 'absolute',
                  right: -ART_GAP / 2 - 6,
                  top: '50%',
                  transform: `translateY(-50%) scale(${Math.min(slideStyles[index + 1]?.scale ?? 1, slideStyles[index + 2]?.scale ?? 1)})`,
                  transformOrigin: 'center center',
                  opacity: Math.min(slideStyles[index + 1]?.opacity ?? 1, slideStyles[index + 2]?.opacity ?? 1),
                  transition: isMobile ? 'none' : 'opacity 0.1s ease, transform 0.1s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 5,
                  pointerEvents: 'none',
                }}>
                  <div style={{
                    width: 1,
                    height: effectivePhase2 ? 70 : 0,
                    background: 'var(--fill-0, #334A27)',
                    transformOrigin: 'center bottom',
                    transform: categoryTransition === 'out' ? 'scaleY(0)' : 'scaleY(1)',
                    transition: categoryTransition === 'out'
                      ? 'transform 0.2s ease-in'
                      : categoryTransition === 'in'
                      ? 'height 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                      : `height ${SPARK_DURATION}s ease`,
                  }} />
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12.0005"
                    fill="none"
                    aria-hidden
                    style={{
                      transform: categoryTransition === 'out'
                        ? 'scale(0) rotate(90deg)'
                        : (categoryTransition === 'in' && !effectivePhase2)
                        ? 'scale(0) rotate(-90deg)'
                        : effectivePhase2 ? 'scale(1)' : 'scale(0)',
                      transformOrigin: 'center',
                      transition: categoryTransition === 'out'
                        ? 'transform 0.2s ease-in'
                        : categoryTransition === 'in'
                        ? 'transform 0.2s ease-out'
                        : `transform ${SPARK_DURATION}s ease`,
                    }}
                  >
                    <path d="M12 6.00047C10.3384 5.64978 8.28716 5.41362 7.24241 3.91374C6.47491 2.81169 6.27276 1.28871 6.00024 0.000471365C5.61861 1.71435 5.40087 3.79684 3.79407 4.83384C2.69548 5.54325 1.25351 5.72142 0 6.01226C1.28705 6.29225 2.79561 6.48692 3.89751 7.25194C5.4174 8.30686 5.61672 10.3366 6.00024 12.0005C6.17594 11.1204 6.33322 10.2272 6.62463 9.37638C7.27878 7.46453 8.37832 6.85223 10.2643 6.37379L12 6.00047Z" fill="var(--fill-0, #334A27)"/>
                  </svg>
                  <div style={{
                    width: 1,
                    height: effectivePhase2 ? 70 : 0,
                    background: 'var(--fill-0, #334A27)',
                    transformOrigin: 'center top',
                    transform: categoryTransition === 'out' ? 'scaleY(0)' : 'scaleY(1)',
                    transition: categoryTransition === 'out'
                      ? 'transform 0.2s ease-in'
                      : categoryTransition === 'in'
                      ? 'height 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                      : `height ${SPARK_DURATION}s ease`,
                  }} />
                </div>
              )}
            </div>
          );
        })}
        <div
          aria-hidden
          style={{
            // Trailing bleibt fix (5vw) — Leading wächst und schiebt die
            // Cards nach rechts.
            flexGrow: 0,
            flexShrink: 0,
            flexBasis: '5vw',
            minWidth: 0,
          }}
        />
      </div>
      {/* Safe-Zones links/rechts — blocken Hover/Klick auf Cards; PointerDown
          bubbelt zum Embla-Viewport, Drag funktioniert weiter. */}
      <SliderSafeZone
        direction="left"
        scrollable={canScroll && canPrev}
        onClick={() => emblaApi?.scrollPrev()}
      />
      <SliderSafeZone
        direction="right"
        scrollable={canScroll && canNext}
        onClick={() => emblaApi?.scrollNext()}
      />
    </div>
    </SliderPreviewContextProvider>
  );
}
