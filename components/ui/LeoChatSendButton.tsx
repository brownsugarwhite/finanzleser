"use client";

/**
 * Icon-Crossfade-Innenleben für den Send/Stop-Button in der Chat-Pille.
 *
 * Wird innerhalb des magenta-farbenen Buttons aus LeoIcon.tsx (arrowBtnRef)
 * gerendert. Idle/Ready = Pfeil (Send). Streaming/Submitted = Quadrat (Stop).
 * Visueller Wechsel via CSS-opacity-Transition.
 */
interface LeoChatSendButtonProps {
  status: "submitted" | "streaming" | "ready" | "error";
}

export default function LeoChatSendButton({ status }: LeoChatSendButtonProps) {
  const isBusy = status === "streaming" || status === "submitted";

  return (
    <div style={{ position: "relative", width: 18, height: 18 }}>
      {/* Send-Pfeil */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 16 16"
        fill="none"
        style={{
          position: "absolute",
          inset: 0,
          opacity: isBusy ? 0 : 1,
          transition: "opacity 0.18s ease",
        }}
      >
        <path
          d="M8 14V2M8 2L3 7M8 2l5 5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {/* Stop-Quadrat */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 16 16"
        fill="none"
        style={{
          position: "absolute",
          inset: 0,
          opacity: isBusy ? 1 : 0,
          transition: "opacity 0.18s ease",
        }}
      >
        <rect x="4" y="4" width="8" height="8" rx="1.5" fill="white" />
      </svg>
    </div>
  );
}
