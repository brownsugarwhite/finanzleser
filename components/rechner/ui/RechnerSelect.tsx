interface RechnerSelectProps {
  label: string;
  name: string;
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[];
}

export default function RechnerSelect({
  label,
  name,
  value,
  onChange,
  options,
}: RechnerSelectProps) {
  return (
    <div className="rechner-select-wrapper">
      <label htmlFor={name} className="rechner-label">
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rechner-select"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
