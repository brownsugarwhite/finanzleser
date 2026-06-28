'use client';

import { Fragment, useEffect, useState } from 'react';
import type { Post } from '@/lib/types';
import { isMainCategory } from '@/lib/categories';
import CategoryStackedCard from '@/components/ui/CategoryStackedCard';
import SparkDivider from '@/components/ui/SparkDivider';
import SliderHoverBox from '@/components/ui/SliderHoverBox';
import { useSliderHoverBox } from '@/lib/hooks/useSliderHoverBox';

function hrefFor(post: Post, fallbackMain: string): string {
  const main = post.categories?.nodes?.find((c) => isMainCategory(c.slug));
  const sub = post.categories?.nodes?.find((c) => !isMainCategory(c.slug)) || post.categories?.nodes?.[0];
  return `/${main?.slug || fallbackMain}/${sub?.slug || 'allgemein'}/${post.slug}`;
}

interface CategoryArticleRowsProps {
  posts: Post[];
  fallbackMain: string;
  /** Reihen-Aufteilung, z. B. [2, 3] = oben 2, darunter 3. */
  rows: number[];
}

/**
 * Hauptkategorie-Beitrags-Reihen: gestapelte Cards (Visual oben), nach `rows`
 * aufgeteilt (2 / 3), je Reihe durch vertikale Spark-Divider getrennt, dazwischen
 * eine horizontale Trennlinie. Hover-Box wie im Slider (echte Divider = Anker).
 */
export default function CategoryArticleRows({ posts, fallbackMain, rows }: CategoryArticleRowsProps) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1023px)');
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const hover = useSliderHoverBox({ cardSelector: '[data-card]', enabled: !isMobile });

  // Flache globale Indizes über alle Reihen (für Spark-/Box-Registrierung).
  let start = 0;
  const groups = rows.map((n) => {
    const g = posts.slice(start, start + n).map((post, ci) => ({ post, idx: start + ci, ci }));
    start += n;
    return g;
  }).filter((g) => g.length > 0);

  return (
    <div className="mcat-rows" onMouseLeave={hover.leaveRegion}>
      {groups.map((group, ri) => (
        <div key={ri} className={ri === 0 ? 'mcat-row mcat-row--top' : 'mcat-row'}>
          {group.map(({ post, idx, ci }) => (
            <Fragment key={post.id}>
              {ci > 0 && (
                <SparkDivider
                  orientation="vertical"
                  sparkRef={(el) => hover.registerSpark(idx - 1, el)}
                  style={{ alignSelf: 'center', margin: ri === 0 ? '0 34px' : '0 24px' }}
                />
              )}
              <div
                className="mcat-cell"
                style={{ position: 'relative', flex: 1, minWidth: 0, display: 'flex' }}
                ref={(el) => hover.registerCard(idx, el)}
                onMouseEnter={() => hover.onEnter(idx)}
                onMouseLeave={() => hover.onLeave(idx)}
              >
                <SliderHoverBox index={idx} gap={72} register={hover.registerBox} />
                <CategoryStackedCard post={post} href={hrefFor(post, fallbackMain)} large={ri === 0} />
              </div>
            </Fragment>
          ))}
        </div>
      ))}
    </div>
  );
}
