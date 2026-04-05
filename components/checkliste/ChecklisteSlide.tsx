"use client";

import type { ChecklisteSektionData } from "./types";
import ChecklistePunkt from "./ChecklistePunkt";

interface Props {
  sektion: ChecklisteSektionData;
  sektionIndex: number;
  checkedItems: Record<string, boolean>;
  onToggle: (key: string) => void;
}

export default function ChecklisteSlide({
  sektion,
  sektionIndex,
  checkedItems,
  onToggle,
}: Props) {
  return (
    <div className="checkliste-slide">
      <h3 className="checkliste-slide-titel">{sektion.titel}</h3>
      <div className="checkliste-slide-punkte">
        {sektion.punkte.map((punkt, punktIndex) => {
          const key = `${sektionIndex}-${punktIndex}`;
          return (
            <ChecklistePunkt
              key={key}
              punkt={punkt}
              checked={!!checkedItems[key]}
              onToggle={() => onToggle(key)}
            />
          );
        })}
      </div>
    </div>
  );
}
