"use client";

import { useEffect, useRef, useState } from "react";

const LEFT_EYE = { cx: 158.34, cy: 450.80 };
const RIGHT_EYE = { cx: 413.69, cy: 450.80 };
const PUPIL_RADIUS = 80;
const MAX_OFFSET = 23;
const COLOR = "#000000";

interface LeoCharacterProps {
  /** Breite des Head-SVG in px (Default 44, im Chat-Overlay z.B. 56). */
  headWidth?: number;
  /** Breite des Mouth-SVG in px (Default 46). */
  mouthWidth?: number;
  /** Mouth marginBottom (Default -13, sorgt für die Mund-Kerbe an der Bubble-Unterkante). */
  mouthMarginBottom?: number;
  /** Eye-Tracking + Hover-Pupillen aktivieren — nur Desktop, Default false. */
  trackPupils?: boolean;
}

/** Leo-Charakter (Kopf + Augen + Mund) als wiederverwendbare Sub-Komponente.
 *  Wird in LeoIcon (Bubble-Charakter, fixe 44px) und im Chat-Overlay
 *  (90×90 Icon-Leo) verwendet. Pupil-Tracking via Prop opt-in (nur Desktop). */
export default function LeoCharacter({
  headWidth = 44,
  mouthWidth = 46,
  mouthMarginBottom = -13,
  trackPupils = false,
}: LeoCharacterProps) {
  const headRef = useRef<HTMLDivElement>(null);
  const wasInWindow = useRef(true);
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
  const [smooth, setSmooth] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Pupil tracking + Hover — nur wenn explizit eingeschaltet (= Desktop).
  useEffect(() => {
    if (!trackPupils) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!wasInWindow.current) {
        wasInWindow.current = true;
        setSmooth(true);
        requestAnimationFrame(() => requestAnimationFrame(() => setSmooth(false)));
      }
      if (!headRef.current) return;
      const rect = headRef.current.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist === 0) return;
      const clamp = Math.min(dist, 400) / 400;
      setPupilOffset({
        x: (dx / dist) * MAX_OFFSET * clamp,
        y: (dy / dist) * MAX_OFFSET * clamp,
      });
    };
    const handleMouseLeave = () => {
      wasInWindow.current = false;
      setSmooth(true);
      setPupilOffset({ x: 0, y: 0 });
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [trackPupils]);

  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}
      onMouseEnter={() => { if (trackPupils) setIsHovered(true); }}
      onMouseLeave={() => { if (trackPupils) setIsHovered(false); }}
    >
      <div ref={headRef} style={{ position: "relative", display: "flex", alignItems: "flex-end" }}>
        <svg viewBox="0 0 564.09 533.81" style={{ width: headWidth }}>
          <path
            d="M279.08,181.17C-49.69,181.17,3.12,533.81,3.12,533.81l85.65-2.08c-22.75-19.57-37.16-48.57-37.16-80.93,0-58.94,47.78-106.73,106.73-106.73s106.73,47.78,106.73,106.73c0,30.5-12.8,58.02-33.32,77.47l105.91-2.57c-18.98-19.27-30.7-45.71-30.7-74.9,0-58.94,47.78-106.73,106.73-106.73s106.73,47.78,106.73,106.73c0,27.32-10.27,52.24-27.16,71.12l68.62-1.66s45.95-339.08-282.82-339.08Z"
            fill={COLOR}
          />
          <path
            d="M279.92,214.41c-5.25-39.35-14.6-77.6-27.65-113.12,20.17-6.05,61.44-8.32,61.44-8.32,0,0-47.54-40.18-71.32-60.27,17.49-6.44,32.99-16.88,50.48-23.32"
            fill="none"
            stroke={COLOR}
            strokeMiterlimit={10}
            strokeWidth={30}
          />
        </svg>
        <svg
          viewBox="0 0 564.09 533.81"
          style={{ position: "absolute", top: 0, left: 0, width: headWidth, height: "100%", pointerEvents: "none", overflow: "visible" }}
        >
          <circle
            cx={LEFT_EYE.cx + pupilOffset.x}
            cy={LEFT_EYE.cy + pupilOffset.y}
            r={isHovered ? PUPIL_RADIUS * 0.6 : PUPIL_RADIUS}
            fill={COLOR}
            style={{ transition: `r 0.25s ease${smooth ? ", cx 0.3s ease, cy 0.3s ease" : ""}` }}
          />
          <circle
            cx={RIGHT_EYE.cx + pupilOffset.x}
            cy={RIGHT_EYE.cy + pupilOffset.y}
            r={isHovered ? PUPIL_RADIUS * 0.6 : PUPIL_RADIUS}
            fill={COLOR}
            style={{ transition: `r 0.25s ease${smooth ? ", cx 0.3s ease, cy 0.3s ease" : ""}` }}
          />
        </svg>
      </div>
      <div>
        <svg viewBox="0 0 604.6 469.6" style={{ width: mouthWidth, display: "block", marginBottom: mouthMarginBottom }}>
          <polygon
            points="2 479.1 76.8 0 171.7 157.9 297.7 8.1 432.7 155.2 534.2 0 605 483.6 2 479.1"
            fill={COLOR}
          />
        </svg>
      </div>
    </div>
  );
}
