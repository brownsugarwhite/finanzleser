import type { CSSProperties } from "react";

export type ToolType = "rechner" | "checkliste" | "vergleich" | "dokumente";

export const TOOL_DOT_COLORS: Record<ToolType, string> = {
  rechner: "var(--color-tool-rechner)",
  vergleich: "var(--color-tool-vergleiche)",
  checkliste: "var(--color-tool-checklisten)",
  dokumente: "var(--color-text-primary)",
};

// Feste Anzeige-Reihenfolge der Tool-Punkte.
export const TOOL_ORDER: ToolType[] = ["checkliste", "rechner", "vergleich", "dokumente"];

export const TOOL_LABEL: Record<ToolType, string> = {
  rechner: "Rechner",
  vergleich: "Vergleich",
  checkliste: "Checkliste",
  dokumente: "Dokument",
};

/** Kleine farbige Punkte je vorhandenem Finanztool — genutzt im Megamenü und in der Landing-Sidebar. */
export default function ToolDots({ tools, size = 10, style }: { tools?: ToolType[]; size?: number; style?: CSSProperties }) {
  if (!tools || tools.length === 0) return null;
  const ordered = [...tools].sort((a, b) => TOOL_ORDER.indexOf(a) - TOOL_ORDER.indexOf(b));
  return (
    <span
      style={{
        display: "inline-flex",
        gap: 5,
        marginLeft: 2,
        verticalAlign: "middle",
        whiteSpace: "nowrap",
        ...style,
      }}
      aria-hidden
    >
      {ordered.map((t) => (
        <span
          key={t}
          style={{
            display: "inline-block",
            width: size,
            height: size,
            borderRadius: "50%",
            background: TOOL_DOT_COLORS[t],
          }}
        />
      ))}
    </span>
  );
}
