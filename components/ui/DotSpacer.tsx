const DOT_COLOR = "var(--color-dot)";

export default function DotSpacer({ noMargin = false, maxWidth = "860px" }: { noMargin?: boolean; maxWidth?: string }) {
  return (
    <div
      style={{
        maxWidth,
        margin: noMargin ? "0 auto" : "40px auto",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        overflow: "hidden",
      }}
    >
      {Array.from({ length: 200 }, (_, i) => (
        <span
          key={i}
          style={{
            width: "3px",
            height: "3px",
            borderRadius: "50%",
            backgroundColor: DOT_COLOR,
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}
