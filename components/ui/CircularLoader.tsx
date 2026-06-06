"use client";

interface CircularLoaderProps {
  /** Durchmesser in px (Default 28) */
  size?: number;
  /** Strichstärke in px (Default 3) */
  stroke?: number;
  /** Ringfarbe (Default Brand) */
  color?: string;
}

/**
 * Schlichter kreisförmiger Loader (rotierender Teilring).
 * Wiederverwendbar für Ladezustände site-weit.
 */
export default function CircularLoader({
  size = 28,
  stroke = 3,
  color = "var(--color-brand)",
}: CircularLoaderProps) {
  return (
    <span
      role="status"
      aria-label="Lädt"
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        border: `${stroke}px solid rgba(0,0,0,0.08)`,
        borderTopColor: color,
        animation: "circular-loader-spin 0.7s linear infinite",
        boxSizing: "border-box",
      }}
    >
      <style>{`@keyframes circular-loader-spin { to { transform: rotate(360deg); } }`}</style>
    </span>
  );
}
