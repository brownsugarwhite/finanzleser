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
    containScroll: 'trimSnaps',
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;

    const slideCount = posts.length;
    const update = () => {
      const progress = Math.max(0, Math.min(1, emblaApi.scrollProgress()));
      const idx = Math.round(progress * (slideCount - 1));
      setSelectedIndex(Math.max(0, Math.min(slideCount - 1, idx)));
    };

    emblaApi.on('scroll', update);
    update();

    return () => { emblaApi.off('scroll', update); };
  }, [emblaApi]);

  if (!posts || posts.length === 0) return null;

  return (
    <section style={{ width: '100%', overflow: 'hidden', padding: '40px 0' }}>
      <div ref={emblaRef} style={{ overflow: 'hidden', cursor: 'grab' }}>
        <div style={{ display: 'flex', gap: `${GAP}px` }}>
          <div style={{ flex: '0 0 calc(10vw + 70px)', minWidth: 0 }} aria-hidden />
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
          <div style={{ flex: '0 0 calc(10vw + 70px)', minWidth: 0 }} aria-hidden />
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
