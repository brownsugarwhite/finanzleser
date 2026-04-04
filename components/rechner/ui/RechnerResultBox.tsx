interface RechnerResultBoxProps {
  label: string;
  value: string;
  highlight?: boolean;
  variant?: "default" | "positive" | "negative" | "neutral";
  subtext?: string;
  size?: "sm" | "md" | "lg";
}

export default function RechnerResultBox({
  label,
  value,
  highlight = false,
  variant = "default",
  subtext,
  size = "md",
}: RechnerResultBoxProps) {
  const classes = [
    "rechner-result-box",
    highlight ? "rechner-result-box--highlight" : "",
    variant !== "default" ? `rechner-result-box--${variant}` : "",
    size !== "md" ? `rechner-result-box--${size}` : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={classes}>
      <div className="rechner-result-label">{label}</div>
      <div className="rechner-result-value">{value}</div>
      {subtext && <div className="rechner-result-subtext">{subtext}</div>}
    </div>
  );
}
