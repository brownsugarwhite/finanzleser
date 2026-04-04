interface RechnerButtonProps {
  onClick: () => void;
  label?: string;
}

export default function RechnerButton({
  onClick,
  label = "Berechnen",
}: RechnerButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rechner-button"
    >
      {label}
    </button>
  );
}
