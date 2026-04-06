"use client";

import { useState, useEffect, useRef } from "react";

const LEFT_EYE = { cx: 158.34, cy: 450.80 };
const RIGHT_EYE = { cx: 413.69, cy: 450.80 };
const PUPIL_RADIUS = 80;
const MAX_OFFSET = 30;
const COLOR = "#000000";

export default function MayaIcon() {
  const headRef = useRef<HTMLDivElement>(null);
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
  const [smooth, setSmooth] = useState(false);
  const wasInWindow = useRef(true);

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!wasInWindow.current) {
        // Just entered — smooth transition to cursor
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
      const clamp = Math.min(dist, 350) / 350;
      setPupilOffset({
        x: (dx / dist) * MAX_OFFSET * clamp,
        y: (dy / dist) * MAX_OFFSET * clamp,
      });
    }

    function handleMouseLeave() {
      wasInWindow.current = false;
      setSmooth(true);
      setPupilOffset({ x: 0, y: 0 });
    }

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 36,
        right: 36,
        zIndex: 100,
        width: 80,
        cursor: "pointer",
      }}
    >
      <svg
        viewBox="0 0 136.46 313.85"
        style={{
          position: "absolute",
          bottom: -11,
          left: "50%",
          transform: "translateX(-50%)",
          width: 14,
          zIndex: 1,
          pointerEvents: "none",
        }}
      >
        <path
          d="M80.02,82.29l20.97-34.49L70.63,0l-33.16,48.08,19.65,30.78C38.54,123.63,2.23,211.44.09,218.98c-2.88,10.16,67.79,94.87,67.79,94.87l68.58-95.23-56.44-136.33Z"
          fill="#ff1d7b"
        />
      </svg>

      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "brightness(1.3) blur(13px)",
          WebkitBackdropFilter: "brightness(1.3) blur(13px)",
          boxShadow: "0 3px 23px rgba(0, 0, 0, 0.05)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 2,
        }}
      >
        <div ref={headRef} style={{ position: "relative", display: "flex", alignItems: "flex-end" }}>
          <svg viewBox="0 0 564.09 533.81" style={{ width: 50 }}>
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
            style={{ position: "absolute", top: 0, left: 0, width: 50, height: "100%", pointerEvents: "none", overflow: "visible" }}
          >
            <circle cx={LEFT_EYE.cx + pupilOffset.x} cy={LEFT_EYE.cy + pupilOffset.y} r={PUPIL_RADIUS} fill={COLOR} style={{ transition: smooth ? "cx 0.3s ease, cy 0.3s ease" : "none" }} />
            <circle cx={RIGHT_EYE.cx + pupilOffset.x} cy={RIGHT_EYE.cy + pupilOffset.y} r={PUPIL_RADIUS} fill={COLOR} style={{ transition: smooth ? "cx 0.3s ease, cy 0.3s ease" : "none" }} />
          </svg>
        </div>
        <div>
          <svg viewBox="0 0 562.6 313.59" style={{ width: 48 }}>
            <polygon
              points="0 309.1 53.8 0 148.67 157.93 274.66 8.06 409.74 155.25 511.21 0 562.6 313.59 0 309.1"
              fill={COLOR}
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
