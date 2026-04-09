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

  if (!categories || categories.length === 0) return null;

  return (
    <section style={{ width: '100%', overflow: 'hidden', padding: '40px 0' }}>
      <div ref={emblaRef} style={{ overflow: 'hidden', cursor: 'grab' }}>
        <div style={{
          display: 'flex',
          gap: `${GAP}px`,
        }}>
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
                  ...(index === 0 ? { marginLeft: 'calc(10vw + 70px)' } : {}),
                  ...(isLast ? { marginRight: '40px' } : {}),
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
