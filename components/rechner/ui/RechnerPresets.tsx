"use client";

export interface RechnerPreset {
  label: string;
  values: Record<string, number>;
}

interface Props {
  presets: RechnerPreset[];
  onApply: (values: Record<string, number>) => void;
}

/**
 * Gamification-Vorauswahl wurde auf Wunsch entfernt — diese Komponente rendert
 * nichts mehr. Die `presets`/`onApply`-Props der einzelnen Rechner bleiben
 * unverändert (no-op), damit kein Rechner angefasst werden muss. Die frühere
 * Chip-/Spark-Implementierung liegt in der Git-History, falls sie zurück soll.
 */
export default function RechnerPresets(props: Props) {
  void props;
  return null;
}
