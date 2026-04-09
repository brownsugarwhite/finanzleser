'use client';

import { useRef, useEffect, useState } from 'react';
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
  active?: boolean;
  selected?: boolean;
  onClose?: () => void;
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

  let width: number;

  if (phase === 'first') {
    width = lerp(STATES.article.width, STATES.medium.width, t1);
  } else {
    width = lerp(STATES.medium.width, STATES.small.width, t2);
  }

  return { width };
}

const CARD_WIDTH = STATES.article.width;

export default function SlideCategoryCard({ category, parentSlug, progress = 0, active = false, selected = false, onClose }: SlideCategoryCardProps) {
  const { width } = getInterpolatedStyle(progress);
  const categoryLink = `/${parentSlug}/${category.slug}/`;
  const titleSpanRef = useRef<HTMLSpanElement>(null);
  const [titleWidth, setTitleWidth] = useState(CARD_WIDTH);

  useEffect(() => {
    if (!titleSpanRef.current) return;
    setTitleWidth(titleSpanRef.current.offsetWidth + 2);
  }, [category.name]);

  const cardWidth = active ? titleWidth : width;

  return (
    <div
      style={{
        width: `${cardWidth}px`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        userSelect: 'none',
        WebkitUserSelect: 'none',
        transition: 'width 0.3s ease',
      }}
    >
      {/* Visual */}
      <div style={{
        width: CARD_WIDTH,
        height: active ? 0 : 220,
        overflow: 'hidden',
        opacity: active ? 0 : 1,
        transition: 'height 0.3s ease, opacity 0.3s ease',
      }}>
        {category.image && (
          <InlineSVG
            src={category.image}
            alt={category.name}
            style={{ width: '100%', height: '100%' }}
          />
        )}
      </div>

      {/* Title */}
      <p
        lang="de"
        style={{
          fontFamily: 'Merriweather, serif',
          fontWeight: 700,
          fontSize: '18px',
          lineHeight: 1.3,
          color: 'var(--color-text-primary)',
          margin: 0,
          padding: active ? 0 : '0 23px',
          whiteSpace: 'nowrap',
          width: 'fit-content',
          marginTop: active ? 0 : 27,
          transition: 'padding 0.3s ease, margin 0.3s ease',
        }}
      >
        <span ref={titleSpanRef} style={{ paddingRight: 10 }}>
          {category.name}
          {active && selected && onClose && (
            <span
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              style={{
                marginLeft: 8,
                cursor: 'pointer',
                opacity: 0.5,
                fontSize: '14px',
                fontWeight: 400,
                display: 'inline-block',
                transition: 'opacity 0.2s ease',
              }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = '1'; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = '0.5'; }}
            >
              ✕
            </span>
          )}
        </span>
      </p>

      {/* Description */}
      {category.description && (
        <div style={{
          width: CARD_WIDTH,
          overflow: 'hidden',
          maxHeight: active ? 0 : 100,
          opacity: active ? 0 : 1,
          padding: active ? '0 23px' : '0 23px',
          marginTop: active ? 0 : 10,
          transition: 'max-height 0.3s ease, opacity 0.3s ease, margin 0.3s ease',
        }}>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 400,
            fontSize: '16px',
            lineHeight: 1.3,
            color: 'var(--color-text-medium)',
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {category.description}
          </p>
        </div>
      )}

      {/* Arrow Button */}
      <div style={{
        width: CARD_WIDTH,
        overflow: 'hidden',
        maxHeight: active ? 0 : 60,
        opacity: active ? 0 : 1,
        padding: active ? 0 : '10px 23px',
        transition: 'max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease',
      }}>
        <Link href={categoryLink} style={{
          backgroundColor: 'transparent',
          borderRadius: '18px',
          padding: '3px 3px 3px 10px',
          border: '2px solid var(--color-text-primary)',
          outline: '1px solid var(--color-text-primary)',
          outlineOffset: '2px',
          display: 'inline-flex',
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
  );
}
