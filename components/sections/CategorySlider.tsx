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

const THRESHOLD_FULL = 380;
const THRESHOLD_SMALL = 780;

function calculateProgress(distance: number): number {
  if (distance <= THRESHOLD_FULL) return 0;
  if (distance >= THRESHOLD_SMALL) return 1;
  return (distance - THRESHOLD_FULL) / (THRESHOLD_SMALL - THRESHOLD_FULL);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export default function CategorySlider({ posts }: CategorySliderProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'center',
    loop: false,
    dragFree: true,
    skipSnaps: true,
    duration: 30,
  });

  const [slideProgresses, setSlideProgresses] = useState<number[]>([]);
  const rafRef = useRef<number>(0);

  const updateProgress = useCallback(() => {
    if (!emblaApi) return;

    const slideNodes = emblaApi.slideNodes();
    const rootNode = emblaApi.rootNode();
    const rootRect = rootNode.getBoundingClientRect();
    const viewportCenter = rootRect.width / 2;

    const newProgresses = slideNodes.map((node) => {
      const rect = node.getBoundingClientRect();
      const slideCenter = rect.left - rootRect.left + rect.width / 2;
      return calculateProgress(Math.abs(slideCenter - viewportCenter));
    });

    setSlideProgresses(newProgresses);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateProgress);
    };

    emblaApi.on('scroll', onScroll);
    emblaApi.on('reInit', onScroll);
    updateProgress();

    return () => {
      emblaApi.off('scroll', onScroll);
      emblaApi.off('reInit', onScroll);
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
      <div ref={emblaRef} style={{ overflow: 'hidden', cursor: 'grab' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          touchAction: 'pan-y pinch-zoom',
          gap: `${GAP_FULL}px`,
          paddingLeft: `${SLIDE_BASE_WIDTH + GAP_FULL}px`,
          paddingRight: `${SLIDE_BASE_WIDTH + GAP_FULL}px`,
        }}>
          {posts.map((post, index) => {
            const progress = slideProgresses[index] ?? 0;
            const nextProgress = slideProgresses[index + 1] ?? 1;
            const isLast = index === posts.length - 1;

            const sparkOpacity = isLast
              ? 0
              : Math.max(0, 1 - Math.max(progress, nextProgress) * 2.5);

            const tx = getTranslateX(index);

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
                      right: `-${GAP_FULL / 2 + 6}px`,
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
