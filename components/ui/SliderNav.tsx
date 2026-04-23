"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import InstagramDots from "@/components/ui/InstagramDots";

interface SliderNavProps {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (index: number) => void;
  prevLabel?: string;
  nextLabel?: string;
  /** Wenn false fährt die gesamte Nav smooth aus (Pfeile scale 0, dots scale 0)
   *  ohne zu unmounten. */
  visible?: boolean;
}

export default function SliderNav({
  current,
  total,
  onPrev,
  onNext,
  onGoTo,
  prevLabel = "Vorherige",
  nextLabel = "Nächste",
  visible = true,
}: SliderNavProps) {
  const prevArrowRef = useRef<SVGSVGElement>(null);
  const prevLineRef = useRef<HTMLSpanElement>(null);
  const prevLabelRef = useRef<HTMLSpanElement>(null);
  const nextArrowRef = useRef<SVGSVGElement>(null);
  const nextLineRef = useRef<HTMLSpanElement>(null);
  const nextLabelRef = useRef<HTMLSpanElement>(null);
  const prevFirstRun = useRef(true);
  const nextFirstRun = useRef(true);

  // Wenn die gesamte Nav unsichtbar geschaltet wird, verhalten sich Pfeile
  // wie im Disabled-Zustand (scale 0 + line scaleX 0 + label opacity 0).
  const leftDisabled = !visible || current === 0;
  const rightDisabled = !visible || current === total - 1;

  // Disable/enable animation for PREV (left) side:
  // out: arrow scale → 0, label fade out parallel (0.25s ease-in),
  //      then line scaleX → 0 (0.2s ease-out)
  // in:  line scaleX → 1 (0.2s ease-in), then arrow scale + label (0.25s ease-out)
  useLayoutEffect(() => {
    const arrow = prevArrowRef.current;
    const line = prevLineRef.current;
    const label = prevLabelRef.current;
    if (!arrow || !line || !label) return;
    if (prevFirstRun.current) {
      prevFirstRun.current = false;
      gsap.set(arrow, { scale: leftDisabled ? 0 : 1 });
      gsap.set(line, { scaleX: leftDisabled ? 0 : 1 });
      gsap.set(label, { opacity: leftDisabled ? 0 : 1 });
      return;
    }
    if (leftDisabled) {
      gsap.to(arrow, { scale: 0, duration: 0.25, ease: "power2.in", overwrite: true });
      gsap.to(label, { opacity: 0, duration: 0.25, ease: "power2.in", overwrite: true });
      gsap.to(line, { scaleX: 0, duration: 0.3, delay: 0.25, ease: "power2.out", overwrite: true });
    } else {
      gsap.to(line, { scaleX: 1, duration: 0.3, ease: "power2.in", overwrite: true });
      gsap.to(arrow, { scale: 1, duration: 0.25, delay: 0.3, ease: "power2.out", overwrite: true });
      gsap.to(label, { opacity: 1, duration: 0.25, delay: 0.3, ease: "power2.out", overwrite: true });
    }
  }, [leftDisabled]);

  useLayoutEffect(() => {
    const arrow = nextArrowRef.current;
    const line = nextLineRef.current;
    const label = nextLabelRef.current;
    if (!arrow || !line || !label) return;
    if (nextFirstRun.current) {
      nextFirstRun.current = false;
      gsap.set(arrow, { scale: rightDisabled ? 0 : 1 });
      gsap.set(line, { scaleX: rightDisabled ? 0 : 1 });
      gsap.set(label, { opacity: rightDisabled ? 0 : 1 });
      return;
    }
    if (rightDisabled) {
      gsap.to(arrow, { scale: 0, duration: 0.25, ease: "power2.in", overwrite: true });
      gsap.to(label, { opacity: 0, duration: 0.25, ease: "power2.in", overwrite: true });
      gsap.to(line, { scaleX: 0, duration: 0.3, delay: 0.25, ease: "power2.out", overwrite: true });
    } else {
      gsap.to(line, { scaleX: 1, duration: 0.3, ease: "power2.in", overwrite: true });
      gsap.to(arrow, { scale: 1, duration: 0.25, delay: 0.3, ease: "power2.out", overwrite: true });
      gsap.to(label, { opacity: 1, duration: 0.25, delay: 0.3, ease: "power2.out", overwrite: true });
    }
  }, [rightDisabled]);

  return (
    <div className="slider-nav">
      <button
        className="slider-nav-arrow-btn"
        onClick={onPrev}
        disabled={leftDisabled}
        aria-label="Zurück"
      >
        <svg
          ref={prevArrowRef}
          className="slider-nav-arrow"
          width="40"
          height="10"
          viewBox="0 0 64 15"
          fill="none"
          preserveAspectRatio="none"
          style={{ transformBox: "fill-box", transformOrigin: "100% 100%" }}
        >
          <path d="M0 15H64V0L0 15Z" fill="var(--color-text-primary)" />
        </svg>
        <span className="slider-nav-track">
          <span ref={prevLabelRef} className="slider-nav-label">{prevLabel}</span>
          <span
            ref={prevLineRef}
            className="slider-nav-track-line"
            style={{ transformOrigin: "100% 50%" }}
          />
        </span>
      </button>

      <div
        style={{
          marginTop: 13,
          transform: visible ? 'scale(1)' : 'scale(0)',
          transition: 'transform 0.25s cubic-bezier(.4,0,.2,1)',
        }}
      >
        <InstagramDots
          current={current}
          total={total}
          onGoTo={onGoTo}
        />
      </div>

      <button
        className="slider-nav-arrow-btn slider-nav-arrow-btn--right"
        onClick={onNext}
        disabled={rightDisabled}
        aria-label="Weiter"
      >
        <span className="slider-nav-track">
          <span ref={nextLabelRef} className="slider-nav-label">{nextLabel}</span>
          <span
            ref={nextLineRef}
            className="slider-nav-track-line"
            style={{ transformOrigin: "0% 50%" }}
          />
        </span>
        <svg
          ref={nextArrowRef}
          className="slider-nav-arrow"
          width="40"
          height="10"
          viewBox="0 0 64 15"
          fill="none"
          preserveAspectRatio="none"
          style={{ transformBox: "fill-box", transformOrigin: "0% 100%" }}
        >
          <path d="M64 15H0V0L64 15Z" fill="var(--color-text-primary)" />
        </svg>
      </button>
    </div>
  );
}
