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
    <button
      type="button"
      onClick={onToggle}
      aria-label={isOpen ? "Inhaltsverzeichnis schließen" : "Inhaltsverzeichnis öffnen"}
      aria-expanded={isOpen}
      className="mobile-toc-indicator"
      style={{
        position: "fixed",
        top: "25px",
        left: "90px",
        height: 46,
        width: "max-content",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        zIndex: 63,
        padding: "0 13px 0 4px",
        borderRadius: "19px",
        backgroundColor: "var(--color-pill-bg)",
        backdropFilter: "blur(16px) brightness(1.15)",
        WebkitBackdropFilter: "blur(16px) brightness(1.15)",
        boxShadow: "0 3px 23px rgba(0, 0, 0, 0.02)",
        pointerEvents: "auto",
        border: "none",
        cursor: "pointer",
        font: "inherit",
        textAlign: "inherit",
        color: "inherit",
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
            fontSize: "19px",
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

      {/* "Inhalt" Label */}
      <span
        style={{
          fontFamily: "Merriweather, serif",
          fontWeight: 600,
          fontSize: "14px",
          lineHeight: 1,
          color: "var(--color-text-primary)",
          whiteSpace: "nowrap",
        }}
      >
        Inhalt
      </span>

      {/* Toggle-Pfeil (visuelles Indikator — das ganze Pill ist klickbar) */}
      <span
        aria-hidden="true"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 17.45 15.77"
          xmlns="http://www.w3.org/2000/svg"
          style={{ transform: isOpen ? "rotate(90deg)" : "rotate(-90deg)", transition: "transform 0.2s ease", overflow: "visible" }}
        >
          <polyline points="9.18 15.27 .5 8.11 9.18 .5" fill="none" stroke="#334A27" strokeWidth="1.2" vectorEffect="non-scaling-stroke" strokeLinecap="square" strokeLinejoin="miter" />
          <polyline points="16.95 15.27 8.27 8.11 16.95 .5" fill="none" stroke="#334A27" strokeWidth="1.2" vectorEffect="non-scaling-stroke" strokeLinecap="square" strokeLinejoin="miter" />
        </svg>
      </span>
    </button>
  );
}
