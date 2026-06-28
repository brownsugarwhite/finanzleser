'use client';

import { useState } from 'react';
import SubcategorySlider from '@/components/sections/SubcategorySlider';
import SliderHeadingSubtitle from '@/components/ui/SliderHeadingSubtitle';
import type { CategorySlide } from '@/components/ui/SlideCategoryCard';
import type { Post } from '@/lib/types';

interface MainCategorySliderBlockProps {
  heading: string;
  categories: CategorySlide[];
  parentSlug: string;
  allCategoryPosts?: Record<string, Post[]>;
}

/**
 * Kategorie-Auswahl-Slider auf der Hauptkategorie-Seite: mein „Alle …ratgeber"-
 * Heading (Linie bis zu den Rails, content-bündig) + der Morph-Schriftzug
 * „Wählen Sie eine Kategorie:" → „Kategorie schließen ✕" (wie auf der Landing,
 * getrieben vom Slider-Aktiv-Zustand).
 */
export default function MainCategorySliderBlock({
  heading,
  categories,
  parentSlug,
  allCategoryPosts = {},
}: MainCategorySliderBlockProps) {
  const [active, setActive] = useState(false);
  const [closeToken, setCloseToken] = useState(0);

  return (
    <div className="mcat-slider">
      {/* Linie bis zu den Rail-Enden, Text content-bündig (wie dok-head). Text +
          Morph-Schriftzug in einer inline-flex-Spalte → Schriftzug rechtsbündig zur
          Titel-Kante. Linie sitzt auf der Titel-Mitte. */}
      <div className="cat-rule-head">
        <span className="cat-rule-head-line" aria-hidden />
        <div className="cat-rule-head-inner">
          <div className="cat-rule-textcol">
            <h2 className="cat-rule-head-text">{heading}</h2>
            <SliderHeadingSubtitle active={active} onClose={() => setCloseToken((t) => t + 1)} />
          </div>
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
