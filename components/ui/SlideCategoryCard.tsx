'use client';

import { useState } from 'react';
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
  article: { width: 350, height: 390, radius: 36, bgAlpha: 0.10 },
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
  const { width, height, radius, bgAlpha, contentOpacity, contentScale } = getInterpolatedStyle(progress);
  const [infoHovered, setInfoHovered] = useState(false);
  const categoryLink = `/${parentSlug}/${category.slug}/`;

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
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
        opacity: contentOpacity,
        pointerEvents: contentOpacity < 0.1 ? 'none' : 'auto',
        width: `${STATES.article.width}px`,
        height: `${STATES.article.height}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '15px',
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) scale(${contentScale})`,
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

        {/* Text Content */}
        <div style={{ width: '100%', padding: '0 23px', display: 'flex', flexDirection: 'column' }}>
          <span style={{
            fontFamily: 'Merriweather, serif',
            fontSize: '14px',
            fontWeight: 500,
            fontStyle: 'italic',
            color: 'var(--color-text-medium)',
            marginBottom: '2px',
          }}>
            {category.count} Beiträge
          </span>
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
          }}>
            {category.name}
          </p>
          {category.description && (
            <p style={{
              marginTop: '10px',
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
      </div>

      {/* Button Row */}
      {contentOpacity > 0.1 && (
        <div style={{
          position: 'absolute',
          bottom: '15px',
          left: '15px',
          right: '15px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          opacity: contentOpacity,
          pointerEvents: contentOpacity < 0.1 ? 'none' : 'auto',
        }}>
          {/* Info Button */}
          <div
            onMouseEnter={() => setInfoHovered(true)}
            onMouseLeave={() => setInfoHovered(false)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: infoHovered ? 'none' : '1px solid var(--color-text-primary)',
              background: infoHovered ? 'var(--color-text-primary)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'background 0.1s, border 0.1s',
              ['--fill-0' as string]: infoHovered ? '#ffffff' : 'var(--color-text-primary)',
            }}>
            <InlineSVG
              src="/icons/info_i.svg"
              alt="Info"
              style={{ width: '9px', height: '17px' }}
            />
          </div>

          {/* Arrow Button */}
          <Link href={categoryLink} style={{
            width: '51px',
            height: '42px',
            borderRadius: '18px',
            background: 'rgba(198, 200, 204, 0.23)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: '5px',
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
              paddingLeft: '1px',
            }}>
              <svg width="11" height="15" viewBox="0 0 11 15" fill="none">
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
      )}
    </div>
  );
}
