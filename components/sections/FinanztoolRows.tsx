'use client';

import { Fragment, useEffect, useState } from 'react';
import Link from 'next/link';
import SparkDivider from '@/components/ui/SparkDivider';
import SliderHoverBox from '@/components/ui/SliderHoverBox';
import { useSliderHoverBox } from '@/lib/hooks/useSliderHoverBox';

export interface ToolItem {
  title: string;
  desc: string;
  href: string;
}

const LINE = 35;

function ToolItemCell({ item, cta }: { item: ToolItem; cta: string }) {
  return (
    <Link href={item.href} className="finanztool-item">
      <span className="finanztool-item-title" lang="de">{item.title}</span>
      {item.desc && <span className="finanztool-item-desc" lang="de">{item.desc}</span>}
      <span className="article-read-link finanztool-cta">
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap' }}>{cta}</span>
        <span className="article-read-line" style={{ height: 0, borderTop: '1px solid currentColor', flexShrink: 0 }} />
        <svg width="8" height="8" viewBox="0 0 17.45 15.77" fill="none" aria-hidden style={{ flexShrink: 0, transform: 'rotate(180deg)', marginLeft: '-12px' }}>
          <polyline points="16.95 15.27 8.27 8.11 16.95 .5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" vectorEffect="non-scaling-stroke" />
        </svg>
      </span>
    </Link>
  );
}

export default function FinanztoolRows({ items, cta, perRow = 3 }: { items: ToolItem[]; cta: string; perRow?: number }) {
  const PER_ROW = perRow;
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1023px)');
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // Hover-Box EXAKT wie der Slider: die echten Spark-Divider sind die Anker
  // (registerSpark) — das Duplikat zeichnet nur die Verlängerung zur Ecke.
  const hover = useSliderHoverBox({ cardSelector: '.finanztool-item', enabled: !isMobile, restLen: LINE });

  const rows: ToolItem[][] = [];
  for (let i = 0; i < items.length; i += PER_ROW) rows.push(items.slice(i, i + PER_ROW));

  return (
    <div className="finanztool-rows" onMouseLeave={hover.leaveRegion}>
      {rows.map((row, ri) => (
        <Fragment key={ri}>
          {ri > 0 && (
            <div className="finanztool-row-divider"><SparkDivider orientation="horizontal" lineLength={LINE} /></div>
          )}
          <div className="finanztool-row">
            {row.map((it, ci) => {
              const idx = ri * PER_ROW + ci;
              return (
                <Fragment key={it.href}>
                  {ci > 0 && (
                    <SparkDivider
                      orientation="vertical"
                      lineLength={LINE}
                      sparkRef={(el) => hover.registerSpark(idx - 1, el)}
                      style={{ alignSelf: 'center', margin: '0 21px' }}
                    />
                  )}
                  <div
                    className="finanztool-cell"
                    style={{ position: 'relative', flex: 1, minWidth: 0, display: 'flex' }}
                    ref={(el) => hover.registerCard(idx, el)}
                    onMouseEnter={() => hover.onEnter(idx)}
                    onMouseLeave={() => hover.onLeave(idx)}
                  >
                    <SliderHoverBox index={idx} gap={54} register={hover.registerBox} />
                    <ToolItemCell item={it} cta={cta} />
                  </div>
                </Fragment>
              );
            })}
            {Array.from({ length: PER_ROW - row.length }).map((_, i) => (
              <div key={`pad-${i}`} style={{ flex: 1 }} aria-hidden />
            ))}
          </div>
        </Fragment>
      ))}
    </div>
  );
}
