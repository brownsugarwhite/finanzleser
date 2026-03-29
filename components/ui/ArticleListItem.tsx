'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Post } from '@/lib/types';
import InlineSVG from '@/components/ui/InlineSVG';

type BookmarkType = 'rechner' | 'vergleich' | 'checkliste' | 'neu';

const BOOKMARK_COLORS: Record<BookmarkType, string> = {
  rechner: 'var(--color-brand-secondary)',
  vergleich: 'var(--color-tool-vergleiche)',
  checkliste: 'var(--color-tool-checklisten)',
  neu: 'var(--color-brand)',
};

interface ArticleListItemProps {
  post: Post;
  href: string;
  bookmarkType?: BookmarkType;
  variant?: 'light' | 'dark';
}

export default function ArticleListItem({ post, href, bookmarkType, variant = 'light' }: ArticleListItemProps) {
  const [infoHovered, setInfoHovered] = useState(false);
  const imageUrl = post.featuredImage?.node?.sourceUrl;
  const category = post.categories?.nodes?.[0];
  const bookmarkColor = bookmarkType ? BOOKMARK_COLORS[bookmarkType] : undefined;

  return (
    <article style={{
      width: '100%',
      maxWidth: '1100px',
      borderRadius: '36px',
      background: variant === 'dark' ? 'rgb(255, 255, 255)' : 'rgba(181, 181, 181, 0.10)',
      display: 'flex',
      overflow: 'hidden',
      gap: '24px',
      position: 'relative',
    }}>
      {/* Lesezeichen */}
      {bookmarkColor && (
        <div style={{
          position: 'absolute',
          top: 0,
          right: '36px',
          width: '28px',
          zIndex: 1,
        }}>
          <div style={{ width: '33px', height: '16px', backgroundColor: bookmarkColor }} />
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
      {/* Visual links */}
      <div style={{
        width: '300px',
        minHeight: '220px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}>
        {imageUrl ? (
          <InlineSVG
            src={imageUrl}
            alt={post.featuredImage?.node?.altText || post.title}
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <span style={{ color: 'var(--color-text-medium)', fontSize: '14px' }}>Kein Bild</span>
        )}
      </div>

      {/* Content rechts */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '24px 28px 24px 0',
        gap: '4px',
      }}>
        {/* Kategorie */}
        {category && (
          <span style={{
            fontFamily: 'Merriweather, serif',
            fontSize: '14px',
            fontWeight: 500,
            fontStyle: 'italic',
            color: 'var(--color-brand)',
          }}>
            {category.name}
          </span>
        )}

        {/* Titel */}
        <p lang="de" style={{
          fontFamily: 'Merriweather, serif',
          fontWeight: 700,
          fontSize: '21px',
          lineHeight: 1.3,
          color: 'var(--color-text-primary)',
          margin: 0,
          hyphens: 'auto',
          WebkitHyphens: 'auto',
          overflowWrap: 'break-word',
          paddingRight: '5px',
        }}>
          {post.title}
        </p>

        {/* Beschreibung */}
        <p lang="de" style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 400,
          fontSize: '16px',
          lineHeight: 1.4,
          color: 'var(--color-text-medium)',
          margin: '4px 0 0 0',
          hyphens: 'auto',
          WebkitHyphens: 'auto',
          overflowWrap: 'break-word',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          paddingRight: '5px',
        }}>
          {post.excerpt?.replace(/<[^>]*>/g, '') || ''}
        </p>

        {/* Button Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '12px',
          marginTop: '12px',
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
            }}
          >
            <InlineSVG
              src="/icons/info_i.svg"
              alt="Info"
              style={{ width: '9px', height: '17px' }}
            />
          </div>

          {/* zum Beitrag Button */}
          <Link href={href} style={{
            backgroundColor: 'rgba(198, 200, 204, 0.23)',
            borderRadius: '19px',
            paddingLeft: '20px',
            paddingRight: '5px',
            paddingTop: '5px',
            paddingBottom: '5px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            height: '50px',
            textDecoration: 'none',
          }}>
            <span style={{
              fontFamily: 'Open Sans, sans-serif',
              fontSize: '17px',
              color: 'var(--color-text-primary)',
              fontWeight: 400,
              whiteSpace: 'nowrap',
            }}>
              zum Beitrag
            </span>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '15px',
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
          </Link>
        </div>
      </div>
    </article>
  );
}
