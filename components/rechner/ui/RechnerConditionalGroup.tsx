/**
 * Bedingt sichtbare Eingabegruppe
 * Zeigt/versteckt Kindkomponenten basierend auf visible-Prop.
 * Genutzt von: brutto-netto (kinderlos>23), erbschaftsteuer (Alter Kind)
 */

interface RechnerConditionalGroupProps {
  visible: boolean;
  children: React.ReactNode;
  label?: string;
}

export default function RechnerConditionalGroup({
  visible,
  children,
  label,
}: RechnerConditionalGroupProps) {
  if (!visible) return null;

  return (
    <div className="rechner-conditional-group">
      {label && <div className="rechner-conditional-label">{label}</div>}
      {children}
    </div>
  );
}
