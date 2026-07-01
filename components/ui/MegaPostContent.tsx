import ToolDots, { type ToolType } from "@/components/ui/ToolDots";

/** Jahreszahlen (2024, 2025/26 …) im Titel fett hervorheben. */
export function boldYears(text: string) {
  const parts = text.split(/(20\d{2}(?:\/\d{2,4})?)/g);
  return (
    <span style={{ color: "inherit" }}>
      {parts.map((part, i) =>
        /^20\d{2}/.test(part) ? (
          <strong key={i} style={{ fontWeight: 900 }}>
            {part}
          </strong>
        ) : (
          part
        )
      )}
    </span>
  );
}

export interface MegaPostLike {
  title: string;
  beitragFelder?: { beitragUntertitel?: string | null } | null;
  tools?: ToolType[];
}

/**
 * Innen-Markup eines Beitrags-Links im Megamenü (Desktop + Mobile identisch):
 * Liegt ein Kicker (1. Content-h2 / Untertitel) vor, steht oben klein der
 * post.title + Tool-Dots, darunter der fette Kicker. Ohne Kicker: Titel fett
 * + Tool-Dots in einer Zeile. Der umschließende Link/Button bleibt beim Caller.
 */
export default function MegaPostContent({ post }: { post: MegaPostLike }) {
  const kicker = post.beitragFelder?.beitragUntertitel?.trim();

  if (!kicker) {
    return (
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {boldYears(post.title)}
        <ToolDots tools={post.tools} />
      </span>
    );
  }

  return (
    <>
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          fontWeight: 400,
          fontFamily: "var(--font-body)",
          color: "var(--color-text-secondary)",
          lineHeight: 1.3,
          marginBottom: 4,
        }}
      >
        <span>{post.title}</span>
        <ToolDots tools={post.tools} size={8} style={{ marginLeft: 0 }} />
      </span>
      <span style={{ display: "block" }}>{boldYears(kicker)}</span>
    </>
  );
}
