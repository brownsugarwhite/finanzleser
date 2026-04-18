'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import type { Post } from '@/lib/types';
import InlineSVG from '@/components/ui/InlineSVG';

type BookmarkType = 'rechner' | 'vergleich' | 'checkliste' | 'neu';

export interface SlideArticleCardProps {
  post: Post;
  bookmarkType?: BookmarkType;
}

const BOOKMARK_COLORS: Record<BookmarkType, string> = {
  rechner: 'var(--color-brand-secondary)',
  vergleich: 'var(--color-tool-vergleiche)',
  checkliste: 'var(--color-tool-checklisten)',
  neu: 'var(--color-brand)',
};

const CARD_WIDTH = 265;

export default function SlideArticleCard({ post, bookmarkType }: SlideArticleCardProps) {
  const imageUrl = post.featuredImage?.node?.sourceUrl;
  const bookmarkColor = bookmarkType ? BOOKMARK_COLORS[bookmarkType] : undefined;
  const [infoHovered, setInfoHovered] = useState(false);

  const category = post.categories?.nodes?.[0];
  const mainCategory = post.categories?.nodes?.find(
    (cat) => cat.parent === null || cat.parent === 0
  );
  const postLink = `/${mainCategory?.slug || 'beitraege'}/${category?.slug || 'allgemein'}/${post.slug}`;

  const titleRef = useRef<HTMLParagraphElement>(null);
  const [descClamp, setDescClamp] = useState(3);

  useEffect(() => {
    if (!titleRef.current) return;
    const lineHeight = 18 * 1.3;
    const titleLines = Math.round(titleRef.current.offsetHeight / lineHeight);
    setDescClamp(titleLines >= 3 ? 2 : 3);
  }, [post.title]);

  return (
    <div
      style={{
        width: CARD_WIDTH,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* Visual — grauer Platzhalter */}
      <div style={{ width: '100%', height: 160, background: 'rgba(0, 0, 0, 0.08)' }} />

      {/* Text Content */}
      <div style={{ width: '100%', padding: '0 23px', display: 'flex', flexDirection: 'column' }}>
        {category && (
          <span style={{
            fontFamily: 'Merriweather, serif',
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
        marginTop: 4,
        marginBottom: 10,
      }}>
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
            marginRight: 8,
          }}>
            Lesen
          </span>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 14,
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
