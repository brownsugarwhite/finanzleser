interface RechnerButtonProps {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
  needsUpdate?: boolean;
}

export default function RechnerButton({
  onClick,
  label = "Berechnen",
  disabled = false,
  needsUpdate = false,
}: RechnerButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rechner-button ${disabled ? "rechner-button--disabled" : ""}`}
      disabled={disabled}
      title={disabled ? "Geben Sie neue Werte ein" : undefined}
    >
      {needsUpdate ? "Ergebnis aktualisieren" : label}
    </button>
  );
}
