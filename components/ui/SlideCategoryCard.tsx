'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import InlineSVG from '@/components/ui/InlineSVG';

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
  selected?: boolean;
  onClose?: () => void;
  titleWidth?: number;
}

const CARD_WIDTH = 320;
const T1 = 0.3; // Phase 1 duration (content collapse)
const T2 = 0.3; // Phase 2 duration (width + font)

export default function SlideCategoryCard({ category, parentSlug, active = false, selected = false, onClose, titleWidth: titleWidthProp }: SlideCategoryCardProps) {
  const categoryLink = `/${parentSlug}/${category.slug}/`;

  // 2-phase: width changes delayed when collapsing, immediate when expanding
  const [phase2Active, setPhase2Active] = useState(false);
  const phase2Timer = useRef<ReturnType<typeof setTimeout>>(null);

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

  const cardWidth = phase2Active ? `${titleWidth}px` : `${CARD_WIDTH}px`;

  const phase1Delay = active ? 0 : T2;
  const phase1Ease = active ? 'ease-in' : 'ease-out';
  const phase2Ease = active ? 'ease-out' : 'ease-in';

  return (
    <div
      data-slider-card
      style={{
        width: cardWidth,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        userSelect: 'none',
        WebkitUserSelect: 'none',
        transition: `width ${T2}s ${phase2Ease}`,
      }}
    >
      {/* Visual — grauer Platzhalter */}
      <div style={{
        width: '100%',
        height: active ? 0 : 220,
        background: 'rgba(0, 0, 0, 0.08)',
        opacity: active ? 0 : 1,
        transition: `height ${T1}s ${phase1Ease} ${phase1Delay}s, opacity ${T1}s ${phase1Ease} ${phase1Delay}s`,
      }} />

      {/* Title */}
      <p
        lang="de"
        style={{
          fontFamily: "var(--font-heading, 'Merriweather', serif)",
          fontWeight: phase2Active ? 600 : 700,
          fontSize: phase2Active ? '16px' : '20px',
          lineHeight: 1.3,
          color: 'var(--color-text-primary)',
          margin: 0,
          padding: phase2Active ? 0 : '0 23px',
          whiteSpace: 'nowrap',
          width: 'fit-content',
          marginTop: phase2Active ? 0 : 27,
          boxSizing: 'border-box',
          transition: `padding ${T2}s ${phase2Ease}, margin ${T2}s ${phase2Ease}, font-size ${T2}s ${phase2Ease}, font-weight ${T2}s ${phase2Ease}`,
        }}
      >
        <span style={{ paddingRight: active ? 0 : 10 }}>
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
          width: '100%',
          overflow: 'hidden',
          maxHeight: active ? 0 : 100,
          opacity: active ? 0 : 1,
          padding: '0 23px',
          marginTop: active ? 0 : 10,
          transition: `max-height ${T1}s ${phase1Ease} ${phase1Delay}s, opacity ${T1}s ${phase1Ease} ${phase1Delay}s, margin ${T1}s ${phase1Ease} ${phase1Delay}s`,
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
        width: '100%',
        overflow: 'hidden',
        maxHeight: active ? 0 : 60,
        opacity: active ? 0 : 1,
        padding: active ? 0 : '10px 23px',
        transition: `max-height ${T1}s ${phase1Ease} ${phase1Delay}s, opacity ${T1}s ${phase1Ease} ${phase1Delay}s, padding ${T1}s ${phase1Ease} ${phase1Delay}s`,
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
