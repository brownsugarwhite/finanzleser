'use client';

import { memo, useRef, useEffect, useState } from 'react';
import Link from 'next/link';

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
  active?: boolean;

  titleWidth?: number;
  fluidWidth?: boolean;
}

const CARD_WIDTH = 350;
const CARD_WIDTH_MOBILE = 290;
const T1 = 0.3; // Phase 1 duration (content collapse)
const T2 = 0.3; // Phase 2 duration (width + font)

function SlideCategoryCardImpl({ category, parentSlug, active = false, titleWidth: titleWidthProp, fluidWidth = false }: SlideCategoryCardProps) {
  const categoryLink = `/${parentSlug}/${category.slug}/`;

  // 2-phase: width changes delayed when collapsing, immediate when expanding
  const [phase2Active, setPhase2Active] = useState(false);
  const phase2Timer = useRef<ReturnType<typeof setTimeout>>(null);
  const [cardHovered, setCardHovered] = useState(false);
  const [hoverCapable, setHoverCapable] = useState(true);
  useEffect(() => {
    const mql = window.matchMedia('(hover: hover)');
    setHoverCapable(mql.matches);
    const handler = (e: MediaQueryListEvent) => setHoverCapable(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (phase2Timer.current) clearTimeout(phase2Timer.current);
    if (active) {
      // Collapse: delay phase 2 (width shrink)
      phase2Timer.current = setTimeout(() => setPhase2Active(true), T1 * 1000);
    } else {
      // Expand: width first (immediate), content delayed
      setPhase2Active(false);
    }
    return () => { if (phase2Timer.current) clearTimeout(phase2Timer.current); };
  }, [active]);

  const [measuredTitleWidth, setMeasuredTitleWidth] = useState(CARD_WIDTH);

  // Measure title at collapsed font (16px/600) using hidden element
  useEffect(() => {
    if (titleWidthProp !== undefined) return;
    const el = document.createElement('span');
    el.style.cssText = `
      position: absolute; visibility: hidden; white-space: nowrap;
      font-family: var(--font-heading, 'Merriweather', serif);
      font-size: 16px; font-weight: 600; line-height: 1.3;
    `;
    el.textContent = category.name;
    document.body.appendChild(el);
    setMeasuredTitleWidth(el.offsetWidth + 4);
    document.body.removeChild(el);
  }, [category.name, titleWidthProp]);

  const titleWidth = titleWidthProp ?? measuredTitleWidth;

  const baseCardWidth = isMobile ? CARD_WIDTH_MOBILE : CARD_WIDTH;
  const cardWidth = phase2Active ? `${titleWidth}px` : (fluidWidth ? '100%' : `${baseCardWidth}px`);

  const phase1Delay = active ? 0 : T2;
  const phase1Ease = active ? 'ease-in' : 'ease-out';
  const phase2Ease = active ? 'ease-out' : 'ease-in';

  return (
    <div
      data-slider-card
      onMouseEnter={() => setCardHovered(true)}
      onMouseLeave={() => setCardHovered(false)}
      style={{
        width: cardWidth,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        userSelect: 'none',
        WebkitUserSelect: 'none',
        paddingBottom: 5,
        // Hover-Scale nur im Card-Mode (nicht im Button-Mode, wo die Card
        // zusammenklappt).
        transform: cardHovered && !active && hoverCapable ? 'scale(1.1)' : 'scale(1)',
        transition: `width ${T2}s ${phase2Ease}, transform 0.3s ease`,
      }}
    >
      {/* Visual — Wrapper kollabiert Höhe 260→0, Inner scaled uniform + blurred */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: active ? 0 : 260,
        overflow: 'hidden',
        transition: `height ${T1}s ${phase1Ease} ${phase1Delay}s`,
      }}>
        <div style={{
          position: 'relative',
          width: '100%',
          height: 260,
          background: 'var(--color-placeholder-bg)',
          transform: active ? 'scale(0)' : 'scale(1)',
          transformOrigin: 'top center',
          filter: active ? 'blur(16px)' : 'blur(0px)',
          opacity: active ? 0 : 1,
          transition: `transform ${T1}s ${phase1Ease} ${phase1Delay}s, filter ${T1}s ${phase1Ease} ${phase1Delay}s, opacity ${T1}s ${phase1Ease} ${phase1Delay}s`,
          // willChange entfernt — siehe SlideArticleCard.
        }}>
          {/* Article-Count-Badge */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: 13,
              right: 13,
              width: 32,
              height: 32,
              borderRadius: 13,
              background: 'var(--color-text-primary)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "Merriweather, serif",
              fontStyle: 'italic',
              fontSize: 18,
              fontWeight: 500,
              pointerEvents: 'none',
            }}
          >
            {category.count}
          </div>
        </div>
      </div>

      {/* Title + Arrow-Button (rechts neben Titel wenn nicht collapsed) */}
      <div style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: phase2Active ? 0 : '0 23px',
        marginTop: phase2Active ? 0 : 27,
        boxSizing: 'border-box',
        transition: `padding ${T2}s ${phase2Ease}, margin ${T2}s ${phase2Ease}`,
      }}>
        <p
          lang="de"
          style={{
            fontFamily: "var(--font-heading, 'Merriweather', serif)",
            fontWeight: phase2Active ? 600 : 700,
            fontSize: phase2Active ? '16px' : '20px',
            lineHeight: 1.3,
            color: (active && cardHovered) ? 'var(--color-brand-secondary)' : 'var(--color-text-primary)',
            margin: 0,
            padding: 0,
            whiteSpace: 'nowrap',
            transition: `font-size ${T2}s ${phase2Ease}, font-weight ${T2}s ${phase2Ease}, color 0.15s ease`,
          }}
        >
          <span style={{ color: 'inherit' }}>
            {category.name}
          </span>
        </p>
        <Link href={categoryLink} onClick={(e) => e.stopPropagation()} style={{
          flexShrink: 0,
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
          // Opacity folgt Phase 1 (faded beim Collapse sofort, beim Expand verzögert um T2).
          // max-width folgt Phase 2 (läuft synchron zur Card-Breite).
          maxWidth: phase2Active ? 0 : 60,
          opacity: active ? 0 : 1,
          overflow: 'hidden',
          transition: `max-width ${T2}s ${phase2Ease}, opacity ${T1}s ${phase1Ease} ${phase1Delay}s`,
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

// memo: Card re-rendert sonst bei jedem SubcategorySlider-Re-Render
// (z.B. setSlideStyles-Update via Embla-Scroll). Mit memo nur noch wenn
// props (category/active/titleWidth) tatsächlich ändern.
const SlideCategoryCard = memo(SlideCategoryCardImpl);
export default SlideCategoryCard;
