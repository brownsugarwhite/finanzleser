'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Post } from '@/lib/types';
import InlineSVG from '@/components/ui/InlineSVG';
import { TOOL_DOT_COLORS, TOOL_LABEL } from '@/components/ui/ToolDots';
import { startMorphNavigation, type MorphItemSource } from '@/lib/morphTransition';
import { captureTextItem, captureVisualItem, hideSourceEls } from '@/lib/morphCapture';

interface ArticleListItemProps {
  post: Post;
  href: string;
  /** Hero-Variante (Hauptkategorie): Visual 50% + größerer Text. */
  hero?: boolean;
}

/**
 * Listen-Card (Subkategorie-Seiten) im Stil der Slider-Artikel-Cards:
 * Visual links, rechts Titel (Subline) → fetter Text → Beschreibung →
 * Finanztool-Badges → „Ratgeber lesen". Morph-fähig (visual + italic + bold).
 */
export default function ArticleListItem({ post, href, hero = false }: ArticleListItemProps) {
  const router = useRouter();
  const imageRef = useRef<HTMLDivElement>(null);
  const sublineRef = useRef<HTMLParagraphElement>(null);
  const boldRef = useRef<HTMLParagraphElement>(null);
  const imageUrl = post.featuredImage?.node?.sourceUrl;

  // Gleiche Titel-Logik wie SlideArticleCard: bold = Untertitel (oder Titel),
  // Subline = Titel (nur wenn Untertitel existiert).
  const untertitel = post.beitragFelder?.beitragUntertitel?.trim();
  const titleText = untertitel || post.title;
  const sublineText = untertitel ? post.title : null;
  const excerpt = post.excerpt?.replace(/<[^>]*>/g, '').trim() || '';
  const tools = post.tools || [];

  const prefetchArticle = () => {
    try { router.prefetch(href); } catch { /* noop */ }
  };

  const startMorph = () => {
    const items: MorphItemSource[] = [];
    const visual = captureVisualItem(imageRef.current, imageUrl);
    if (visual) items.push(visual);
    const subline = captureTextItem(sublineRef.current, 'italic');
    if (subline) items.push(subline);
    const bold = captureTextItem(boldRef.current, sublineText ? 'bold' : 'italic');
    if (bold) items.push(bold);
    hideSourceEls(imageRef.current, sublineRef.current, boldRef.current);
    startMorphNavigation({ href, items }, (h) => router.push(h));
  };

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    if ((e.target as HTMLElement).closest('a')) return; // „Ratgeber lesen" navigiert selbst
    startMorph();
  };

  return (
    <article
      data-card
      data-morph-card={post.slug}
      onClick={handleClick}
      onMouseEnter={prefetchArticle}
      style={{ cursor: 'pointer', width: '100%', display: 'flex', gap: '32px', alignItems: 'center', position: 'relative' }}
    >
      {/* Visual links (40%) */}
      <div
        ref={imageRef}
        data-morph-role="visual"
        data-morph-img={imageUrl || undefined}
        style={{ flex: hero ? '0 0 50%' : '0 0 40%', minWidth: 0, minHeight: hero ? '260px' : '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      >
        {imageUrl ? (
          <InlineSVG src={imageUrl} alt={post.featuredImage?.node?.altText || post.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : (
          <span style={{ color: 'var(--color-text-medium)', fontSize: '14px' }}>Kein Bild</span>
        )}
      </div>

      {/* Content rechts */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Titel (Subline, kursiv) */}
        {sublineText && (
          <p ref={sublineRef} data-morph-role="italic" lang="de" style={{
            fontFamily: 'Merriweather, serif', fontWeight: 500, fontStyle: 'italic', fontSize: hero ? '18px' : '15px',
            lineHeight: 1.3, color: 'var(--color-text-medium)', margin: '0 0 6px 0',
          }}>
            {sublineText}
          </p>
        )}

        {/* Fetter Text */}
        <p ref={boldRef} data-morph-role={sublineText ? 'bold' : 'italic'} lang="de" style={{
          fontFamily: 'Merriweather, serif', fontWeight: 700, fontSize: hero ? '30px' : '22px', lineHeight: 1.3,
          color: 'var(--color-text-primary)', margin: 0,
          hyphens: 'auto', WebkitHyphens: 'auto', overflowWrap: 'break-word',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {titleText}
        </p>

        {/* Beschreibung */}
        {excerpt && (
          <p lang="de" style={{
            fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: hero ? '17px' : '15px', lineHeight: 1.45,
            color: 'var(--color-text-medium)', margin: '8px 0 0 0',
            hyphens: 'auto', WebkitHyphens: 'auto', overflowWrap: 'break-word',
          }}>
            {excerpt}
          </p>
        )}

        {/* Finanztool-Badges */}
        {tools.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '12px 0 0' }}>
            {tools.map((t) => (
              <span key={t} style={{
                background: TOOL_DOT_COLORS[t], color: '#fff', fontFamily: 'var(--font-body)',
                fontSize: 12, fontWeight: 600, lineHeight: 1, padding: '5px 10px', letterSpacing: '0.02em',
              }}>
                {TOOL_LABEL[t]}
              </span>
            ))}
          </div>
        )}

        {/* Ratgeber lesen */}
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center' }}>
          <Link href={href} className="article-read-link">
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap' }}>
              Ratgeber lesen
            </span>
            <span className="article-read-line" style={{ height: 0, borderTop: '1px solid currentColor', flexShrink: 0 }} />
            <svg width="8" height="8" viewBox="0 0 17.45 15.77" fill="none" aria-hidden style={{ flexShrink: 0, transform: 'rotate(180deg)', marginLeft: '-12px' }}>
              <polyline points="16.95 15.27 8.27 8.11 16.95 .5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" vectorEffect="non-scaling-stroke" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}
