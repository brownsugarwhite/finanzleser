"use client";

interface InstagramDotsProps {
  current: number;
  total: number;
  onGoTo: (index: number) => void;
  visibleCount?: number;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

const DOT_FULL = 8;
const SLOT = 14; // feste Slot-Breite pro Dot

export default function InstagramDots({
  current,
  total,
  onGoTo,
  visibleCount = 7,
}: InstagramDotsProps) {
  // Few dots: show all
  if (total <= visibleCount) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {Array.from({ length: total }).map((_, i) => {
          const isActive = i === current;
          return (
            <button
              key={i}
              onClick={() => onGoTo(i)}
              aria-label={`Slide ${i + 1}`}
              style={{
                width: SLOT,
                height: SLOT,
                padding: 0,
                border: "none",
                background: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <div style={{
                width: isActive ? 10 : 6,
                height: isActive ? 10 : 6,
                borderRadius: "50%",
                background: isActive ? "var(--color-text-primary)" : "var(--color-text-medium)",
                transition: "all 0.3s cubic-bezier(.4,0,.2,1)",
              }} />
            </button>
          );
        })}
      </div>
    );
  }

  // Window
  let windowStart = current - 2;
  if (windowStart < 0) windowStart = 0;
  if (windowStart > total - visibleCount) windowStart = total - visibleCount;

  const activePos = current - windowStart;
  const leftShrink = Math.min(1, activePos / 2);
  const rightShrink = Math.min(1, (visibleCount - 1 - activePos) / 2);

  const containerWidth = visibleCount * SLOT;
  const translateX = -(windowStart * SLOT);

  return (
    <div style={{
      width: containerWidth,
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
    }}>
      <div style={{
        display: "flex",
        transform: `translateX(${translateX}px)`,
        transition: "transform 0.3s cubic-bezier(.4,0,.2,1)",
        flexShrink: 0,
      }}>
        {Array.from({ length: total }).map((_, i) => {
          const isActive = i === current;
          const posInWindow = i - windowStart;

          let size = DOT_FULL;
          let opacity = 1;

          // Left edge
          if (posInWindow === 0) {
            size = lerp(DOT_FULL, 3, leftShrink);
            opacity = lerp(1, 0.3, leftShrink);
          } else if (posInWindow === 1) {
            size = lerp(DOT_FULL, 5, leftShrink);
            opacity = lerp(1, 0.6, leftShrink);
          }

          // Right edge
          if (posInWindow === visibleCount - 1) {
            size = lerp(DOT_FULL, 3, rightShrink);
            opacity = lerp(1, 0.3, rightShrink);
          } else if (posInWindow === visibleCount - 2) {
            size = lerp(DOT_FULL, 5, rightShrink);
            opacity = lerp(1, 0.6, rightShrink);
          }

          // Outside window
          if (posInWindow < 0 || posInWindow >= visibleCount) {
            size = 0;
            opacity = 0;
          }

          // Active always full
          if (isActive) {
            size = DOT_FULL;
            opacity = 1;
          }

          return (
            <button
              key={i}
              onClick={() => onGoTo(i)}
              aria-label={`Slide ${i + 1}`}
              style={{
                width: SLOT,
                height: SLOT,
                padding: 0,
                border: "none",
                background: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <div style={{
                width: size,
                height: size,
                borderRadius: "50%",
                background: isActive
                  ? "var(--color-text-primary)"
                  : "var(--color-text-medium)",
                opacity,
                transition: "all 0.3s cubic-bezier(.4,0,.2,1)",
              }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
