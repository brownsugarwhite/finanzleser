'use client';

import { memo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Post } from '@/lib/types';
import { isMainCategory } from '@/lib/categories';
import { startMorphNavigation, type MorphItemSource } from '@/lib/morphTransition';
import { captureTextItem, captureVisualItem, hideSourceEls, getElementScale } from '@/lib/morphCapture';
import { TOOL_DOT_COLORS, TOOL_LABEL } from '@/components/ui/ToolDots';

export interface SlideArticleCardProps {
  post: Post;
  index?: number;
  phase1Visible?: boolean;
  phase2Visible?: boolean;
  categoryTransition?: 'idle' | 'out' | 'in';
}

const PHASE_DURATION = 0.3;

export const CARD_MIN_WIDTH = 265;
export const CARD_MAX_WIDTH = 450;

function SlideArticleCardImpl({ post, index, phase1Visible = true, phase2Visible = true, categoryTransition = 'idle' }: SlideArticleCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const boldRef = useRef<HTMLParagraphElement>(null);
  const sublineRef = useRef<HTMLParagraphElement>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const router = useRouter();

  const mainCategory = post.categories?.nodes?.find((cat) => isMainCategory(cat.slug));
  const category = post.categories?.nodes?.find((cat) => !isMainCategory(cat.slug)) || post.categories?.nodes?.[0];
  const postLink = `/${mainCategory?.slug || 'beitraege'}/${category?.slug || 'allgemein'}/${post.slug}`;

  // Neuer Titel = beitragUntertitel (der große 42px-Titel der Beitragsseite).
  // Falls kein Untertitel gesetzt, fällt die Card auf post.title zurück und
  // zeigt dann keine Subline an (sonst wäre Titel = Subline).
  const untertitel = post.beitragFelder?.beitragUntertitel?.trim();
  const titleText = untertitel || post.title;
  const sublineText = untertitel ? post.title : null;

  // Route vorladen, damit beim Klick der Commit (und damit der Morph-Flug) sofort
  // bereitsteht — sonst wartet der Flug auf das Laden der Artikelseite.
  const prefetchArticle = () => {
    try { router.prefetch(postLink); } catch { /* noop */ }
  };

  // Prefetch erst wenn die Card (fast) im Viewport ist — NICHT alle Cards auf einmal
  // beim Mount (das löste einen Request-Sturm aus). Per IntersectionObserver mit
  // großzügigem rootMargin: beim Sliden ist die nächste Card rechtzeitig vorgeladen,
  // ohne off-screen alles gleichzeitig zu prefetchen.
  useEffect(() => {
    const el = cardRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    let done = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (!done && entries.some((e) => e.isIntersecting)) {
          done = true;
          prefetchArticle();
          io.disconnect();
        }
      },
      { rootMargin: '300px' }
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postLink]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    prefetchArticle();
  };

  const startMorph = () => {
    // Hover-Skalierung der Card (scale 1.1) → Morph startet beim gehoverten Zustand
    // (kein Snap), Schrift wird im Helfer mitskaliert (gleicher Umbruch).
    const scale = getElementScale(cardRef.current);
    const items: MorphItemSource[] = [];

    // Visual → article-visual (Rect bereits gehovert-skaliert → Start ohne Snap)
    const visual = captureVisualItem(imageRef.current, post.featuredImage?.node.sourceUrl);
    if (visual) items.push(visual);

    // Text: Zuordnung nach String-Identität.
    // Mit Untertitel: fett (=Untertitel) → article-subtitle, Subline (=post.title) → article-title (pink).
    // Ohne Untertitel: der fette Titel IST post.title → article-title (pink).
    if (sublineText) {
      const bold = captureTextItem(boldRef.current, 'bold', scale);
      if (bold) items.push(bold);
      const italic = captureTextItem(sublineRef.current, 'italic', scale);
      if (italic) items.push(italic);
    } else {
      const italic = captureTextItem(boldRef.current, 'italic', scale);
      if (italic) items.push(italic);
    }

    // Original-Card-Elemente sofort unsichtbar schalten — der abgehobene Anker
    // übernimmt visuell ihre Stelle (kein Doppelbild beim Ausblurren).
    hideSourceEls(imageRef.current, boldRef.current, sublineRef.current);

    startMorphNavigation({ href: postLink, items }, (h) => router.push(h));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current;
    pointerStartRef.current = null;
    if (!start) return;
    // Only treat as click if pointer barely moved (ignore Embla drag gestures)
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (dx * dx + dy * dy > 36) return; // > 6px → drag, ignore
    const target = e.target as HTMLElement;
    if (target.closest('.article-read-link')) return; // innerer Link navigiert selbst
    startMorph();
  };

  return (
    <div
      ref={cardRef}
      className="slide-article-card"
      data-morph-card={post.slug}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onMouseEnter={prefetchArticle}
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
      {/* Visual */}
      <div
        ref={imageRef}
        data-morph-role="visual"
        style={{
          position: 'relative',
          width: '100%',
          height: 210,
          flexShrink: 0,
          transform: categoryTransition === 'out' ? 'scale(0)' : phase1Visible ? 'scale(1)' : 'scale(0)',
          transformOrigin: categoryTransition !== 'idle' ? 'center center' : 'top center',
          filter: categoryTransition === 'out' ? 'blur(0px)' : phase1Visible ? 'blur(0px)' : 'blur(16px)',
          opacity: categoryTransition === 'out' ? 0 : phase1Visible ? 1 : 0,
          transition: categoryTransition === 'out'
            ? 'transform 0.2s ease-in, opacity 0.2s ease-in'
            : categoryTransition === 'in'
            ? 'transform 0.2s ease-out, opacity 0.2s ease-out'
            : `transform ${PHASE_DURATION}s ease, filter ${PHASE_DURATION}s ease, opacity ${PHASE_DURATION}s ease`,
          // willChange entfernt: war permanent auf JEDER Card → 200+ GPU-
          // Backing-Stores auf der Landing reservieren = Mobile-OOM-Risiko.
          // Browser auto-promoten Transforms während Animation eh.
        }}
      >
        <div
          data-card-image-bg
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            background: post.featuredImage?.node.sourceUrl ? 'transparent' : 'var(--color-placeholder-bg)',
          }}
        >
          {post.featuredImage?.node.sourceUrl && (
            <img
              src={post.featuredImage.node.sourceUrl}
              alt={post.featuredImage.node.altText || ''}
              loading="lazy"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                zIndex: 1,
                display: 'block',
              }}
            />
          )}
        </div>
      </div>

      {/* Text + Footer */}
      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        opacity: categoryTransition === 'out' ? 0 : phase2Visible ? 1 : 0,
        transition: categoryTransition === 'out'
          ? 'opacity 0.2s ease-in'
          : `opacity ${PHASE_DURATION}s ease`,
      }}>
        <div style={{
          width: '100%',
          padding: '13px 23px 0',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {sublineText && (
            <p
              ref={sublineRef}
              data-morph-role="italic"
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
            ref={boldRef}
            data-morph-role={sublineText ? 'bold' : 'italic'}
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
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {titleText}
          </p>
        </div>

        {/* Tool-Labels — zwischen fettem Text und „Ratgeber lesen" */}
        {post.tools && post.tools.length > 0 && (
          <div style={{
            width: '100%',
            padding: '0 23px',
            margin: '6px 0',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            flexShrink: 0,
          }}>
            {post.tools.map((t) => (
              <span key={t} style={{
                background: TOOL_DOT_COLORS[t],
                color: '#fff',
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                fontWeight: 600,
                lineHeight: 1,
                padding: '5px 10px',
                letterSpacing: '0.02em',
              }}>
                {TOOL_LABEL[t]}
              </span>
            ))}
          </div>
        )}

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
    </div>
  );
}

// memo: Cards re-rendern sonst bei jedem Eltern-Re-Render der ArticleSlider
// (z.B. wenn setSlideStyles updates feuert oder Provider-Context-Value wechselt
// auf isOpen-Flip). Mit memo nur noch wenn props (post/index/phase*) tatsächlich
// ändern — auf Mobile mit vielen Cards spürbar weniger React-Reconciliation.
const SlideArticleCard = memo(SlideArticleCardImpl);
export default SlideArticleCard;
