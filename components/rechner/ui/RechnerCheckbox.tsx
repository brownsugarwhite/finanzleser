interface RechnerCheckboxProps {
  label: string;
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export default function RechnerCheckbox({
  label,
  name,
  checked,
  onChange,
}: RechnerCheckboxProps) {
  return (
    <div className="rechner-checkbox-wrapper">
      <input
        id={name}
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rechner-checkbox"
      />
      <label htmlFor={name} className="rechner-checkbox-label">
        {label}
      </label>
    </div>
  );
}
