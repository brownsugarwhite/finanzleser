"use client";

import InstagramDots from "@/components/ui/InstagramDots";

interface SliderNavProps {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (index: number) => void;
  prevLabel?: string;
  nextLabel?: string;
}

function ArrowLeft() {
  return (
    <svg width="40" height="10" viewBox="0 0 64 15" fill="none" className="slider-nav-arrow">
      <path d="M0 15H64V0L0 15Z" fill="var(--color-text-primary)" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg width="40" height="10" viewBox="0 0 64 15" fill="none" className="slider-nav-arrow">
      <path d="M64 15H0V0L64 15Z" fill="var(--color-text-primary)" />
    </svg>
  );
}

export default function SliderNav({
  current,
  total,
  onPrev,
  onNext,
  onGoTo,
  prevLabel = "Vorherige",
  nextLabel = "Nächste",
}: SliderNavProps) {
  return (
    <div className="slider-nav">
      <button
        className="slider-nav-arrow-btn"
        onClick={onPrev}
        disabled={current === 0}
        aria-label="Zurück"
      >
        <ArrowLeft />
        <span className="slider-nav-track">
          <span className="slider-nav-label">{prevLabel}</span>
        </span>
      </button>

      <div style={{ marginTop: 13 }}>
        <InstagramDots
          current={current}
          total={total}
          onGoTo={onGoTo}
        />
      </div>

      <button
        className="slider-nav-arrow-btn slider-nav-arrow-btn--right"
        onClick={onNext}
        disabled={current === total - 1}
        aria-label="Weiter"
      >
        <span className="slider-nav-track">
          <span className="slider-nav-label">{nextLabel}</span>
        </span>
        <ArrowRight />
      </button>
    </div>
  );
}
