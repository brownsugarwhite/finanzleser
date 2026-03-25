interface RechnerInputProps {
  label: string;
  name: string;
  value: number | string;
  onChange: (val: number) => void;
  einheit?: string;
  step?: number;
  min?: number;
  max?: number;
}

export default function RechnerInput({
  label,
  name,
  value,
  onChange,
  einheit,
  step = 1,
  min = 0,
}: RechnerInputProps) {
  return (
    <div className="rechner-input-wrapper">
      <label htmlFor={name} className="rechner-label">
        {label}
      </label>
      <div className="rechner-input-container">
        <input
          id={name}
          type="number"
          name={name}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          step={step}
          min={min}
          className="rechner-input"
        />
        {einheit && <span className="rechner-einheit">{einheit}</span>}
      </div>
    </div>
  );
}
