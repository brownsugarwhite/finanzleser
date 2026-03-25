interface RechnerResultBoxProps {
  label: string;
  value: string;
  highlight?: boolean;
}

export default function RechnerResultBox({
  label,
  value,
  highlight = false,
}: RechnerResultBoxProps) {
  return (
    <div className={`rechner-result-box ${highlight ? "rechner-result-box--highlight" : ""}`}>
      <div className="rechner-result-label">{label}</div>
      <div className="rechner-result-value">{value}</div>
    </div>
  );
}
