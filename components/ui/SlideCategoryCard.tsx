'use client';

import Link from 'next/link';
import InlineSVG from '@/components/ui/InlineSVG';
import { easeProgress } from '@/components/ui/SlideArticleCard';

export interface CategorySlide {
  name: string;
  slug: string;
  count: number;
  description?: string;
  image?: string;
}

interface SlideCategoryCardProps {
  category: CategorySlide;
  parentSlug: string;
  progress?: number;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

const STATES = {
  article: { width: 320, height: 390, radius: 0, bgAlpha: 0 },
  medium:  { width: 200, height: 300, radius: 50, bgAlpha: 0.18 },
  small:   { width: 100, height: 100, radius: 42, bgAlpha: 0.26 },
};

export function getCategoryCardWidth(progress: number): number {
  const { t1, t2, phase } = easeProgress(progress);
  if (phase === 'first') return lerp(STATES.article.width, STATES.medium.width, t1);
  return lerp(STATES.medium.width, STATES.small.width, t2);
}

function getInterpolatedStyle(progress: number) {
  const { t1, t2, phase } = easeProgress(progress);
  const rawP = Math.max(0, Math.min(1, progress));

  let width: number, height: number, radius: number, bgAlpha: number, contentOpacity: number, contentScale: number;

  if (phase === 'first') {
    width = lerp(STATES.article.width, STATES.medium.width, t1);
    height = lerp(STATES.article.height, STATES.medium.height, t1);
    radius = lerp(STATES.article.radius, STATES.medium.radius, t1);
    bgAlpha = lerp(STATES.article.bgAlpha, STATES.medium.bgAlpha, t1);
    const rawT = rawP / 0.5;
    contentOpacity = rawT < 0.3 ? 1 : lerp(1, 0, (rawT - 0.3) / 0.7);
    contentScale = lerp(1, 0.8, t1);
  } else {
    width = lerp(STATES.medium.width, STATES.small.width, t2);
    height = lerp(STATES.medium.height, STATES.small.height, t2);
    radius = lerp(STATES.medium.radius, STATES.small.radius, t2);
    bgAlpha = lerp(STATES.medium.bgAlpha, STATES.small.bgAlpha, t2);
    contentOpacity = 0;
    contentScale = 0.8;
  }

  return { width, height, radius, bgAlpha, contentOpacity, contentScale };
}

export default function SlideCategoryCard({ category, parentSlug, progress = 0 }: SlideCategoryCardProps) {
  const { width, radius, bgAlpha } = getInterpolatedStyle(progress);
  const categoryLink = `/${parentSlug}/${category.slug}/`;

  return (
    <div
      style={{
        width: `${width}px`,
        borderRadius: `${radius}px`,
        background: `rgba(181, 181, 181, ${bgAlpha})`,
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '15px',
        flexShrink: 0,
        willChange: 'width, height, border-radius',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* Content */}
      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        marginBottom: '10px',
      }}>
        {/* Visual */}
        <div style={{ width: '100%', height: '220px', overflow: 'hidden' }}>
          {category.image && (
            <InlineSVG
              src={category.image}
              alt={category.name}
              style={{ width: '100%', height: '100%' }}
            />
          )}
        </div>

        {/* Text + Button Row */}
        <div style={{ width: '100%', padding: '0 23px', display: 'flex', alignItems: 'flex-end', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p lang="de" style={{
              fontFamily: 'Merriweather, serif',
              fontWeight: 700,
              fontSize: '18px',
              lineHeight: 1.3,
              color: 'var(--color-text-primary)',
              margin: 0,
              hyphens: 'auto',
              WebkitHyphens: 'auto',
              overflowWrap: 'break-word',
              marginTop: 27,
            }}>
              {category.name}
            </p>
            {category.description && (
              <p style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 400,
                fontSize: '16px',
                lineHeight: 1.3,
                color: 'var(--color-text-medium)',
                margin: '10px 0 0',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {category.description}
              </p>
            )}
          </div>
          {/* Arrow Button */}
          <Link href={categoryLink} style={{
            backgroundColor: 'transparent',
            borderRadius: '18px',
            padding: '3px 3px 3px 10px',
            border: '2px solid var(--color-text-primary)',
            outline: '1px solid var(--color-text-primary)',
            outlineOffset: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            textDecoration: 'none',
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '14px',
              backgroundColor: 'var(--color-brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="9" height="13" viewBox="0 0 11 15" fill="none" style={{ transform: 'rotate(-90deg)' }}>
                <path
                  d="M1.5 1.50009L9.5 7.50009L1.5 13.5001"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
