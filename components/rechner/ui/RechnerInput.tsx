"use client";

import { useEffect, useRef, useState } from "react";

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

// Numerischen Anzeige-String aus einem externen value bilden (Komma als Dezimaltrenner).
function toDisplay(v: number | string): string {
  if (v === "" || v === null || v === undefined) return "";
  const n = typeof v === "string" ? parseFloat(v.replace(",", ".")) : v;
  if (typeof n !== "number" || isNaN(n)) return "";
  return String(n).replace(".", ",");
}

function parseNum(s: string): number {
  const n = parseFloat(s.replace(",", "."));
  return isNaN(n) ? 0 : n;
}

export default function RechnerInput({
  label,
  name,
  value,
  onChange,
  einheit,
  min = 0,
  max,
  tooltip,
  disabled = false,
}: RechnerInputProps) {
  // Eigener Anzeige-String, damit das Feld leer sein darf (keine erzwungene "0")
  // und führende Nullen entfernt werden ("010000" → "10000").
  const [display, setDisplay] = useState<string>(() => toDisplay(value));
  const focused = useRef(false);

  // Externe value-Änderungen (z.B. Reset/Slider) übernehmen — aber nicht
  // während der User tippt (sonst springt der Cursor / Eingabe wird überschrieben).
  useEffect(() => {
    if (focused.current) return;
    const ext = toDisplay(value);
    if (parseNum(ext) !== parseNum(display)) setDisplay(ext);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const allowNeg = typeof min === "number" && min < 0;
    let raw = e.target.value;
    // Nur Ziffern + ein Dezimaltrenner (Komma/Punkt) (+ optional Minus).
    raw = raw.replace(allowNeg ? /[^0-9.,-]/g : /[^0-9.,]/g, "");
    // Führende Nullen entfernen, aber "0," / "0." erlauben.
    raw = raw.replace(/^(-?)0+(?=\d)/, "$1");
    setDisplay(raw);
    onChange(parseNum(raw));
  };

  return (
    <div className="rechner-input-wrapper">
      <label htmlFor={name} className="rechner-label">
        {label}
        {tooltip && <span className="rechner-tooltip" title={tooltip}> ⓘ</span>}
      </label>
      <div className="rechner-input-container">
        <input
          id={name}
          type="text"
          inputMode="decimal"
          name={name}
          value={display}
          onFocus={() => { focused.current = true; }}
          onBlur={() => {
            focused.current = false;
            // Beim Verlassen leeres Feld auf min normalisieren (Anzeige + Wert).
            if (display === "" || display === "-") {
              setDisplay(toDisplay(min));
              onChange(min);
            } else {
              setDisplay(toDisplay(parseNum(display)));
            }
          }}
          onChange={handleChange}
          disabled={disabled}
          className={`rechner-input ${disabled ? "rechner-input--disabled" : ""}`}
          aria-label={label}
          {...(max !== undefined ? { "aria-valuemax": max } : {})}
        />
        {einheit && <span className="rechner-einheit">{einheit}</span>}
      </div>
    </div>
  );
}
