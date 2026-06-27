'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import gsap from '@/lib/gsapConfig';

/**
 * Rechtsbündiger Überschrift-Schriftzug unter der Slider-Überschrift.
 * Ruhe: „Wählen Sie eine Kategorie:".
 * Aktiv (Kategorie gewählt): morpht per Schreibmaschinen-Animation zu
 * „Kategorie schließen ✕" — „Wählen Sie eine " + „:" faden buchstabenweise aus
 * und kollabieren, „ schließen" fadet buchstabenweise ein, dann zeichnet sich
 * das X (Kreis + zwei Linien) Strich für Strich.
 */
const PREFIX = 'Wählen Sie eine ';
const ANCHOR = 'Kategorie';
const SUFFIX = ' schließen';

// Stil wie die Beschreibung unter „Ratgeber": Merriweather 18px italic, text-medium.
const TEXT_STYLE: React.CSSProperties = {
  fontFamily: 'Merriweather, serif',
  fontSize: 18,
  fontStyle: 'italic',
  color: 'var(--color-text-medium)',
  whiteSpace: 'pre',
  lineHeight: 1,
};

export default function SliderHeadingSubtitle({ active, onClose }: { active: boolean; onClose?: () => void }) {
  const prefixRef = useRef<HTMLSpanElement>(null);
  const suffixRef = useRef<HTMLSpanElement>(null);
  const colonRef = useRef<HTMLSpanElement>(null);
  const xWrapRef = useRef<HTMLSpanElement>(null);
  const xRef = useRef<SVGSVGElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  // Timeline einmal aufbauen (nach Messung der natürlichen Breiten).
  useLayoutEffect(() => {
    const prefix = prefixRef.current, suffix = suffixRef.current, colon = colonRef.current, xWrap = xWrapRef.current, x = xRef.current;
    if (!prefix || !suffix || !colon || !xWrap || !x) return;

    const suffixW = suffix.scrollWidth;
    const xW = xWrap.scrollWidth;
    const prefixChars = prefix.querySelectorAll('.fl-ch');
    const suffixChars = suffix.querySelectorAll('.fl-ch');
    const xStrokes = x.querySelectorAll('.fl-stroke');

    // overflow:hidden auf allen kollabierenden/expandierenden Teilen → die Zeichen
    // werden sauber geclippt statt „Kategorie" zu überlappen.
    gsap.set([prefix, colon], { overflow: 'hidden' });
    // Ruhezustand: Suffix + X kollabiert/unsichtbar.
    gsap.set(suffix, { width: 0, overflow: 'hidden' });
    gsap.set(suffixChars, { opacity: 0 });
    gsap.set(xWrap, { width: 0, overflow: 'hidden' });
    gsap.set(xStrokes, { strokeDashoffset: 1 });

    const tl = gsap.timeline({ paused: true });
    // 1) „Wählen Sie eine " + „:" buchstabenweise raus + kollabieren
    tl.to(prefixChars, { opacity: 0, duration: 0.18, ease: 'power1.in', stagger: { each: 0.025, from: 'end' } }, 0);
    tl.to(colon, { opacity: 0, duration: 0.15 }, 0);
    tl.to([prefix, colon], { width: 0, duration: 0.32, ease: 'power2.inOut' }, 0.12);
    // 2) „ schließen" einfaden + ausklappen
    tl.to(suffix, { width: suffixW, duration: 0.32, ease: 'power2.inOut' }, 0.34);
    tl.to(suffixChars, { opacity: 1, duration: 0.16, ease: 'power1.out', stagger: { each: 0.03, from: 'start' } }, 0.4);
    // 3) X einzeichnen (Strich für Strich)
    tl.to(xWrap, { width: xW, duration: 0.22, ease: 'power2.out' }, 0.62);
    tl.to(xStrokes, { strokeDashoffset: 0, duration: 0.22, ease: 'power1.inOut', stagger: 0.14 }, 0.7);

    tlRef.current = tl;
    return () => { tl.kill(); tlRef.current = null; };
  }, []);

  // Auf active reagieren.
  useEffect(() => {
    const tl = tlRef.current;
    if (!tl) return;
    if (active) tl.play(); else tl.reverse();
  }, [active]);

  return (
    <div
      onClick={active ? onClose : undefined}
      style={{
        ...TEXT_STYLE,
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 6,
        cursor: active ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      <span ref={prefixRef} style={{ display: 'inline-flex' }}>
        {PREFIX.split('').map((c, i) => (
          <span key={i} className="fl-ch" style={{ whiteSpace: 'pre' }}>{c}</span>
        ))}
      </span>
      <span>{ANCHOR}</span>
      <span ref={suffixRef} style={{ display: 'inline-flex' }}>
        {SUFFIX.split('').map((c, i) => (
          <span key={i} className="fl-ch" style={{ whiteSpace: 'pre' }}>{c}</span>
        ))}
      </span>
      <span ref={xWrapRef} style={{ display: 'inline-flex', alignItems: 'center' }}>
        <svg ref={xRef} width={19} height={19} viewBox="0 0 24 24" fill="none" aria-hidden style={{ marginLeft: 7, display: 'block' }}>
          <circle className="fl-stroke" cx={12} cy={12} r={10} pathLength={1} stroke="currentColor" strokeWidth={1.5}
            style={{ strokeDasharray: 1, strokeDashoffset: 1 }} />
          <line className="fl-stroke" x1={8.5} y1={8.5} x2={15.5} y2={15.5} pathLength={1} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"
            style={{ strokeDasharray: 1, strokeDashoffset: 1 }} />
          <line className="fl-stroke" x1={15.5} y1={8.5} x2={8.5} y2={15.5} pathLength={1} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"
            style={{ strokeDasharray: 1, strokeDashoffset: 1 }} />
        </svg>
      </span>
      <span ref={colonRef} style={{ display: 'inline-flex', whiteSpace: 'pre' }}>:</span>
    </div>
  );
}
