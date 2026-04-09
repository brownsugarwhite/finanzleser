'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import type { Post } from '@/lib/types';
import InlineSVG from '@/components/ui/InlineSVG';

type BookmarkType = 'rechner' | 'vergleich' | 'checkliste' | 'neu';

export interface SlideArticleCardProps {
  post: Post;
  bookmarkType?: BookmarkType;
  progress?: number; // 0 = full article, 1 = fully shrunk
}

const BOOKMARK_COLORS: Record<BookmarkType, string> = {
  rechner: 'var(--color-brand-secondary)',
  vergleich: 'var(--color-tool-vergleiche)',
  checkliste: 'var(--color-tool-checklisten)',
  neu: 'var(--color-brand)',
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

// Easing: article→medium easeIn, medium→small easeOut
function easeIn(t: number) { return t * t; }
function easeOut(t: number) { return 1 - (1 - t) * (1 - t); }

// Apply easing to raw progress — shared by card AND slider gap calculations
export function easeProgress(progress: number): { t1: number; t2: number; phase: 'first' | 'second' } {
  const p = Math.max(0, Math.min(1, progress));
  if (p <= 0.5) {
    return { t1: easeIn(p / 0.5), t2: 0, phase: 'first' };
  }
  return { t1: 1, t2: easeOut((p - 0.5) / 0.5), phase: 'second' };
}

// Card states from Figma
const STATES = {
  article: { width: 265, height: 390, radius: 36, bgAlpha: 0 },
  medium:  { width: 200, height: 300, radius: 50, bgAlpha: 0.18 },
  small:   { width: 100, height: 100, radius: 42, bgAlpha: 0.26 },
};

export function getCardWidth(progress: number): number {
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

export default function SlideArticleCard({ post, bookmarkType, progress = 0 }: SlideArticleCardProps) {
  const { width, radius, contentOpacity } = getInterpolatedStyle(progress);
  const imageUrl = post.featuredImage?.node?.sourceUrl;
  const bookmarkColor = bookmarkType ? BOOKMARK_COLORS[bookmarkType] : undefined;
  const [infoHovered, setInfoHovered] = useState(false);

  // Build post URL from categories
  const category = post.categories?.nodes?.[0];
  const mainCategory = post.categories?.nodes?.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cat: any) => cat.parent === null || cat.parent === 0
  );
  const postLink = `/${mainCategory?.slug || 'beitraege'}/${category?.slug || 'allgemein'}/${post.slug}`;
  const titleRef = useRef<HTMLParagraphElement>(null);
  const [descClamp, setDescClamp] = useState(3);

  useEffect(() => {
    if (!titleRef.current) return;
    const lineHeight = 18 * 1.3; // fontSize * lineHeight
    const titleLines = Math.round(titleRef.current.offsetHeight / lineHeight);
    setDescClamp(titleLines >= 3 ? 2 : 3);
  }, [post.title]);

  return (
    <div
      style={{
        width: `${width}px`,
        borderRadius: `${radius}px`,
        background: 'transparent',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        userSelect: 'none',
        WebkitUserSelect: 'none',
        marginBottom: '10px',
      }}
    >
      {/* Content */}
      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        
      }}>
        {/* Visual */}
        <div style={{ width: '100%', height: '160px', overflow: 'hidden' }}>
          {imageUrl && (
            <InlineSVG
              src={imageUrl}
              alt={post.featuredImage?.node?.altText || post.title}
              style={{ width: '100%', height: '100%' }}
            />
          )}
        </div>

        {/* Text Content — description clamp adapts to title height */}
        <div style={{ width: '100%', padding: '0 23px', display: 'flex', flexDirection: 'column' }}>
          {category && (
            <span style={{
              fontFamily: 'merriweather, serif',
              fontSize: '14px',
              fontWeight: 500,              
              color: 'var(--color-text-primary)',
              marginBottom: 5,
              marginTop: 5,
            }}>
              {category.name}
            </span>
          )}
          <p ref={titleRef} lang="de" style={{
            fontFamily: 'Merriweather, serif',
            fontWeight: 700,
            fontSize: '18px',
            lineHeight: 1.3,
            color: 'var(--color-text-primary)',
            margin: 0,
            hyphens: 'auto',
            WebkitHyphens: 'auto',
            overflowWrap: 'break-word',
            marginBottom: 6,
          }}>
            {post.title}
          </p>
          <p lang="de" style={{
            marginTop: '5px',
            fontFamily: 'var(--font-body)',
            fontWeight: 400,
            fontSize: '16px',
            lineHeight: 1.3,
            color: 'var(--color-text-medium)',
            margin: 0,
            hyphens: 'auto',
            WebkitHyphens: 'auto',
            overflowWrap: 'break-word',
            display: '-webkit-box',
            WebkitLineClamp: descClamp,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {post.excerpt?.replace(/<[^>]*>/g, '') || ''}
          </p>
        </div>

        {/* Trennlinie */}
        <div style={{ width: '100%', padding: '13px 23px' }}>
          <div style={{ height: 1, background: 'rgba(0, 0, 0, 0.07)' }} />
        </div>

        {/* Button Row */}
        <div style={{
          width: '100%',
          padding: '0 23px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '4px',
          marginBottom: '10px',
        }}>
          {/* Arrow Button — Main Button Style mit Label */}
          <Link href={postLink} style={{
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
            <span style={{
              fontFamily: 'Open Sans, sans-serif',
              fontSize: '14px',
              color: '#1a1a1a',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              marginRight: '8px',
            }}>
              Lesen
            </span>
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
              <svg width="9" height="13" viewBox="0 0 11 15" fill="none" style={{ marginLeft: 2 }}>
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
        </div>

      </div>

      {/* Lesezeichen (Bookmark) */}
      {bookmarkColor && contentOpacity > 0.3 && (
        <div style={{
          position: 'absolute',
          top: 0,
          right: '13px',
          width: '28px',
          opacity: contentOpacity,
        }}>
          {/* Color bar */}
          <div style={{ width: '33px', height: '16px', backgroundColor: bookmarkColor }} />
          {/* Spike down */}
          <svg width="33" height="25" viewBox="0 0 28 23" fill="none" preserveAspectRatio="none" style={{ display: 'block' }}>
            <path d="M13.9991 8.58256L28 22.5817V6.8343e-07L0 1.90735e-06L0 22.5817L13.9991 8.58256Z" fill={bookmarkColor} />
          </svg>
          {bookmarkType === 'neu' && (
            <p style={{
              position: 'absolute',
              top: '3px',
              left: '3px',
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: '13px',
              lineHeight: 1.3,
              color: 'white',
              margin: 0,
              whiteSpace: 'nowrap',
            }}>
              NEU
            </p>
          )}
        </div>
      )}
    </div>
  );
}
