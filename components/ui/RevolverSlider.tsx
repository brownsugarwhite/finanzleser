"use client";

import { useRef, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { useRevolverSlider } from "@/hooks/useRevolverSlider";

/* ── Types ── */

interface Tool {
  title: string;
  description: string;
  cta: string;
  href: string;
  color: string;
}

interface RevolverSliderProps {
  tools: Tool[];
  activeIndex: number;
  onActiveChange: (index: number) => void;
}

/* ── Component ── */

export default function RevolverSlider({ tools, activeIndex, onActiveChange }: RevolverSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [topCardHeight, setTopCardHeight] = useState(200);
  const [titleWidths, setTitleWidths] = useState<number[]>([]);

  /* ── Measure container width ── */
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  /* ── Measure top card height (probe) ── */
  useEffect(() => {
    if (!containerWidth) return;
    const probe = document.createElement("div");
    probe.style.cssText = `
      position: fixed; visibility: hidden; pointer-events: none; top: 0; left: 0;
      width: ${containerWidth}px; padding: 27px 23px 23px 27px; box-sizing: border-box;
    `;
    let maxH = 0;
    tools.forEach((tool) => {
      probe.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:9px;">
          <div style="width:40px;height:40px;border-radius:17px;border:1px solid #334a27;flex-shrink:0;"></div>
          <span style="font-family:'Merriweather',serif;font-size:24px;font-weight:600;white-space:nowrap;">${tool.title}</span>
        </div>
        <p style="font-family:'Open Sans',sans-serif;font-size:17px;line-height:1.38;margin:0;">${tool.description}</p>
        <div style="margin-top:16px;padding:10px 16px;display:inline-flex;font-size:14px;font-weight:700;border:none;border-radius:9px;">${tool.cta}</div>
      `;
      document.body.appendChild(probe);
      maxH = Math.max(maxH, probe.scrollHeight);
      document.body.removeChild(probe);
    });
    setTopCardHeight(maxH);

    // Measure title widths at collapsed font size (16px/600)
    const widths = tools.map((tool) => {
      const span = document.createElement("span");
      span.style.cssText = `
        position: absolute; visibility: hidden; white-space: nowrap;
        font-family: 'Merriweather', serif; font-size: 16px; font-weight: 600;
      `;
      span.textContent = tool.title;
      document.body.appendChild(span);
      const w = span.offsetWidth;
      document.body.removeChild(span);
      return w;
    });
    setTitleWidths(widths);
  }, [containerWidth, tools]);

  /* ── Hook ── */
  const revolver = useRevolverSlider({
    count: tools.length,
    initialIndex: activeIndex,
    containerWidth: containerWidth || 300,
    topCardHeight,
    onActiveChange,
  });

  if (!containerWidth) {
    return <div ref={containerRef} style={{ width: "100%", height: 100 }} />;
  }

  return (
    <div ref={containerRef} style={{ width: "100%", paddingBottom: 16 }}>
      {/* Stage */}
      <div
        {...revolver.pointerHandlers}
        style={{
          position: "relative",
          width: containerWidth,
          height: revolver.stageHeight,
          touchAction: "none",
          cursor: "grab",
          overflow: "visible",
        }}
      >
        {/* Sparkle */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 12 12.0005"
          fill="none"
          aria-hidden
          style={{
            position: "absolute",
            left: containerWidth / 2 - 10,
            top: topCardHeight + revolver.slotLayout.GAP / 2 - 10 + 9,
            opacity: revolver.sparkleOpacity * 0.65,
            transform: `rotate(${revolver.sparkleRotation}deg)`,
            pointerEvents: "none",
            zIndex: 100,
          }}
        >
          <path
            d="M12 6.00047C10.3384 5.64978 8.28716 5.41362 7.24241 3.91374C6.47491 2.81169 6.27276 1.28871 6.00024 0.000471365C5.61861 1.71435 5.40087 3.79684 3.79407 4.83384C2.69548 5.54325 1.25351 5.72142 0 6.01226C1.28705 6.29225 2.79561 6.48692 3.89751 7.25194C5.4174 8.30686 5.61672 10.3366 6.00024 12.0005C6.17594 11.1204 6.33322 10.2272 6.62463 9.37638C7.27878 7.46453 8.37832 6.85223 10.2643 6.37379L12 6.00047Z"
            fill="var(--fill-0, #334A27)"
          />
        </svg>

        {/* Cards */}
        {revolver.cardStates.map((cs) => {
          const tool = tools[cs.dataIndex];
          const isExpanded = cs.contentOpacity > 0.01;

          return (
            <div
              key={tool.title}
              onClick={() => revolver.handleCardClick(cs.dataIndex)}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                transform: `translate3d(${cs.x}px, ${cs.y}px, 0)`,
                width: cs.w,
                height: cs.h,
                borderRadius: 23 + cs.contentOpacity * 13,
                background: (() => {
                  const t = cs.contentOpacity;
                  // Interpolate: collapsed white(0.8) → expanded page(0.8)
                  const r = Math.round(255 + (250 - 255) * t);
                  const g = Math.round(255 + (249 - 255) * t);
                  const b = Math.round(255 + (246 - 255) * t);
                  return `rgba(${r}, ${g}, ${b}, 0.8)`;
                })(),
                backdropFilter: (() => {
                  const t = cs.contentOpacity;
                  const brightness = 1 + 0.3 * (1 - t);
                  const blur = 13 + (16 - 13) * t;
                  return t < 0.99 ? `brightness(${brightness}) blur(${blur}px)` : `blur(16px)`;
                })(),
                WebkitBackdropFilter: (() => {
                  const t = cs.contentOpacity;
                  const brightness = 1 + 0.3 * (1 - t);
                  const blur = 13 + (16 - 13) * t;
                  return t < 0.99 ? `brightness(${brightness}) blur(${blur}px)` : `blur(16px)`;
                })(),
                boxShadow: `0 3px 23px rgba(0, 0, 0, ${0.02 * (1 - cs.contentOpacity)})`,
                border: `1px solid rgba(104, 108, 106, ${cs.borderOpacity})`,
                overflow: "hidden",
                cursor: "pointer",
                willChange: "transform, width, height",
                zIndex: cs.zIndex,
              }}
            >
              {/* Card inner content */}
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: isExpanded ? cs.w : "100%",
                padding: `${20 - 5 * cs.contentOpacity - 8 * (1 - cs.contentOpacity)}px 23px 23px 27px`,
                display: "flex",
                flexDirection: "column",
                pointerEvents: "none",
              }}>
                {/* Icon + Title — staggered: horizontal first, then vertical */}
                {(() => {
                  const t = cs.contentOpacity;
                  const cw = Math.max(0, cs.w - 50);
                  // Smoothstep for staggered X/Y
                  const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
                  const ss = (v: number) => v * v * (3 - 2 * v);
                  const tX = ss(clamp01(t / 0.6));          // X: 0→0.6
                  const tY = ss(clamp01((t - 0.4) / 0.6));  // Y: 0.4→1.0

                  // Icon: horizontal movement (centered → left)
                  const iconTX = ss(clamp01(t / 0.6));
                  const iconLeft = (1 - iconTX) * (cw / 2 - 20);

                  return (
                    <>
                      {/* Icon — absolute, animiert horizontal */}
                      <div style={{
                        position: "absolute",
                        left: 27 + iconLeft,
                        top: 20 - 9 * (1 - t),
                        width: 40,
                        height: 40,
                        borderRadius: 17,
                        border: "1px solid var(--color-text-primary)",
                      }} />
                      {/* Title — in flow, nur paddingLeft + paddingTop animiert */}
                      <p style={{
                        marginTop: 0,
                        marginBottom: 0,
                        marginLeft: 0,
                        marginRight: 0,
                        paddingTop: 40 * (1 - tY) + 15 * tY,
                        fontFamily: "var(--font-heading, 'Merriweather', serif)",
                        fontSize: cs.titleFontSize,
                        lineHeight: "36px",                      
                        fontWeight: 600,
                        color: "var(--color-text-primary)",
                        whiteSpace: "nowrap",
                        textAlign: "left",
                        transform: `translateX(${
                          // collapsed: center title in card
                          // expanded: 36px from left card edge (36 - 27 padding = 9px)
                          ((cs.w - 50) / 2 - (titleWidths[cs.dataIndex] || 60) / 2) * (1 - tX) + 48 * tX
                        }px)`,
                      }}>
                        {tool.title}
                      </p>
                    </>
                  );
                })()}

                {/* Description + CTA (fades with contentOpacity) */}
                <div style={{
                  marginTop: 5,
                  width: containerWidth - 50,
                  opacity: cs.descOpacity,
                  pointerEvents: cs.descOpacity > 0.5 ? "auto" : "none",
                }}>
                  <p style={{
                    fontFamily: "var(--font-body, 'Open Sans', sans-serif)",
                    fontWeight: 400,
                    fontSize: 17,
                    lineHeight: 1.38,
                    color: "var(--color-text-medium)",
                    margin: 0,
                  }}>
                    {tool.description}
                  </p>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                    <Button label={tool.cta} />
                  </div>
                </div>
              </div>

              {/* Bookmark */}
              <div style={{
                position: "absolute",
                top: 0,
                right: 36,
                width: 28,
                opacity: cs.bookmarkOpacity,
                pointerEvents: "none",
              }}>
                  <div style={{ width: 28, height: 9, background: tool.color }} />
                  <svg width="28" height="23" viewBox="0 0 28 23" fill="none" aria-hidden style={{ display: "block", marginTop: -1 }}>
                    <path d="M13.9991 8.58256L28 22.5817V6.8343e-07L0 1.90735e-06L0 22.5817L13.9991 8.58256Z" fill={tool.color} />
                  </svg>
                </div>
            </div>
          );
        })}
      </div>

      {/* Dots */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 16 }}>
        {tools.map((tool, i) => (
          <div
            key={tool.title}
            style={{
              height: 4,
              borderRadius: 2,
              width: revolver.activeDataIndex === i ? 22 : 5,
              background: revolver.activeDataIndex === i
                ? "var(--color-text-primary, #334A27)"
                : "rgba(26, 23, 20, 0.13)",
              transition: "width 0.38s cubic-bezier(.4,0,.2,1), background 0.38s cubic-bezier(.4,0,.2,1)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
