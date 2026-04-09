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
const DOT_ACTIVE = 11;
const GAP = 6;

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
        gap: GAP,
      }}>
        {Array.from({ length: total }).map((_, i) => {
          const isActive = i === current;
          const size = isActive ? DOT_ACTIVE : DOT_FULL;
          return (
            <button
              key={i}
              onClick={() => onGoTo(i)}
              aria-label={`Slide ${i + 1}`}
              style={{
                width: size,
                height: size,
                padding: 0,
                border: "none",
                cursor: "pointer",
                borderRadius: "50%",
                background: "var(--color-text-primary)",
                transition: "width 0.3s cubic-bezier(.4,0,.2,1), height 0.3s cubic-bezier(.4,0,.2,1)",
                flexShrink: 0,
              }}
            />
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

  // Compute size for each dot
  function getDotSize(i: number): number {
    if (i === current) return DOT_ACTIVE;
    const posInWindow = i - windowStart;
    if (posInWindow < 0 || posInWindow >= visibleCount) return 0;

    if (posInWindow === 0) return lerp(DOT_FULL, 3, leftShrink);
    if (posInWindow === 1) return lerp(DOT_FULL, 5, leftShrink);
    if (posInWindow === visibleCount - 1) return lerp(DOT_FULL, 3, rightShrink);
    if (posInWindow === visibleCount - 2) return lerp(DOT_FULL, 5, rightShrink);
    return DOT_FULL;
  }

  // Compute container width (visible dots + gaps)
  const sizes: number[] = [];
  for (let i = 0; i < total; i++) sizes.push(getDotSize(i));

  let containerWidth = 0;
  for (let i = windowStart; i < windowStart + visibleCount; i++) {
    containerWidth += sizes[i];
    if (i < windowStart + visibleCount - 1) containerWidth += GAP;
  }

  // Compute translateX: sum of all dot widths + gaps before windowStart
  let translateX = 0;
  for (let i = 0; i < windowStart; i++) {
    translateX -= sizes[i] + GAP;
  }

  return (
    <div style={{
      width: containerWidth,
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      transition: "width 0.3s cubic-bezier(.4,0,.2,1)",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: GAP,
        transform: `translateX(${translateX}px)`,
        transition: "transform 0.3s cubic-bezier(.4,0,.2,1)",
        flexShrink: 0,
      }}>
        {Array.from({ length: total }).map((_, i) => {
          const size = sizes[i];

          return (
            <button
              key={i}
              onClick={() => onGoTo(i)}
              aria-label={`Slide ${i + 1}`}
              style={{
                width: size,
                height: size,
                padding: 0,
                border: "none",
                cursor: "pointer",
                borderRadius: "50%",
                background: "var(--color-text-primary)",
                transition: "width 0.3s cubic-bezier(.4,0,.2,1), height 0.3s cubic-bezier(.4,0,.2,1)",
                flexShrink: 0,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
