'use client';

import type { CSSProperties } from 'react';

/**
 * Dekoration zwischen zwei Slider-Cards: vertikale Linie oben + Spark + Linie
 * unten, vertikal mittig (Flex-Spalte). Die variantenspezifischen Styles werden
 * vom jeweiligen Slider berechnet und durchgereicht (Optik 1:1).
 *
 * sparkRef erlaubt dem Hover-Box-Hook, die echte Spark-Position zu messen
 * (Box-Kanten richten sich exakt daran aus).
 */
export interface SliderEdgeSparkProps {
  wrapperStyle: CSSProperties;
  topLineStyle: CSSProperties;
  bottomLineStyle: CSSProperties;
  sparkStyle?: CSSProperties;
  topLineRef?: (el: HTMLDivElement | null) => void;
  bottomLineRef?: (el: HTMLDivElement | null) => void;
  sparkRef?: (el: SVGSVGElement | null) => void;
}

const SPARK_PATH =
  'M12 6.00047C10.3384 5.64978 8.28716 5.41362 7.24241 3.91374C6.47491 2.81169 6.27276 1.28871 6.00024 0.000471365C5.61861 1.71435 5.40087 3.79684 3.79407 4.83384C2.69548 5.54325 1.25351 5.72142 0 6.01226C1.28705 6.29225 2.79561 6.48692 3.89751 7.25194C5.4174 8.30686 5.61672 10.3366 6.00024 12.0005C6.17594 11.1204 6.33322 10.2272 6.62463 9.37638C7.27878 7.46453 8.37832 6.85223 10.2643 6.37379L12 6.00047Z';

export default function SliderEdgeSpark({
  wrapperStyle,
  topLineStyle,
  bottomLineStyle,
  sparkStyle,
  topLineRef,
  bottomLineRef,
  sparkRef,
}: SliderEdgeSparkProps) {
  return (
    <div style={wrapperStyle}>
      <div ref={topLineRef} style={topLineStyle} />
      <svg
        ref={sparkRef}
        width="12"
        height="12"
        viewBox="0 0 12 12.0005"
        fill="none"
        aria-hidden
        style={sparkStyle}
      >
        <path d={SPARK_PATH} fill="var(--fill-0, #334A27)" />
      </svg>
      <div ref={bottomLineRef} style={bottomLineStyle} />
    </div>
  );
}
