interface RechnerInputProps {
  label: string;
  name: string;
  value: number | string;
  onChange: (val: number) => void;
  einheit?: string;
  step?: number | string;
  min?: number;
  max?: number;
  tooltip?: string;
  disabled?: boolean;
}

export default function RechnerInput({
  label,
  name,
  value,
  onChange,
  einheit,
  step = "any",
  min = 0,
  max,
  tooltip,
  disabled = false,
}: RechnerInputProps) {
  return (
    <div className="rechner-input-wrapper">
      <label htmlFor={name} className="rechner-label">
        {label}
        {tooltip && <span className="rechner-tooltip" title={tooltip}> ⓘ</span>}
      </label>
      <div className="rechner-input-container">
        <input
          id={name}
          type="number"
          name={name}
          value={typeof value === 'string' ? value.replace(',', '.') : value}
          onChange={(e) => onChange(parseFloat(e.target.value.replace(',', '.')) || 0)}
          step={step}
          min={min}
          max={max}
          disabled={disabled}
          className={`rechner-input ${disabled ? "rechner-input--disabled" : ""}`}
        />
        {einheit && <span className="rechner-einheit">{einheit}</span>}
      </div>
    </div>
  );
}
