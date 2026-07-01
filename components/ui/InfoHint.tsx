"use client";

import InlineSVG from "@/components/ui/InlineSVG";

interface InfoHintProps {
  children: React.ReactNode;
  /** Text- und Icon-Farbe (Info-I + Kreis). Default: helle Textfarbe. */
  color?: string;
  style?: React.CSSProperties;
}

/**
 * Hinweis-Zeile: Info-I im Kreis links, heller Hinweistext rechts.
 * Geteiltes Layout für Checklisten- und Rechner-Hinweise.
 */
export default function InfoHint({ children, color = "var(--color-text-medium)", style }: InfoHintProps) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, ...style }}>
      <span
        aria-hidden
        style={{
          ["--fill-0" as string]: color,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          width: 18,
          height: 18,
          borderRadius: "50%",
          border: `1px solid ${color}`,
          marginTop: 1,
        }}
      >
        <InlineSVG src="/icons/info_i.svg" alt="Info" style={{ width: 5, height: 10 }} />
      </span>
      <p style={{ fontSize: 12, color, margin: 0, lineHeight: 1.5 }}>{children}</p>
    </div>
  );
}
