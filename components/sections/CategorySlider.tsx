'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import type { Post } from '@/lib/types';
import SlideArticleCard, { getCardWidth } from '@/components/ui/SlideArticleCard';

const SLIDE_BASE_WIDTH = 265;
const GAP_FULL = 22;
const GAP_SHRUNK = 15;

interface CategorySliderProps {
  posts: Post[];
}

// Thresholds as percentage of viewport width
const THRESHOLD_FULL_RATIO = 0.2;   // 20% of viewport
const THRESHOLD_SMALL_RATIO = 0.6;  // 80% of viewport

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

// Mutate Embla's limit object in place so all internal modules see the change
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

export default function CategorySlider({ posts }: CategorySliderProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'center',
    loop: false,
    dragFree: true,
    duration: 25,
  });

  const [slideProgresses, setSlideProgresses] = useState<number[]>([]);
  const [isReady, setIsReady] = useState(false);
  const rafRef = useRef<number>(0);
  const originalLimitMin = useRef<number | null>(null);
  const frozenMin = useRef<number | null>(null);

  const updateProgress = useCallback(() => {
    if (!emblaApi) return;

    const engine = emblaApi.internalEngine();
    const slideNodes = emblaApi.slideNodes();
    const rootNode = emblaApi.rootNode();
    const rootRect = rootNode.getBoundingClientRect();
    const viewportCenter = rootRect.width / 2;

    const newProgresses = slideNodes.map((node) => {
      const rect = node.getBoundingClientRect();
      const slideCenter = rect.left - rootRect.left + rect.width / 2;
      return calculateProgress(Math.abs(slideCenter - viewportCenter), rootRect.width);
    });

    setSlideProgresses(newProgresses);

    // Save original limit once (before any patching)
    if (originalLimitMin.current === null) {
      originalLimitMin.current = engine.limit.min;
    }
    // Calculate cumulative translateX correction
    let cumulativeTx = 0;
    for (let i = 1; i < newProgresses.length; i++) {
      const wPrev = getCardWidth(newProgresses[i - 1] ?? 0);
      const wCurr = getCardWidth(newProgresses[i] ?? 0);
      const maxP = Math.max(newProgresses[i - 1] ?? 0, newProgresses[i] ?? 0);
      const desiredGap = lerp(GAP_FULL, GAP_SHRUNK, maxP);
      const visualGap = (SLIDE_BASE_WIDTH + GAP_FULL) - (wPrev + wCurr) / 2;
      cumulativeTx += visualGap - desiredGap;
    }

    // Patch Embla's limit in place — all internal modules share this object
    const rightPadding = 500;
    const adjustedMin = originalLimitMin.current + cumulativeTx - rightPadding;
    const location = engine.location.get();

    // Freeze the limit when overscrolling so cumulativeTx changes don't amplify the effect
    if (location < adjustedMin) {
      // Past the limit — freeze if not already frozen
      if (frozenMin.current === null) {
        frozenMin.current = adjustedMin;
      }
      patchLimit(engine.limit, frozenMin.current);
    } else {
      // Within bounds — unfreeze and use live calculation
      frozenMin.current = null;
      patchLimit(engine.limit, adjustedMin);
    }
  }, [emblaApi]);

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
    // Triple-pass: each pass sizes change → layout shifts → remeasure
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

  if (!posts || posts.length === 0) return null;

  const getBookmarkType = (_post: Post, index: number): 'rechner' | 'vergleich' | 'checkliste' | 'neu' | undefined => {
    if (index < 2) return 'neu';
    return undefined;
  };

  const getTranslateX = (index: number): number => {
    let offset = 0;
    for (let i = 1; i <= index; i++) {
      const wPrev = getCardWidth(slideProgresses[i - 1] ?? 0);
      const wCurr = getCardWidth(slideProgresses[i] ?? 0);
      const maxP = Math.max(slideProgresses[i - 1] ?? 0, slideProgresses[i] ?? 0);
      const desiredGap = lerp(GAP_FULL, GAP_SHRUNK, maxP);
      const visualGap = (SLIDE_BASE_WIDTH + GAP_FULL) - (wPrev + wCurr) / 2;
      offset -= visualGap - desiredGap;
    }
    return offset;
  };

  return (
    <section style={{ width: '100%', overflow: 'hidden', padding: '40px 0' }}>
      <div ref={emblaRef} style={{ overflow: 'hidden', cursor: 'grab', height: '380px', visibility: isReady ? 'visible' : 'hidden' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          touchAction: 'pan-y pinch-zoom',
          gap: `${GAP_FULL}px`,
          paddingLeft: `${SLIDE_BASE_WIDTH + GAP_FULL}px`,
          paddingRight: '500px',
        }}>
          {posts.map((post, index) => {
            const progress = slideProgresses[index] ?? 0;
            const nextProgress = slideProgresses[index + 1] ?? 1;
            const isLast = index === posts.length - 1;

            // Spark fades between progress 0.15 → 0.5
            const sparkP = Math.max(progress, isLast ? 1 : nextProgress);
            const sparkOpacity = isLast
              ? 0
              : sparkP <= 0.15 ? 1 : Math.max(0, 1 - (sparkP - 0.15) / 0.35);

            const tx = getTranslateX(index);

            const cardW = getCardWidth(progress);
            const maxP = Math.max(progress, nextProgress);
            const desiredGap = lerp(GAP_FULL, GAP_SHRUNK, maxP);
            const sparkLeft = (SLIDE_BASE_WIDTH + cardW) / 2 + desiredGap / 2 - 6;

            return (
              <div
                key={post.id}
                style={{
                  flex: `0 0 ${SLIDE_BASE_WIDTH}px`,
                  minWidth: 0,
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `translateX(${tx}px)`,
                  willChange: 'transform',
                }}
              >
                <SlideArticleCard
                  post={post}
                  bookmarkType={getBookmarkType(post, index)}
                  progress={progress}
                />

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
