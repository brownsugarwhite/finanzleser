'use client';

import { useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import type { Post } from '@/lib/types';
import SlideArticleCard from '@/components/ui/SlideArticleCard';
import SliderNav from '@/components/ui/SliderNav';

const SLIDE_WIDTH = 265;
const GAP = 22;

interface SimpleArticleSliderProps {
  posts: Post[];
}

export default function SimpleArticleSlider({ posts }: SimpleArticleSliderProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    dragFree: true,
    containScroll: false,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;

    const snapList = emblaApi.scrollSnapList();
    const update = () => {
      const progress = emblaApi.scrollProgress();
      let closest = 0;
      let minDist = Infinity;
      snapList.forEach((snap, i) => {
        const dist = Math.abs(progress - snap);
        if (dist < minDist) { minDist = dist; closest = i; }
      });
      setSelectedIndex(closest);
    };

    emblaApi.on('scroll', update);
    emblaApi.on('reInit', () => {
      const snaps = emblaApi.scrollSnapList();
      snapList.length = 0;
      snaps.forEach(s => snapList.push(s));
    });
    update();

    return () => { emblaApi.off('scroll', update); };
  }, [emblaApi]);

  if (!posts || posts.length === 0) return null;

  return (
    <section style={{ width: '100%', overflow: 'hidden', padding: '40px 0' }}>
      <div ref={emblaRef} style={{ overflow: 'hidden', cursor: 'grab' }}>
        <div style={{ display: 'flex', gap: `${GAP}px` }}>
          {posts.map((post, index) => {
            const isLast = index === posts.length - 1;

            return (
              <div
                key={post.id}
                style={{
                  flex: `0 0 ${SLIDE_WIDTH}px`,
                  minWidth: 0,
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...(index === 0 ? { marginLeft: 'calc(10vw + 70px)' } : {}),
                  ...(isLast ? { marginRight: '40px' } : {}),
                }}
              >
                <SlideArticleCard
                  post={post}
                  bookmarkType={index < 2 ? 'neu' : undefined}
                  progress={0}
                />

                {/* Vertikale Linie */}
                {!isLast && (
                  <div style={{
                    position: 'absolute',
                    right: -GAP / 2 - 0.5,
                    top: 0,
                    bottom: 0,
                    width: 1,
                    background: 'var(--color-text-medium)',
                    pointerEvents: 'none',
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination */}
      <div style={{ padding: '0 clamp(20px, 10vw, 200px)' }}>
        <SliderNav
          current={selectedIndex}
          total={posts.length}
          onPrev={() => emblaApi?.scrollPrev()}
          onNext={() => emblaApi?.scrollNext()}
          onGoTo={(i) => emblaApi?.scrollTo(i)}
        />
      </div>
    </section>
  );
}
