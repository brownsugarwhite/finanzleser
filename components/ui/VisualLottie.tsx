type Props = {
  className?: string;
  style?: React.CSSProperties;
  seed?: string;
};

export default function VisualLottie({ className, style }: Props) {
  return (
    <div
      aria-hidden
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0, 0, 0, 0.05)",
        pointerEvents: "none",
        ...style,
      }}
    />
  );
}
