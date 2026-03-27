'use client';

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

// Card states from Figma
const STATES = {
  article: { width: 265, height: 380, radius: 36, bgAlpha: 0.10 },
  medium:  { width: 200, height: 300, radius: 50, bgAlpha: 0.18 },
  small:   { width: 100, height: 100, radius: 42, bgAlpha: 0.26 },
};

export function getCardWidth(progress: number): number {
  const p = Math.max(0, Math.min(1, progress));
  if (p <= 0.5) return lerp(STATES.article.width, STATES.medium.width, p / 0.5);
  return lerp(STATES.medium.width, STATES.small.width, (p - 0.5) / 0.5);
}

function getInterpolatedStyle(progress: number) {
  const p = Math.max(0, Math.min(1, progress));

  let width: number, height: number, radius: number, bgAlpha: number, contentOpacity: number;

  if (p <= 0.5) {
    const t = p / 0.5;
    width = lerp(STATES.article.width, STATES.medium.width, t);
    height = lerp(STATES.article.height, STATES.medium.height, t);
    radius = lerp(STATES.article.radius, STATES.medium.radius, t);
    bgAlpha = lerp(STATES.article.bgAlpha, STATES.medium.bgAlpha, t);
    contentOpacity = lerp(1, 0, t);
  } else {
    const t = (p - 0.5) / 0.5;
    width = lerp(STATES.medium.width, STATES.small.width, t);
    height = lerp(STATES.medium.height, STATES.small.height, t);
    radius = lerp(STATES.medium.radius, STATES.small.radius, t);
    bgAlpha = lerp(STATES.medium.bgAlpha, STATES.small.bgAlpha, t);
    contentOpacity = 0;
  }

  return { width, height, radius, bgAlpha, contentOpacity };
}

export default function SlideArticleCard({ post, bookmarkType, progress = 0 }: SlideArticleCardProps) {
  const { width, height, radius, bgAlpha, contentOpacity } = getInterpolatedStyle(progress);
  const imageUrl = post.featuredImage?.node?.sourceUrl;
  const bookmarkColor = bookmarkType ? BOOKMARK_COLORS[bookmarkType] : undefined;

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
      }}
    >
      {/* Content — fades out as card shrinks */}
      <div style={{
        opacity: contentOpacity,
        pointerEvents: contentOpacity < 0.1 ? 'none' : 'auto',
        width: `${STATES.article.width}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '15px',
        flex: 1,
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

        {/* Text Content */}
        <div style={{ width: '100%', padding: '0 23px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <p style={{
            fontFamily: 'Merriweather, serif',
            fontWeight: 700,
            fontSize: '19px',
            lineHeight: 1.3,
            color: 'var(--color-text-primary)',
            margin: 0,
          }}>
            {post.title}
          </p>
          <p style={{
            fontFamily: 'Open Sans, sans-serif',
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
            {post.excerpt?.replace(/<[^>]*>/g, '') || ''}
          </p>
        </div>

        {/* Button Row */}
        <div style={{
          position: 'absolute',
          bottom: '15px',
          left: '15px',
          right: '15px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}>
          {/* Info Button */}
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(129, 129, 129, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}>
            <svg width="9" height="18" viewBox="0 0 9 18" fill="none">
              <circle cx="4.5" cy="2" r="2" fill="var(--color-text-primary)" />
              <rect x="2.5" y="6" width="4" height="12" rx="2" fill="var(--color-text-primary)" />
            </svg>
          </div>

          {/* Arrow Button (mini, no label) */}
          <div style={{
            width: '51px',
            height: '42px',
            borderRadius: '18px',
            background: 'rgba(129, 129, 129, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: '5px',
            cursor: 'pointer',
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
          </div>
        </div>
      </div>

      {/* Lesezeichen (Bookmark) */}
      {bookmarkColor && contentOpacity > 0.3 && (
        <div style={{
          position: 'absolute',
          top: 0,
          right: '32px',
          width: '36px',
          opacity: contentOpacity,
        }}>
          <div style={{ width: '36px', height: '20px', backgroundColor: bookmarkColor }} />
          <div style={{
            width: '36px',
            height: '29px',
            overflow: 'hidden',
            ['--fill-0' as string]: bookmarkColor,
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/lesezeichen-spikes.svg" alt="" style={{ width: '100%', height: '100%', display: 'block' }} />
          </div>
          {bookmarkType === 'neu' && (
            <p style={{
              position: 'absolute',
              top: '3px',
              left: '3px',
              fontFamily: 'Open Sans, sans-serif',
              fontWeight: 700,
              fontSize: '14px',
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
