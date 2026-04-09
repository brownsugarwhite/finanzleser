'use client';

import { useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import SlideCategoryCard, { type CategorySlide } from '@/components/ui/SlideCategoryCard';
import SliderNav from '@/components/ui/SliderNav';

const SLIDE_WIDTH = 320;
const GAP = 50;

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
  const [slideStyles, setSlideStyles] = useState<{ opacity: number; scale: number }[]>([]);

  useEffect(() => {
    if (!emblaApi) return;

    const slideCount = categories.length;
    const FADE_LEFT = 250;
    const FADE_RIGHT = 200;

    const update = () => {
      const progress = Math.max(0, Math.min(1, emblaApi.scrollProgress()));
      const idx = Math.round(progress * (slideCount - 1));
      setSelectedIndex(Math.max(0, Math.min(slideCount - 1, idx)));

      // Calculate edge fade per slide
      const rootNode = emblaApi.rootNode();
      const rootRect = rootNode.getBoundingClientRect();
      const slideNodes = emblaApi.slideNodes();

      const styles = slideNodes.map((node) => {
        const rect = node.getBoundingClientRect();
        const slideCenter = rect.left + rect.width / 2;
        const distFromLeft = slideCenter - rootRect.left;
        const distFromRight = rootRect.right - slideCenter;

        if (distFromLeft < FADE_LEFT) {
          const t = Math.max(0, distFromLeft / FADE_LEFT);
          return { opacity: t, scale: 0.9 + 0.1 * t };
        }
        if (distFromRight < FADE_RIGHT) {
          const t = Math.max(0, distFromRight / FADE_RIGHT);
          return { opacity: t, scale: 0.9 + 0.1 * t };
        }
        return { opacity: 1, scale: 1 };
      });

      setSlideStyles(styles);
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
          <div style={{ flex: '0 0 10vw', minWidth: 0 }} aria-hidden />
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
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: slideStyles[index + 1]?.opacity ?? 1,
                  transition: 'opacity 0.1s ease',
                }}
              >
                <div style={{
                  transform: `scale(${slideStyles[index + 1]?.scale ?? 1})`,
                  transition: 'transform 0.1s ease',
                }}>
                  <SlideCategoryCard
                    category={cat}
                    parentSlug={parentSlug}
                    progress={0}
                  />
                </div>

                {/* Spark + Linien */}
                {!isLast && (
                  <div style={{
                    position: 'absolute',
                    right: -GAP / 2 - 0.5,
                    top: '50%',
                    transform: `translateY(-50%) scale(${Math.min(slideStyles[index + 1]?.scale ?? 1, slideStyles[index + 2]?.scale ?? 1)})`,
                    transformOrigin: 'center center',
                    opacity: Math.min(slideStyles[index + 1]?.opacity ?? 1, slideStyles[index + 2]?.opacity ?? 1),
                    transition: 'opacity 0.1s ease, transform 0.1s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 5,
                    pointerEvents: 'none',
                  }}>
                    <div style={{ width: 1, height: 70, background: 'var(--fill-0, #334A27)' }} />
                    <svg width="12" height="12" viewBox="0 0 12 12.0005" fill="none" aria-hidden>
                      <path d="M12 6.00047C10.3384 5.64978 8.28716 5.41362 7.24241 3.91374C6.47491 2.81169 6.27276 1.28871 6.00024 0.000471365C5.61861 1.71435 5.40087 3.79684 3.79407 4.83384C2.69548 5.54325 1.25351 5.72142 0 6.01226C1.28705 6.29225 2.79561 6.48692 3.89751 7.25194C5.4174 8.30686 5.61672 10.3366 6.00024 12.0005C6.17594 11.1204 6.33322 10.2272 6.62463 9.37638C7.27878 7.46453 8.37832 6.85223 10.2643 6.37379L12 6.00047Z" fill="var(--fill-0, #334A27)"/>
                    </svg>
                    <div style={{ width: 1, height: 70, background: 'var(--fill-0, #334A27)' }} />
                  </div>
                )}
              </div>
            );
          })}
          <div style={{ flex: '0 0 10vw', minWidth: 0 }} aria-hidden />
        </div>
      </div>
      <div style={{ padding: '0 clamp(20px, 10vw, 200px)', marginTop: 23 }}>
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
