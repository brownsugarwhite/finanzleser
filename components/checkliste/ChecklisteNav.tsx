"use client";

interface Props {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (index: number) => void;
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
        className="checkliste-nav-btn"
        onClick={onPrev}
        disabled={current === 0}
        aria-label="Vorherige Sektion"
      >
        ←
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
        className="checkliste-nav-btn"
        onClick={onNext}
        disabled={current === total - 1}
        aria-label="Nächste Sektion"
      >
        →
      </button>
    </div>
  );
}
