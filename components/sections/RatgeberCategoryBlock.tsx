'use client';

import { useState } from 'react';
import SubcategorySlider from '@/components/sections/SubcategorySlider';
import SliderHeadingSubtitle from '@/components/ui/SliderHeadingSubtitle';
import type { CategorySlide } from '@/components/ui/SlideCategoryCard';
import type { Post } from '@/lib/types';

interface RatgeberCategoryBlockProps {
  heading: string;
  iconSrc: string;
  categories: CategorySlide[];
  parentSlug: string;
  allCategoryPosts?: Record<string, Post[]>;
}

/**
 * Überschrift-Block (Icon + Titel + rechtsbündiger Morph-Schriftzug) + der
 * SubcategorySlider. Hält den Aktiv-Zustand (Kategorie gewählt), der den
 * Schriftzug-Morph treibt.
 */
export default function RatgeberCategoryBlock({
  heading,
  iconSrc,
  categories,
  parentSlug,
  allCategoryPosts = {},
}: RatgeberCategoryBlockProps) {
  const [active, setActive] = useState(false);
  const [closeToken, setCloseToken] = useState(0);

  return (
    <div style={{ marginTop: 80 }}>
      <div className="ratgeber-block-wrap" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px', boxSizing: 'border-box' }}>
        {/* inline-flex-Spalte: schrumpft auf Titel-Breite → Schriftzug richtet sich
            rechtsbündig an der rechten Titel-Kante aus (nicht am Container). */}
        <div style={{ display: 'inline-flex', flexDirection: 'column' }}>
          <div className="ratgeber-block-head" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img
              className="ratgeber-block-icon"
              src={iconSrc}
              alt=""
              aria-hidden="true"
              width={36}
              height={36}
              style={{ flexShrink: 0, display: 'block' }}
            />
            <h3 className="ratgeber-block-title" style={{
              fontFamily: "var(--font-heading, 'Merriweather', serif)",
              fontWeight: 700,
              fontStyle: 'italic',
              fontSize: 32,
              color: 'var(--color-text-primary)',
              letterSpacing: '0.01em',
              lineHeight: 1.3,
              marginTop: 5,
            }}>
              {heading}
            </h3>
          </div>
          <SliderHeadingSubtitle active={active} onClose={() => setCloseToken((t) => t + 1)} />
        </div>
      </div>
      <div style={{ marginTop: 23 }}>
        <SubcategorySlider
          categories={categories}
          parentSlug={parentSlug}
          allCategoryPosts={allCategoryPosts}
          onActiveChange={setActive}
          closeToken={closeToken}
        />
      </div>
    </div>
  );
}
