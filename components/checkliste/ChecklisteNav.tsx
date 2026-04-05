"use client";

interface Props {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (index: number) => void;
}

function ArrowLeft() {
  return (
    <svg width="40" height="10" viewBox="0 0 64 15" fill="none" className="checkliste-nav-arrow">
      <path d="M0 15H64V0L0 15Z" fill="var(--color-text-primary)" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg width="40" height="10" viewBox="0 0 64 15" fill="none" className="checkliste-nav-arrow">
      <path d="M64 15H0V0L64 15Z" fill="var(--color-text-primary)" />
    </svg>
  );
}

export default function ChecklisteNav({
  current,
  total,
  onPrev,
  onNext,
  onGoTo,
}: Props) {
  return (
    <div className="checkliste-nav">
      <button
        className="checkliste-nav-arrow-btn"
        onClick={onPrev}
        disabled={current === 0}
        aria-label="Vorherige Sektion"
      >
        <ArrowLeft />
        <span className="checkliste-nav-track">
          <span className="checkliste-nav-label">Vorherige Seite</span>
        </span>
      </button>

      <div className="checkliste-nav-dots">
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            className={`checkliste-nav-dot ${i === current ? "checkliste-nav-dot--active" : ""}`}
            onClick={() => onGoTo(i)}
            aria-label={`Sektion ${i + 1}`}
          />
        ))}
      </div>

      <button
        className="checkliste-nav-arrow-btn checkliste-nav-arrow-btn--right"
        onClick={onNext}
        disabled={current === total - 1}
        aria-label="Nächste Sektion"
      >
        <span className="checkliste-nav-track">
          <span className="checkliste-nav-label">Nächste Seite</span>
        </span>
        <ArrowRight />
      </button>
    </div>
  );
}
