'use client';

import { Fragment, useEffect, useState } from 'react';
import type { Post } from '@/lib/types';
import ArticleListItem from '@/components/ui/ArticleListItem';
import SparkDivider from '@/components/ui/SparkDivider';
import ListHoverBox from '@/components/ui/ListHoverBox';
import { useListHoverBox } from '@/lib/hooks/useListHoverBox';

interface ArticleListProps {
  posts: Post[];
  mainCategorySlug?: string;
}

export default function ArticleList({ posts, mainCategorySlug }: ArticleListProps) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1023px)');
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // Hover-Box wie im Landing-Slider — OHNE registrierte Sparks zeichnet der Hook
  // eine eigenständige Box um jede Card (eigene Sparks links/rechts mittig).
  const hover = useListHoverBox({ cardSelector: '[data-card]', enabled: !isMobile });

  if (!posts || posts.length === 0) return null;

  return (
    <div
      onMouseLeave={hover.leaveRegion}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: '28px',
      }}
    >
      {posts.map((post, index) => {
        const category = post.categories?.nodes?.[0];
        const postLink = mainCategorySlug && category
          ? `/${mainCategorySlug}/${category.slug}/${post.slug}`
          : `/${category?.slug || 'beitraege'}/${post.slug}`;

        return (
          <Fragment key={post.id}>
            {index > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                {/* Geteilter Divider: Unterkante von Item index-1 + Oberkante von Item index. */}
                <SparkDivider orientation="horizontal" sparkRef={(el) => hover.registerSpark(index - 1, el)} />
              </div>
            )}
            <div
              style={{ position: 'relative' }}
              ref={(el) => hover.registerCard(index, el)}
              onMouseEnter={() => hover.onEnter(index)}
              onMouseLeave={() => hover.onLeave(index)}
            >
              <ListHoverBox index={index} gap={72} register={hover.registerBox} />
              <ArticleListItem post={post} href={postLink} />
            </div>
          </Fragment>
        );
      })}
      {/* Trenner auch nach dem letzten Artikel = Unterkante des letzten Items. */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <SparkDivider orientation="horizontal" sparkRef={(el) => hover.registerSpark(posts.length - 1, el)} />
      </div>
    </div>
  );
}
