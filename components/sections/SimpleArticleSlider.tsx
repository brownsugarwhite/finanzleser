'use client';

import { useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import type { Post } from '@/lib/types';
import SlideArticleCard from '@/components/ui/SlideArticleCard';
import InstagramDots from '@/components/ui/InstagramDots';

const SLIDE_WIDTH = 265;
const GAP = 22;

interface SimpleArticleSliderProps {
  posts: Post[];
}

export default function SimpleArticleSlider({ posts }: SimpleArticleSliderProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    slidesToScroll: 1,
    duration: 25,
    containScroll: false,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    onSelect();
    return () => { emblaApi.off('select', onSelect); };
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
        <div className="checkliste-nav">
          <button
            className="checkliste-nav-arrow-btn"
            onClick={() => emblaApi?.scrollPrev()}
            disabled={selectedIndex === 0}
            aria-label="Vorheriger Slide"
          >
            <svg width="40" height="10" viewBox="0 0 64 15" fill="none" className="checkliste-nav-arrow">
              <path d="M0 15H64V0L0 15Z" fill="var(--color-text-primary)" />
            </svg>
            <span className="checkliste-nav-track">
              <span className="checkliste-nav-label">Vorherige</span>
            </span>
          </button>

          <InstagramDots
            current={selectedIndex}
            total={posts.length}
            onGoTo={(i) => emblaApi?.scrollTo(i)}
          />

          <button
            className="checkliste-nav-arrow-btn checkliste-nav-arrow-btn--right"
            onClick={() => emblaApi?.scrollNext()}
            disabled={selectedIndex === posts.length - 1}
            aria-label="Nächster Slide"
          >
            <span className="checkliste-nav-track">
              <span className="checkliste-nav-label">Nächste</span>
            </span>
            <svg width="40" height="10" viewBox="0 0 64 15" fill="none" className="checkliste-nav-arrow">
              <path d="M64 15H0V0L64 15Z" fill="var(--color-text-primary)" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
