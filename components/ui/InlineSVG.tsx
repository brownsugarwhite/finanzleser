'use client';

import { useEffect, useRef, useState } from 'react';

interface InlineSVGProps {
  src: string;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}

let idCounter = 0;

export default function InlineSVG({ src, className, style, alt }: InlineSVGProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const uniqueId = useRef(`svg-${++idCounter}-${Math.random().toString(36).slice(2, 7)}`);

  const isSVG = src?.toLowerCase().endsWith('.svg');

  useEffect(() => {
    if (!isSVG || !src) return;

    const loadSVG = async () => {
      try {
        const response = await fetch(src);
        const svgText = await response.text();

        if (containerRef.current) {
          const parser = new DOMParser();
          const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
          const svgElement = svgDoc.documentElement;
          const prefix = uniqueId.current;

          // Scope CSS class names to prevent conflicts between multiple inline SVGs
          const styleElements = svgDoc.querySelectorAll('style');
          styleElements.forEach((styleEl) => {
            if (styleEl.textContent) {
              styleEl.textContent = styleEl.textContent.replace(
                /\.(cls-\d+)/g,
                `.${prefix}-$1`
              );
            }
          });

          // Update class attributes to match scoped names
          const allElements = svgDoc.querySelectorAll('*');
          allElements.forEach((el) => {
            el.setAttribute('vector-effect', 'non-scaling-stroke');

            const classList = el.getAttribute('class');
            if (classList) {
              const scopedClasses = classList
                .split(/\s+/)
                .map((c) => (c.match(/^cls-\d+$/) ? `${prefix}-${c}` : c))
                .join(' ');
              el.setAttribute('class', scopedClasses);
            }
          });

          // Responsive sizing — maintain aspect ratio within container
          svgElement.setAttribute('width', '100%');
          svgElement.setAttribute('height', '100%');
          svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
          svgElement.style.width = '100%';
          svgElement.style.height = '100%';
          svgElement.style.display = 'block';

          const serializer = new XMLSerializer();
          const modifiedSVG = serializer.serializeToString(svgElement);
          containerRef.current.innerHTML = modifiedSVG;
        }
      } catch {
        setError(true);
      }
    };

    loadSVG();
  }, [src, isSVG]);

  // Fallback for non-SVG images
  if (!isSVG || error) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt || ''}
        className={className}
        style={{ width: '100%', height: '100%', objectFit: 'cover', ...style }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={style}
      role="img"
      aria-label={alt || ''}
    />
  );
}
