'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Post } from '@/lib/types';
import { isMainCategory } from '@/lib/categories';
import InlineSVG from '@/components/ui/InlineSVG';
import { useArticlePreview } from '@/components/sections/ArticlePreviewProvider';
import { useSliderPreviewContext } from '@/components/sections/ArticleSliderContext';

type BookmarkType = 'rechner' | 'vergleich' | 'checkliste' | 'neu';

export interface SlideArticleCardProps {
  post: Post;
  index?: number;
  bookmarkType?: BookmarkType;
}

const BOOKMARK_COLORS: Record<BookmarkType, string> = {
  rechner: 'var(--color-brand-secondary)',
  vergleich: 'var(--color-tool-vergleiche)',
  checkliste: 'var(--color-tool-checklisten)',
  neu: 'var(--color-brand)',
};

export const CARD_MIN_WIDTH = 265;
export const CARD_MAX_WIDTH = 450;

export default function SlideArticleCard({ post, index, bookmarkType }: SlideArticleCardProps) {
  const bookmarkColor = bookmarkType ? BOOKMARK_COLORS[bookmarkType] : undefined;
  const [infoHovered, setInfoHovered] = useState(false);
  const [imageVisible, setImageVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (imageVisible) return;
    const el = imageRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setImageVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setImageVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px 300px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [imageVisible]);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const { openPreview, isOpen } = useArticlePreview();
  const sliderCtx = useSliderPreviewContext();

  const mainCategory = post.categories?.nodes?.find((cat) => isMainCategory(cat.slug));
  const category = post.categories?.nodes?.find((cat) => !isMainCategory(cat.slug)) || post.categories?.nodes?.[0];
  const postLink = `/${mainCategory?.slug || 'beitraege'}/${category?.slug || 'allgemein'}/${post.slug}`;

  // Neuer Titel = beitragUntertitel (der große 42px-Titel der Beitragsseite).
  // Falls kein Untertitel gesetzt, fällt die Card auf post.title zurück und
  // zeigt dann keine Subline an (sonst wäre Titel = Subline).
  const untertitel = post.beitragFelder?.beitragUntertitel?.trim();
  const titleText = untertitel || post.title;
  const sublineText = untertitel ? post.title : null;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current;
    pointerStartRef.current = null;
    if (!start) return;
    if (isOpen) return;
    // Only treat as click if pointer barely moved (ignore Embla drag gestures)
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (dx * dx + dy * dy > 36) return; // > 6px → drag, ignore
    const target = e.target as HTMLElement;
    if (target.closest('.article-read-link')) return;
    if (!cardRef.current) return;
    // If inside a slider context, pass full context + index for in-preview navigation.
    // Otherwise fall back to single-post preview (no nav).
    if (sliderCtx && typeof index === 'number') {
      openPreview({ ctx: sliderCtx, currentIndex: index });
    } else {
      openPreview({ post, cardEl: cardRef.current });
    }
  };

  return (
    <div
      ref={cardRef}
      data-flip-id={`preview-${post.slug}-box`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      style={{
        width: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        alignSelf: 'flex-start',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        cursor: 'pointer',
      }}
    >
      {/* Visual — grauer Platzhalter (mit Info-Button unten rechts) */}
      <div
        ref={imageRef}
        data-flip-id={`preview-${post.slug}-image`}
        style={{
          position: 'relative',
          width: '100%',
          height: 210,
          background:
            imageVisible && post.featuredImage?.node.sourceUrl
              ? `url(${post.featuredImage.node.sourceUrl}) center/cover no-repeat`
              : '#e5e5e5',
          flexShrink: 0,
        }}
      >
        <div
          onMouseEnter={() => setInfoHovered(true)}
          onMouseLeave={() => setInfoHovered(false)}
          style={{
            position: 'absolute',
            bottom: 13,
            right: 13,
            width: 36,
            height: 36,
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
          }}
        >
          <InlineSVG
            src="/icons/info_i.svg"
            alt="Info"
            style={{ width: 9, height: 17 }}
          />
        </div>
      </div>

      {/* Text + Footer — fadet beim Preview-Öffnen aus */}
      <div data-card-text style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          width: '100%',
          padding: '13px 23px 0',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {sublineText && (
            <p
              lang="de"
              style={{
                fontFamily: 'Merriweather, serif',
                fontWeight: 500,
                fontSize: '14px',
                lineHeight: 1.3,
                color: 'var(--color-text-medium)',
                margin: 0,
                hyphens: 'auto',
                WebkitHyphens: 'auto',
                overflowWrap: 'break-word',
                marginBottom: 6,
              }}
            >
              {sublineText}
            </p>
          )}
          <p
            lang="de"
            style={{
              fontFamily: 'Merriweather, serif',
              fontWeight: 700,
              fontSize: '18px',
              lineHeight: 1.3,
              color: 'var(--color-text-primary)',
              margin: 0,
              hyphens: 'auto',
              WebkitHyphens: 'auto',
              overflowWrap: 'break-word',
            }}
          >
            {titleText}
          </p>
        </div>

        {/* Footer: direkt nach dem Text (nicht am unteren Card-Rand) */}
        <div style={{
          width: '100%',
          padding: '6px 23px 0',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
        }}>
        <Link href={postLink} className="article-read-link">
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
          }}>
            Ratgeber lesen
          </span>
          <span
            className="article-read-line"
            style={{ height: 0, borderTop: '1px solid currentColor', flexShrink: 0 }}
          />
          <svg
            width="8"
            height="8"
            viewBox="0 0 17.45 15.77"
            fill="none"
            aria-hidden
            style={{ flexShrink: 0, transform: 'rotate(180deg)', marginLeft: '-12px' }}
          >
            <polyline
              points="16.95 15.27 8.27 8.11 16.95 .5"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </Link>
        </div>
      </div>

      {/* Lesezeichen */}
      {bookmarkColor && (
        <div style={{
          position: 'absolute',
          top: 0,
          right: 13,
          width: 28,
        }}>
          <div style={{ width: 33, height: 16, backgroundColor: bookmarkColor }} />
          <svg width="33" height="25" viewBox="0 0 28 23" fill="none" preserveAspectRatio="none" style={{ display: 'block' }}>
            <path d="M13.9991 8.58256L28 22.5817V6.8343e-07L0 1.90735e-06L0 22.5817L13.9991 8.58256Z" fill={bookmarkColor} />
          </svg>
          {bookmarkType === 'neu' && (
            <p style={{
              position: 'absolute',
              top: 3,
              left: 3,
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: 13,
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
