"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "@/lib/gsapConfig";
import type { TOCItem } from "@/lib/hooks/useArticleToc";

const RING_SIZE = 38;
const BADGE_SIZE = 30;

const TOOL_COLORS: Record<string, string> = {
  rechner: "var(--color-tool-rechner)",
  checkliste: "var(--color-tool-checklisten)",
  vergleich: "var(--color-tool-vergleiche)",
};

interface Props {
  items: TOCItem[];
  activeId: string;
  scrollProgress: number;
  isOpen: boolean;
  onToggle: () => void;
}

export default function MobileTocIndicator({ items, activeId, scrollProgress, isOpen, onToggle }: Props) {
  const activeIdx = items.findIndex((i) => i.id === activeId);

  const enterRef = useRef<HTMLSpanElement>(null);
  const exitRef = useRef<HTMLSpanElement>(null);
  const lastNumberRef = useRef<number | null>(null);
  const [exitingNumber, setExitingNumber] = useState<number | null>(null);

  const number = activeIdx >= 0 ? activeIdx + 1 : null;

  // Trigger slide on number change
  useEffect(() => {
    if (number === null) return;
    if (lastNumberRef.current === null) {
      lastNumberRef.current = number;
      return;
    }
    if (lastNumberRef.current === number) return;
    setExitingNumber(lastNumberRef.current);
    lastNumberRef.current = number;
  }, [number]);

  // Run slide animation when exitingNumber gets set
  useEffect(() => {
    if (exitingNumber === null) return;
    const enter = enterRef.current;
    const exit = exitRef.current;
    if (!enter || !exit) return;

    gsap.fromTo(
      enter,
      { yPercent: 100 },
      { yPercent: 0, duration: 0.3, ease: "power2.out", overwrite: "auto" },
    );
    gsap.fromTo(
      exit,
      { yPercent: 0 },
      {
        yPercent: -100,
        duration: 0.3,
        ease: "power2.out",
        overwrite: "auto",
        onComplete: () => setExitingNumber(null),
      },
    );
  }, [exitingNumber]);

  if (activeIdx < 0 || number === null) return null;

  const active = items[activeIdx];
  const toolColor = active.toolType ? TOOL_COLORS[active.toolType] : undefined;
  const activeColor = toolColor || "var(--color-brand)";

  const numberInner: React.CSSProperties = {
    transform: "skewX(-10deg)",
    display: "inline-block",
    color: "#ffffff",
  };

  const layerStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div
      className="mobile-toc-indicator"
      style={{
        position: "fixed",
        top: "16px",
        left: "13px",
        right: "70px",
        height: 48,
        display: "flex",
        alignItems: "center",
        gap: "8px",
        zIndex: 63,
        padding: "0 6px 0 4px",
        borderRadius: "24px",
        background: "rgba(255, 255, 255, 0.55)",
        backdropFilter: "blur(10px) saturate(1.2)",
        WebkitBackdropFilter: "blur(10px) saturate(1.2)",
        border: "1px solid rgba(255, 255, 255, 0.6)",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
        pointerEvents: "auto",
      }}
    >
      {/* Ring + Badge */}
      <span
        style={{
          position: "relative",
          width: RING_SIZE,
          height: RING_SIZE,
          minWidth: RING_SIZE,
          flexShrink: 0,
        }}
      >
        {/* Progress ring */}
        <span
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: RING_SIZE,
            height: RING_SIZE,
            borderRadius: "40%",
            border: `2px solid ${activeColor}`,
            maskImage: `conic-gradient(from 6deg, #000 ${scrollProgress * 100}%, transparent ${scrollProgress * 100}%)`,
            WebkitMaskImage: `conic-gradient(from 6deg, #000 ${scrollProgress * 100}%, transparent ${scrollProgress * 100}%)`,
            boxSizing: "border-box",
            transition: "border-color 0.15s ease",
          }}
        />
        {/* Badge */}
        <span
          style={{
            position: "absolute",
            top: "4px",
            left: "4px",
            width: BADGE_SIZE,
            height: BADGE_SIZE,
            borderRadius: "12px",
            border: `1px solid ${activeColor}`,
            backgroundColor: activeColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Merriweather, serif",
            fontWeight: 300,
            fontStyle: "italic",
            fontSize: "17px",
            lineHeight: 1,
            color: "#ffffff",
            overflow: "hidden",
            transition: "background-color 0.15s ease, border-color 0.15s ease",
          }}
        >
          {exitingNumber !== null && (
            <span ref={exitRef} style={layerStyle}>
              <span style={numberInner}>{exitingNumber}</span>
            </span>
          )}
          <span ref={enterRef} style={layerStyle}>
            <span style={numberInner}>{number}</span>
          </span>
        </span>
      </span>

      {/* Section text */}
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontFamily: "Merriweather, serif",
          fontWeight: 700,
          fontSize: "13px",
          lineHeight: 1.3,
          color: activeColor,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          transition: "color 0.15s ease",
        }}
      >
        {active.text}
      </span>

      {/* Toggle */}
      <button
        type="button"
        onClick={onToggle}
        aria-label={isOpen ? "Inhaltsverzeichnis schließen" : "Inhaltsverzeichnis öffnen"}
        aria-expanded={isOpen}
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          border: "1px solid var(--color-text-medium)",
          background: "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          flexShrink: 0,
        }}
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 17.45 15.77"
          xmlns="http://www.w3.org/2000/svg"
          style={{ transform: isOpen ? "rotate(90deg)" : "rotate(-90deg)", transition: "transform 0.2s ease" }}
        >
          <polyline points="9.18 15.27 .5 8.11 9.18 .5" fill="none" stroke="#334A27" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="16.95 15.27 8.27 8.11 16.95 .5" fill="none" stroke="#334A27" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
