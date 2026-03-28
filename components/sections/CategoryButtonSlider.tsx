'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import type { CategorySlide } from '@/components/ui/SlideCategoryCard';

const GAP_FULL = 22;
const GAP_SHRUNK = 3;

function easeIn(t: number): number { return t * t; }

function easeProgress(progress: number): { t1: number; t2: number; phase: 'first' | 'second' } {
  const p = Math.max(0, Math.min(1, progress));
  if (p <= 0.5) {
    return { t1: easeIn(p / 0.5), t2: 0, phase: 'first' };
  }
  return { t1: 1, t2: easeIn((p - 0.5) / 0.5), phase: 'second' };
}

// --- Text measurement ---
let _canvas: HTMLCanvasElement | null = null;
function measureTextWidth(text: string): number {
  if (!_canvas) _canvas = document.createElement('canvas');
  const ctx = _canvas.getContext('2d')!;
  ctx.font = '600 17px Merriweather, serif';
  return Math.ceil(ctx.measureText(text).width) + 40;
}

// --- Progress thresholds (no reset — buttons stay gone at edges) ---
const THRESHOLD_FULL_RATIO = 0.2;
const THRESHOLD_SMALL_RATIO = 0.6;

function calculateProgress(distance: number, viewportWidth: number): number {
  const thresholdFull = viewportWidth * THRESHOLD_FULL_RATIO;
  const thresholdSmall = viewportWidth * THRESHOLD_SMALL_RATIO;
  if (distance <= thresholdFull) return 0;
  if (distance >= thresholdSmall) return 1;
  return (distance - thresholdFull) / (thresholdSmall - thresholdFull);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function patchLimit(limit: any, newMin: number) {
  limit.min = newMin;
  limit.length = Math.abs(limit.max - newMin);
  limit.reachedMin = (n: number) => n < newMin;
  limit.reachedAny = (n: number) => n < newMin || n > limit.max;
  limit.constrain = (n: number) => {
    if (n < newMin) return newMin;
    if (n > limit.max) return limit.max;
    return n;
  };
}

// --- Button interpolation ---
const CIRCLE_SIZE = 42;

// Width for layout calculations — circle stays at CIRCLE_SIZE in phase 2 (scale is visual only)
function getButtonWidth(progress: number, slotWidth: number): number {
  const { t1, phase } = easeProgress(progress);
  if (phase === 'first') return lerp(slotWidth, CIRCLE_SIZE, t1);
  return CIRCLE_SIZE; // phase 2: DOM size stays fixed, only scale changes
}

function getButtonStyle(progress: number, slotWidth: number) {
  const { t1, t2, phase } = easeProgress(progress);
  const rawP = Math.max(0, Math.min(1, progress));

  if (phase === 'first') {
    const rawT = rawP / 0.5;
    const contentOpacity = rawT < 0.3 ? 1 : lerp(1, 0, (rawT - 0.3) / 0.7);
    return {
      width: lerp(slotWidth, CIRCLE_SIZE, t1),
      height: CIRCLE_SIZE,
      radius: lerp(17, CIRCLE_SIZE / 2, t1),
      bgAlpha: 0.10,
      scale: 1,
      opacity: 1,
      contentOpacity,
    };
  }
  // t2 goes 0→1, but we want to reach 8px and opacity 0 at t2=0.5
  const t2Fast = Math.min(1, t2 * 8);
  const targetScale = 8 / CIRCLE_SIZE; // 8px / 42px
  return {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    radius: CIRCLE_SIZE / 2,
    bgAlpha: 0.15,
    scale: lerp(1, targetScale, t2Fast),
    opacity: lerp(1, 0, t2Fast),
    contentOpacity: 0,
  };
}

// --- Component ---

interface CategoryButtonSliderProps {
  categories: CategorySlide[];
}

export default function CategoryButtonSlider({ categories }: CategoryButtonSliderProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'center',
    loop: false,
    dragFree: true,
    duration: 25,
  });

  const [activeIndex, setActiveIndex] = useState<number | null>(0);
  const [slotWidths, setSlotWidths] = useState<number[]>([]);
  const [slideProgresses, setSlideProgresses] = useState<number[]>([]);
  const [slideDirections, setSlideDirections] = useState<number[]>([]); // -1 left, +1 right
  const [isReady, setIsReady] = useState(false);
  const rafRef = useRef<number>(0);
  const originalLimitMin = useRef<number | null>(null);
  const frozenMin = useRef<number | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const isDragRef = useRef(false);

  // Measure text widths after fonts load
  useEffect(() => {
    document.fonts.ready.then(() => {
      setSlotWidths(categories.map(cat => measureTextWidth(cat.name)));
    });
  }, [categories]);

  const updateProgress = useCallback(() => {
    if (!emblaApi || slotWidths.length === 0) return;

    const engine = emblaApi.internalEngine();
    const slideNodes = emblaApi.slideNodes();
    const rootNode = emblaApi.rootNode();
    const rootRect = rootNode.getBoundingClientRect();
    const viewportCenter = rootRect.width / 2;

    const newProgresses: number[] = [];
    const newDirections: number[] = [];
    slideNodes.forEach((node) => {
      const rect = node.getBoundingClientRect();
      const slideCenter = rect.left - rootRect.left + rect.width / 2;
      const signedDist = slideCenter - viewportCenter;
      newProgresses.push(calculateProgress(Math.abs(signedDist), rootRect.width));
      newDirections.push(signedDist >= 0 ? 1 : -1);
    });

    setSlideProgresses(newProgresses);
    setSlideDirections(newDirections);

    // --- Limit patching ---
    if (originalLimitMin.current === null) {
      originalLimitMin.current = engine.limit.min;
    }

    let cumulativeTx = 0;
    for (let i = 1; i < newProgresses.length; i++) {
      const swPrev = slotWidths[i - 1] ?? 120;
      const swCurr = slotWidths[i] ?? 120;
      const wPrev = getButtonWidth(newProgresses[i - 1] ?? 0, swPrev);
      const wCurr = getButtonWidth(newProgresses[i] ?? 0, swCurr);
      const maxP = Math.max(newProgresses[i - 1] ?? 0, newProgresses[i] ?? 0);
      const desiredGap = lerp(GAP_FULL, GAP_SHRUNK, maxP);
      const avgSlot = (swPrev + swCurr) / 2;
      const visualGap = (avgSlot + GAP_FULL) - (wPrev + wCurr) / 2;
      cumulativeTx += visualGap - desiredGap;
    }

    const rightPadding = 250;
    const adjustedMin = originalLimitMin.current + cumulativeTx - rightPadding;
    const location = engine.location.get();

    if (location < adjustedMin) {
      if (frozenMin.current === null) {
        frozenMin.current = adjustedMin;
      }
      patchLimit(engine.limit, frozenMin.current);
    } else {
      frozenMin.current = null;
      patchLimit(engine.limit, adjustedMin);
    }
  }, [emblaApi, slotWidths]);

  useEffect(() => {
    if (!emblaApi) return;

    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateProgress);
    };

    emblaApi.on('scroll', onScroll);
    emblaApi.on('reInit', () => {
      originalLimitMin.current = null;
      onScroll();
    });

    updateProgress();
    requestAnimationFrame(() => {
      updateProgress();
      requestAnimationFrame(() => {
        updateProgress();
        setIsReady(true);
      });
    });

    return () => {
      emblaApi.off('scroll', onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [emblaApi, updateProgress]);

  if (!categories || categories.length === 0 || slotWidths.length === 0) return null;

  // Cumulative translateX to close visual gaps
  const getTranslateX = (index: number): number => {
    let offset = 0;
    for (let i = 1; i <= index; i++) {
      const swPrev = slotWidths[i - 1] ?? 120;
      const swCurr = slotWidths[i] ?? 120;
      const wPrev = getButtonWidth(slideProgresses[i - 1] ?? 0, swPrev);
      const wCurr = getButtonWidth(slideProgresses[i] ?? 0, swCurr);
      const maxP = Math.max(slideProgresses[i - 1] ?? 0, slideProgresses[i] ?? 0);
      const desiredGap = lerp(GAP_FULL, GAP_SHRUNK, maxP);
      const avgSlot = (swPrev + swCurr) / 2;
      const visualGap = (avgSlot + GAP_FULL) - (wPrev + wCurr) / 2;
      offset -= visualGap - desiredGap;
    }
    return offset;
  };

  return (
    <section style={{ width: '100%', overflow: 'hidden', padding: '10px 0' }}>
      <div ref={emblaRef} style={{ overflow: 'hidden', cursor: 'grab', height: '60px', visibility: isReady ? 'visible' : 'hidden' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          touchAction: 'pan-y pinch-zoom',
          gap: `${GAP_FULL}px`,
          paddingLeft: '287px',
        }}>
          {categories.map((cat, index) => {
            const progress = slideProgresses[index] ?? 0;
            const nextProgress = slideProgresses[index + 1] ?? 1;
            const isActive = activeIndex === index;
            const isLast = index === categories.length - 1;
            const slotW = slotWidths[index] ?? 120;

            const style = getButtonStyle(progress, slotW);
            const dir = slideDirections[index] ?? 0;
            const tx = getTranslateX(index);

            // In phase 2 (circle→gone): shift button toward center for 3D depth effect
            const { phase } = easeProgress(progress);
            const depthShift = phase === 'second' ? -dir * (1 - style.scale) * CIRCLE_SIZE * 1.8 : 0;

            // Spark
            const sparkP = Math.max(progress, isLast ? 1 : nextProgress);
            const sparkOpacity = isLast
              ? 0
              : sparkP <= 0.15 ? 1 : Math.max(0, 1 - (sparkP - 0.15) / 0.55);
            const cardW = getButtonWidth(progress, slotW);
            const maxP = Math.max(progress, nextProgress);
            const desiredGap = lerp(GAP_FULL, GAP_SHRUNK, maxP);
            const sparkLeft = (slotW + cardW) / 2 + desiredGap / 2 - 6;

            // Active: brand bg; inactive: gray
            const bgAlpha = isActive ? 1 : style.bgAlpha;

            return (
              <div
                key={cat.slug}
                onPointerDown={(e) => {
                  pointerStartRef.current = { x: e.clientX, y: e.clientY };
                  isDragRef.current = false;
                }}
                onPointerMove={(e) => {
                  if (!pointerStartRef.current) return;
                  const dx = Math.abs(e.clientX - pointerStartRef.current.x);
                  const dy = Math.abs(e.clientY - pointerStartRef.current.y);
                  if (dx > 5 || dy > 5) isDragRef.current = true;
                }}
                onClick={() => {
                  if (!isDragRef.current) setActiveIndex(activeIndex === index ? null : index);
                }}
                style={{
                  flex: `0 0 ${slotW}px`,
                  minWidth: 0,
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `translateX(${tx}px)`,
                  willChange: 'transform',
                }}
              >
                {/* Button pill */}
                {style.scale > 0.01 && (
                  <div style={{
                    width: `${style.width}px`,
                    height: `${style.height}px`,
                    borderRadius: `${style.radius}px`,
                    background: isActive
                      ? `rgba(69, 161, 23, ${bgAlpha})`
                      : `rgba(181, 181, 181, ${bgAlpha})`,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    cursor: 'pointer',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    opacity: style.opacity,
                    transform: style.scale < 1 ? `translateX(${depthShift}px) scale(${style.scale})` : undefined,
                  }}>
                    {style.contentOpacity > 0.01 && (
                      <span style={{
                        fontFamily: 'Merriweather, serif',
                        fontWeight: 600,
                        fontSize: '17px',
                        lineHeight: 1,
                        color: isActive ? '#ffffff' : 'var(--color-text-primary)',
                        whiteSpace: 'nowrap',
                        opacity: style.contentOpacity,
                      }}>
                        {cat.name}
                      </span>
                    )}
                  </div>
                )}

                {/* Spark */}
                {!isLast && sparkOpacity > 0.01 && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12.0005"
                    fill="none"
                    aria-hidden
                    style={{
                      position: 'absolute',
                      left: `${sparkLeft}px`,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      opacity: sparkOpacity,
                      pointerEvents: 'none',
                    }}
                  >
                    <path d="M12 6.00047C10.3384 5.64978 8.28716 5.41362 7.24241 3.91374C6.47491 2.81169 6.27276 1.28871 6.00024 0.000471365C5.61861 1.71435 5.40087 3.79684 3.79407 4.83384C2.69548 5.54325 1.25351 5.72142 0 6.01226C1.28705 6.29225 2.79561 6.48692 3.89751 7.25194C5.4174 8.30686 5.61672 10.3366 6.00024 12.0005C6.17594 11.1204 6.33322 10.2272 6.62463 9.37638C7.27878 7.46453 8.37832 6.85223 10.2643 6.37379L12 6.00047Z" fill="var(--fill-0, #334A27)"/>
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
