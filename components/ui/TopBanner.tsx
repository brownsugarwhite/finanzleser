"use client";

import { useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import gsap from "@/lib/gsapConfig";
import type { SiteLinkType, TopBannerVisibility } from "@/lib/types";

interface TopBannerProps {
  text: string;
  linkType: SiteLinkType;
  linkValue: string;
  visibility: TopBannerVisibility;
}

const DOT_SIZE = 3;
const DOT_COLOR = "var(--color-dot)";
const SPEED = 40;
const HIT_BUFFER_FRONT = 2;  // vor dem Text (links)
const HIT_BUFFER_BACK = 10;   // hinter dem Text (rechts, negativ = näher)

export default function TopBanner({ text, linkType, linkValue, visibility }: TopBannerProps) {
  const pathname = usePathname();
  const lineColor = "var(--color-dot)";
  const textColor = "rgba(104, 108, 106, 0.8)";

  const rowRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const dotsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const dotCount = 500;

  const shouldRender =
    visibility !== "off" &&
    text.trim() !== "" &&
    (visibility === "all" || (visibility === "landing" && pathname === "/"));

  useLayoutEffect(() => {
    if (!shouldRender) return;
    const track = trackRef.current!;
    const row = rowRef.current!;
    const textEl = textRef.current!;

    const textWidth = textEl.offsetWidth;
    const rowWidth = row.offsetWidth;

    // Gap between copies so that when copy1 starts exiting right, copy2 enters left
    const gap = Math.max(0, rowWidth - textWidth);

    // Track layout: [copy2][gap][copy1]
    // copy1 offset in track = textWidth + gap = rowWidth (or textWidth if text > row)
    const copy1Offset = textWidth + gap;

    // Set gap spacer width
    const spacer = track.children[1] as HTMLElement;
    spacer.style.width = gap + "px";

    // Start: copy1 centered
    const startX = (rowWidth - textWidth) / 2 - copy1Offset;
    const travelDistance = Math.max(rowWidth, textWidth + gap);
    const duration = travelDistance / SPEED;

    gsap.set(track, { x: startX });

    const marqueeTween = gsap.to(track, {
      x: startX + travelDistance,
      duration,
      ease: "none",
      repeat: -1,
    });

    // Dot scaling
    const onTick = () => {
      const copies = track.querySelectorAll<HTMLElement>("[data-copy]");
      const rects: { left: number; right: number }[] = [];
      copies.forEach((el) => {
        const r = el.getBoundingClientRect();
        rects.push({ left: r.left - HIT_BUFFER_FRONT, right: r.right + HIT_BUFFER_BACK });
      });

      for (let i = 0; i < dotsRef.current.length; i++) {
        const dot = dotsRef.current[i];
        if (!dot) continue;
        const dotX = dot.getBoundingClientRect().left + DOT_SIZE / 2;
        const overlaps = rects.some((r) => dotX >= r.left && dotX <= r.right);
        const current = dot.dataset.v;

        if (overlaps && current !== "0") {
          dot.dataset.v = "0";
          gsap.to(dot, { scale: 0, duration: 0.3, overwrite: true });
        } else if (!overlaps && current !== "1") {
          dot.dataset.v = "1";
          gsap.to(dot, { scale: 1, duration: 0.35, overwrite: true });
        }
      }
    };

    gsap.ticker.add(onTick);

    return () => {
      marqueeTween.kill();
      gsap.ticker.remove(onTick);
    };
  }, [text, shouldRender]);

  if (!shouldRender) return null;

  const textStyle: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "16px",
    fontWeight: 500,
    lineHeight: "1.5em",
    color: textColor,
    letterSpacing: "0.1px",
    whiteSpace: "nowrap",
    flexShrink: 0,
  };

  const banner = (
    <div className="top-banner" style={{ width: "100%", marginLeft: "auto", marginRight: "auto", overflow: "hidden" }}>
      {/* 3px line */}
      <div style={{ height: "3px", backgroundColor: lineColor }} />
      {/* 1px line */}
      <div style={{ height: "1px", backgroundColor: lineColor, marginTop: "2px" }} />

      {/* Marquee row */}
      <div
        ref={rowRef}
        style={{
          position: "relative",
          overflow: "hidden",
          height: "1.4em",
          display: "flex",
          alignItems: "center",
          fontSize: "16px",
        }}
      >
        {/* Dots layer — static, full width */}
        <div
          style={{
            position: "absolute",
            left: "5px",
            right: "5px",
            top: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            gap: "6px",
            zIndex: 1,
          }}
        >
          {Array.from({ length: dotCount }, (_, i) => (
            <span
              key={i}
              ref={(el) => { dotsRef.current[i] = el; }}
              data-v="1"
              style={{
                width: DOT_SIZE + "px",
                height: DOT_SIZE + "px",
                borderRadius: "50%",
                backgroundColor: DOT_COLOR,
                flexShrink: 0,
                willChange: "transform",
              }}
            />
          ))}
        </div>

        {/* Track: [copy2][gap spacer][copy1] — moves left to right */}
        <div
          ref={trackRef}
          style={{
            display: "flex",
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            alignItems: "center",
            zIndex: 2,
          }}
        >
          {/* copy2 (enters from left) */}
          <span data-copy style={textStyle}>{text}</span>
          {/* gap spacer — width set dynamically */}
          <div style={{ flexShrink: 0 }} />
          {/* copy1 (starts centered, exits right) */}
          <span ref={textRef} data-copy style={textStyle}>{text}</span>
        </div>
      </div>

      {/* 1px line */}
      <div style={{ height: "1px", backgroundColor: lineColor }} />
      {/* 3px line */}
      <div style={{ height: "3px", backgroundColor: lineColor, marginTop: "2px" }} />
    </div>
  );

  const outerStyle: React.CSSProperties = { width: "100%", marginTop: "13px", position: "relative", padding: "0 13px", zIndex: 60 };

  const linkResetStyle: React.CSSProperties = {
    display: "block",
    color: "inherit",
    textDecoration: "none",
    cursor: "pointer",
  };

  if (linkType === "external" && linkValue) {
    return (
      <div style={outerStyle}>
        <a href={linkValue} target="_blank" rel="noopener noreferrer" style={linkResetStyle} aria-label={text}>
          {banner}
        </a>
      </div>
    );
  }

  if (linkType === "internal" && linkValue) {
    return (
      <div style={outerStyle}>
        <Link href={linkValue} style={linkResetStyle} aria-label={text}>
          {banner}
        </Link>
      </div>
    );
  }

  if (linkType === "anchor" && linkValue) {
    const handleAnchorClick = () => {
      const target = document.querySelector(linkValue);
      if (!target) return;
      gsap.to(window, {
        duration: 0.8,
        scrollTo: { y: target as Element, offsetY: 80 },
        ease: "power2.inOut",
      });
    };
    return (
      <div style={outerStyle}>
        <button
          type="button"
          onClick={handleAnchorClick}
          aria-label={text}
          style={{
            ...linkResetStyle,
            width: "100%",
            border: "none",
            background: "none",
            padding: 0,
            font: "inherit",
            textAlign: "inherit",
          }}
        >
          {banner}
        </button>
      </div>
    );
  }

  return <div style={outerStyle}>{banner}</div>;
}
