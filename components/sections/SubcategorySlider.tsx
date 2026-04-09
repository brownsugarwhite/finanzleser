'use client';

import { useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import SlideCategoryCard, { type CategorySlide } from '@/components/ui/SlideCategoryCard';
import SliderNav from '@/components/ui/SliderNav';

const SLIDE_WIDTH = 350;
const GAP = 22;

interface SubcategorySliderProps {
  categories: CategorySlide[];
  parentSlug: string;
}

export default function SubcategorySlider({ categories, parentSlug }: SubcategorySliderProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    dragFree: true,
    containScroll: 'trimSnaps',
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;

    const slideCount = categories.length;
    const update = () => {
      const progress = Math.max(0, Math.min(1, emblaApi.scrollProgress()));
      const idx = Math.round(progress * (slideCount - 1));
      setSelectedIndex(Math.max(0, Math.min(slideCount - 1, idx)));
    };

    emblaApi.on('scroll', update);
    update();

    return () => { emblaApi.off('scroll', update); };
  }, [emblaApi]);

  if (!categories || categories.length === 0) return null;

  return (
    <section style={{ width: '100%', overflow: 'hidden', padding: '40px 0' }}>
      <div ref={emblaRef} style={{ overflow: 'hidden', cursor: 'grab' }}>
        <div style={{
          display: 'flex',
          gap: `${GAP}px`,
        }}>
          <div style={{ flex: '0 0 calc(10vw + 70px)', minWidth: 0 }} aria-hidden />
          {categories.map((cat, index) => {
            const isLast = index === categories.length - 1;

            return (
              <div
                key={cat.slug}
                style={{
                  flex: `0 0 ${SLIDE_WIDTH}px`,
                  minWidth: 0,
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'stretch',
                }}
              >
                <SlideCategoryCard
                  category={cat}
                  parentSlug={parentSlug}
                  progress={0}
                />

                {!isLast && (
                  <div
                    style={{
                      position: 'absolute',
                      right: -GAP / 2 - 0.5,
                      top: 0,
                      bottom: 0,
                      width: 1,
                      background: 'var(--color-text-medium)',
                      pointerEvents: 'none',
                    }}
                  />
                )}
              </div>
            );
          })}
          <div style={{ flex: '0 0 calc(10vw + 70px)', minWidth: 0 }} aria-hidden />
        </div>
      </div>
      <div style={{ padding: '0 clamp(20px, 10vw, 200px)' }}>
        <SliderNav
          current={selectedIndex}
          total={categories.length}
          onPrev={() => emblaApi?.scrollPrev()}
          onNext={() => emblaApi?.scrollNext()}
          onGoTo={(i) => emblaApi?.scrollTo(i)}
        />
      </div>
    </section>
  );
}
