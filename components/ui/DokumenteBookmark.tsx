'use client';

/**
 * Dokumente-Lesezeichen oben links in einer Artikel-Card. Legt sich über die
 * obere linke Ecke des Hover-Kastens:
 * - Fill (Seiten-BG) ist RECHTSBÜNDIG an der Outline und ragt links über sie
 *   hinaus → maskiert die darunterliegende Box-Linie sauber aus.
 * - Outline (dark, exakt 1px, non-scaling) zeichnet den Rahmen.
 * - „Dokumente" zentriert, dark, 12px (wie die Tool-Labels).
 */
const H = 24;            // etwas kleiner als die Original-SVGs (30)
const OUT_W = 112;       // 140 × 24/30 (uniform skaliert)
const FILL_W = 120;      // 145 × 24/29
const TEXT_W = 98;       // rechteckiger Teil vor dem Chevron

export default function DokumenteBookmark() {
  return (
    <div style={{ position: 'relative', width: OUT_W, height: H }}>
      {/* Fill — rechtsbündig (right:0), ragt links über die Outline */}
      <svg width={FILL_W} height={H} viewBox="0 0 145 29" fill="none" aria-hidden style={{ position: 'absolute', top: 0, right: 0, display: 'block' }}>
        <path d="M145 0H0V29H145L130.5 14.5L145 0Z" fill="var(--color-bg-page)" />
      </svg>
      {/* Outline — 1px, skaliert NICHT mit */}
      <svg width={OUT_W} height={H} viewBox="0 0 140 30" fill="none" aria-hidden style={{ position: 'absolute', top: 0, left: 0, display: 'block' }}>
        <path d="M0 0.5H138L123.5 15L138 29.5H0" stroke="var(--color-text-primary)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
      </svg>
      <span style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: TEXT_W,
        height: H,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-body)',
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.02em',
        lineHeight: 1,
        color: 'var(--color-text-primary)',
      }}>
        Dokumente
      </span>
    </div>
  );
}
