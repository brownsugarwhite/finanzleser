"use client";

import type { ChecklistePunktData } from "./types";

interface Props {
  punkt: ChecklistePunktData;
  checked: boolean;
  onToggle: () => void;
}

export default function ChecklistePunkt({ punkt, checked, onToggle }: Props) {
  return (
    <label className={`checkliste-punkt ${checked ? "checkliste-punkt--checked" : ""}`}>
      <span className="checkliste-punkt-nummer">{punkt.nummer}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="checkliste-punkt-checkbox"
      />
      <div className="checkliste-punkt-content">
        <span className="checkliste-punkt-titel">{punkt.titel}</span>
        {punkt.beschreibung && (
          <span className="checkliste-punkt-text">{punkt.beschreibung}</span>
        )}
      </div>
    </label>
  );
}
