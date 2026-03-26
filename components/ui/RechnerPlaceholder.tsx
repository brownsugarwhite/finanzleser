'use client';

import { useEffect, useRef } from 'react';

export default function RechnerPlaceholder() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadSVG = async () => {
      try {
        const response = await fetch('/assets/visuals/rechner_placeholder.svg');
        const svgText = await response.text();

        if (containerRef.current) {
          // Parse SVG and add vector-effect to prevent stroke scaling
          const parser = new DOMParser();
          const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
          const svgElement = svgDoc.documentElement;

          // Apply vector-effect="non-scaling-stroke" to all elements
          const allElements = svgDoc.querySelectorAll('*');
          allElements.forEach((el) => {
            el.setAttribute('vector-effect', 'non-scaling-stroke');
          });

          // Add responsive styling to SVG
          svgElement.setAttribute('style', 'width: 100%; height: auto; max-width: 400px;');

          // Convert back to string and set as innerHTML
          const serializer = new XMLSerializer();
          const modifiedSVG = serializer.serializeToString(svgElement);
          containerRef.current.innerHTML = modifiedSVG;
        }
      } catch (error) {
        console.error('Error loading SVG:', error);
      }
    };

    loadSVG();
  }, []);

  return <div ref={containerRef} />;
}
