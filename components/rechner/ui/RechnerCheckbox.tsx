"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface RechnerCheckboxProps {
  label: ReactNode;
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/**
 * Checkbox exakt wie in der Checkliste: eckig-runde Box (1px darkText), animierter
 * Haken (stroke-dashoffset „draw-on"). Vgl. components/checkliste/ChecklistePunkt.tsx.
 */
export default function RechnerCheckbox({ label, name, checked, onChange }: RechnerCheckboxProps) {
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
    <label className={`rechner-check ${checked ? "rechner-check--checked" : ""}`}>
      <input
        id={name}
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rechner-check-input"
      />
      <span className={`rechner-check-box ${checked ? "rechner-check-box--checked" : ""}`}>
        <svg className="rechner-check-check" width="34" height="36" viewBox="0 0 30 32" fill="none">
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
      <span className="rechner-check-label">{label}</span>
    </label>
  );
}
