'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import gsap from '@/lib/gsapConfig';

/**
 * Rechtsbündiger Überschrift-Schriftzug unter der Slider-Überschrift.
 * Ruhe: „Wählen Sie eine Kategorie:".
 * Aktiv: morpht zu „Kategorie schließen ✕". Altes („Wählen Sie eine " + „:")
 * fadet buchstabenweise aus, WÄHREND „ schließen" buchstabenweise einfadet
 * (überlappender Typewriter), dann zeichnet sich das X Strich für Strich.
 *
 * Die Breiten werden NACH dem Font-Load gemessen (document.fonts.ready) — sonst
 * sind sie mit der Fallback-Schrift gemessen und z. B. das X zeichnet sich nicht
 * ein (war erst nach einem Reload korrekt).
 */
const PREFIX = 'Wählen Sie eine ';
const ANCHOR = 'Kategorie';
const SUFFIX = ' schließen';

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
  const activeRef = useRef(active);
  activeRef.current = active;

  // Ruhezustand SOFORT setzen (kein kurzes Aufblitzen des vollen Textes).
  useLayoutEffect(() => {
    const prefix = prefixRef.current, suffix = suffixRef.current, colon = colonRef.current, xWrap = xWrapRef.current, x = xRef.current;
    if (!prefix || !suffix || !colon || !xWrap || !x) return;
    gsap.set([prefix, colon, suffix, xWrap], { overflow: 'hidden' });
    gsap.set(suffix, { width: 0 });
    gsap.set(suffix.querySelectorAll('.fl-ch'), { opacity: 0 });
    gsap.set(xWrap, { width: 0 });
    gsap.set(x.querySelectorAll('.fl-stroke'), { strokeDashoffset: 1 });
  }, []);

  // Timeline nach dem Font-Load bauen (korrekte Breiten).
  useEffect(() => {
    let cancelled = false;
    const build = () => {
      if (cancelled) return;
      const prefix = prefixRef.current, suffix = suffixRef.current, colon = colonRef.current, xWrap = xWrapRef.current, x = xRef.current;
      if (!prefix || !suffix || !colon || !xWrap || !x) return;

      const prefixChars = prefix.querySelectorAll('.fl-ch');
      const suffixChars = suffix.querySelectorAll('.fl-ch');
      const xStrokes = x.querySelectorAll('.fl-stroke');

      // Natürliche Zielbreiten messen: kurz ausklappen, lesen, wieder einklappen
      // (synchron, kein Paint dazwischen → kein Flackern).
      const prefixW = prefix.scrollWidth;
      const colonW = colon.scrollWidth;
      gsap.set([suffix, xWrap], { width: 'auto' });
      const suffixW = suffix.scrollWidth;
      const xW = xWrap.scrollWidth;
      gsap.set([suffix, xWrap], { width: 0 });
      gsap.set(prefix, { width: prefixW });
      gsap.set(colon, { width: colonW });

      tlRef.current?.kill();
      const tl = gsap.timeline({ paused: true });
      // ── alles SIMULTAN ab 0: altes raus + neues rein (überlappender Typewriter) ──
      tl.to(prefixChars, { opacity: 0, duration: 0.28, ease: 'power1.in', stagger: { each: 0.022, from: 'end' } }, 0);
      tl.to(colon, { opacity: 0, duration: 0.18 }, 0);
      tl.to([prefix, colon], { width: 0, duration: 0.5, ease: 'power3.inOut' }, 0);
      tl.to(suffix, { width: suffixW, duration: 0.5, ease: 'power3.inOut' }, 0);
      tl.to(suffixChars, { opacity: 1, duration: 0.28, ease: 'power1.out', stagger: { each: 0.022, from: 'start' } }, 0.06);
      // X zeichnet sich gegen Ende ein (Container öffnet, dann Striche).
      tl.to(xWrap, { width: xW, duration: 0.26, ease: 'power2.out' }, 0.34);
      tl.to(xStrokes, { strokeDashoffset: 0, duration: 0.3, ease: 'power1.inOut', stagger: 0.12 }, 0.4);

      tlRef.current = tl;
      if (activeRef.current) tl.progress(1); // falls beim Bauen schon aktiv
    };

    const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts;
    if (fonts?.ready) fonts.ready.then(build); else build();
    return () => { cancelled = true; tlRef.current?.kill(); tlRef.current = null; };
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
      {/* Ruhezustand bereits im SSR-HTML: suffix + X eingeklappt (width:0) → kein Snap,
          wenn der Client-useLayoutEffect nachzieht. */}
      <span ref={suffixRef} style={{ display: 'inline-flex', width: 0, overflow: 'hidden' }}>
        {SUFFIX.split('').map((c, i) => (
          <span key={i} className="fl-ch" style={{ whiteSpace: 'pre', opacity: 0 }}>{c}</span>
        ))}
      </span>
      <span ref={xWrapRef} style={{ display: 'inline-flex', alignItems: 'center', width: 0, overflow: 'hidden' }}>
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
