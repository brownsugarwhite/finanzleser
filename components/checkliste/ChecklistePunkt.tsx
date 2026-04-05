"use client";

import { useRef, useEffect } from "react";
import type { ChecklistePunktData } from "./types";

interface Props {
  punkt: ChecklistePunktData;
  checked: boolean;
  onToggle: () => void;
}

export default function ChecklistePunkt({ punkt, checked, onToggle }: Props) {
  const pathRef = useRef<SVGPathElement>(null);
  const prevChecked = useRef(false);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;

    if (checked && !prevChecked.current) {
      const length = path.getTotalLength();
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
      path.getBoundingClientRect();
      path.style.transition = "stroke-dashoffset 0.2s ease-out";
      path.style.strokeDashoffset = "0";
    } else if (!checked) {
      const length = path.getTotalLength();
      path.style.transition = "none";
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
    }

    prevChecked.current = checked;
  }, [checked]);

  return (
    <label className={`checkliste-punkt ${checked ? "checkliste-punkt--checked" : ""}`}>
      <span className="checkliste-punkt-nr-wrap">
        <span className="checkliste-punkt-nummer">{punkt.nummer}</span>
        <span className="checkliste-punkt-dots" />
      </span>

      {/* Hidden native checkbox */}
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="checkliste-punkt-input"
      />

      {/* Custom checkbox */}
      <span className={`checkliste-punkt-box ${checked ? "checkliste-punkt-box--checked" : ""}`}>
        <svg
          className="checkliste-punkt-check"
          width="34"
          height="36"
          viewBox="0 0 30 32"
          fill="none"
        >
          <path
            ref={pathRef}
            d="M3.5 13L12 25.5L26 3.5"
            stroke="var(--color-brand)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <div className="checkliste-punkt-content">
        <span className="checkliste-punkt-titel">{punkt.titel}</span>
        {punkt.beschreibung && (
          <span className="checkliste-punkt-text">{punkt.beschreibung}</span>
        )}
      </div>
    </label>
  );
}
