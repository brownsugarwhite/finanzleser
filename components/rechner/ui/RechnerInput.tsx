"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import FieldOutline from "@/components/ui/FieldOutline";

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
  /** Zusätzlich einen Slider anzeigen (braucht min & max). */
  slider?: boolean;
}

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
  step,
  min = 0,
  max,
  tooltip,
  disabled = false,
  slider = false,
}: RechnerInputProps) {
  const [display, setDisplay] = useState<string>(() => toDisplay(value));
  const [dragging, setDragging] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [thumbHover, setThumbHover] = useState(false);
  const focused = useRef(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scaleMinRef = useRef<HTMLSpanElement>(null);
  const scaleMaxRef = useRef<HTMLSpanElement>(null);
  const dragVal = useRef(0);

  useEffect(() => {
    if (focused.current || dragging) return;
    const ext = showSlider ? fmtVal(committed) : toDisplay(value);
    const differs = showSlider ? ext !== display : parseNum(ext) !== parseNum(display);
    if (differs) setDisplay(ext);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const sanitize = (raw: string) => {
    const allowNeg = typeof min === "number" && min < 0;
    return raw.replace(allowNeg ? /[^0-9.,-]/g : /[^0-9.,]/g, "").replace(/^(-?)0+(?=\d)/, "$1");
  };

  // Non-Slider: live onChange (unverändert). Slider: nur tippen, Commit bei Enter/Blur.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = sanitize(e.target.value);
    setDisplay(raw);
    onChange(parseNum(raw));
  };

  const showSlider = slider && typeof min === "number" && typeof max === "number" && max > min;
  const sMin = min as number;
  const sMax = (max as number) ?? 100;
  const stepNum = Number(step) || 1;
  // Dezimalstellen aus dem Step → Format bleibt erhalten (z.B. „6,0" statt „6").
  const decimals = (String(step ?? "").split(".")[1] || "").length;
  const fmtVal = (n: number) =>
    decimals > 0
      ? n.toLocaleString("de-DE", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
      : toDisplay(n);
  // Feste Bubble-Breite (größter Wert) → Label-Größe konstant, wackelt nicht.
  const widthCh = Math.max(2, fmtVal(sMin).length, fmtVal(sMax).length);
  // Handle-Position = COMMITTED Wert (prop), nicht der Tipp-Puffer → springt beim Tippen nicht.
  const committed = parseNum(toDisplay(value));
  const clamped = Math.min(sMax, Math.max(sMin, committed));
  const pct = showSlider ? ((clamped - sMin) / (sMax - sMin)) * 100 : 0;

  // Bubble am Containerrand klemmen; nur der Pfeil (--arrow-x) folgt dem Handle weiter.
  // Außerdem min/max-Skala ausfaden, wenn die Bubble nah dran ist.
  const layoutBubble = useCallback((p: number) => {
    const track = trackRef.current, bubble = bubbleRef.current;
    if (track && bubble) {
      const tw = track.offsetWidth;
      const bw = bubble.offsetWidth;
      const thumbX = (p / 100) * tw;
      const half = bw / 2;
      const center = Math.max(half, Math.min(tw - half, thumbX));
      // Pfeil innerhalb der Bubble halten (nicht über den Rand hinaus).
      const arrowX = Math.max(-(half - 8), Math.min(half - 8, thumbX - center));
      bubble.style.left = `${center}px`;
      bubble.style.setProperty("--arrow-x", `${arrowX}px`);
    }
    if (scaleMinRef.current) scaleMinRef.current.style.opacity = p < 16 ? "0" : "1";
    if (scaleMaxRef.current) scaleMaxRef.current.style.opacity = p > 84 ? "0" : "1";
  }, []);

  // Committed-Position der Bubble (nach Re-Render); während Drag malt paintDrag direkt.
  useLayoutEffect(() => {
    if (showSlider && !dragging) layoutBubble(pct);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pct, showSlider]);
  useEffect(() => {
    if (!showSlider) return;
    const onR = () => { if (!dragging) layoutBubble(pct); };
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pct, showSlider]);

  // Slider-Eingabe erst bei Enter/Blur übernehmen → Handle slidet dann auf den Wert.
  const commitSlider = () => {
    let v = display === "" || display === "-" ? sMin : parseNum(display);
    v = Math.min(sMax, Math.max(sMin, v));
    v = parseFloat(v.toFixed(6));
    setDisplay(fmtVal(v));
    onChange(v);
  };

  // Drag: direkt im DOM malen (kein React-Re-Render → stufenlos/smooth), Commit bei pointerup.
  const paintDrag = useCallback((clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    let v = sMin + ratio * (sMax - sMin);
    v = Math.round(v / stepNum) * stepNum;
    v = Math.min(sMax, Math.max(sMin, v));
    v = parseFloat(v.toFixed(6));
    dragVal.current = v;
    const p = ((v - sMin) / (sMax - sMin)) * 100;
    if (fillRef.current) fillRef.current.style.width = `${p}%`;
    if (thumbRef.current) thumbRef.current.style.left = `${p}%`;
    layoutBubble(p);
    if (inputRef.current) inputRef.current.value = fmtVal(v);
  }, [sMin, sMax, stepNum, decimals, layoutBubble]);

  useEffect(() => {
    if (!dragging) return;
    const move = (e: PointerEvent) => paintDrag(e.clientX);
    const up = () => {
      setDragging(false);
      const v = dragVal.current;
      setDisplay(fmtVal(v));
      onChange(v);
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [dragging, paintDrag, onChange]);

  return (
    <div className="rechner-input-wrapper">
      <label htmlFor={name} className="rechner-label">
        {label}
        {tooltip && <span className="rechner-tooltip" title={tooltip}> ⓘ</span>}
      </label>

      {showSlider ? (
        /* Slider mit editierbarer Bubble UNTER dem Handle (ersetzt das separate Feld). */
        <div className={`rechner-slider${dragging || inputFocused ? " is-active" : ""}${dragging ? " is-dragging" : ""}${thumbHover ? " is-handle-hover" : ""}`}>
          <div
            className="rechner-slider-track"
            ref={trackRef}
            onPointerDown={(e) => { e.preventDefault(); setDragging(true); paintDrag(e.clientX); }}
          >
            <div className="rechner-slider-fill" ref={fillRef} style={{ width: `${pct}%` }} />
            <div
              className="rechner-slider-thumb"
              ref={thumbRef}
              style={{ left: `${pct}%` }}
              onPointerEnter={() => setThumbHover(true)}
              onPointerLeave={() => setThumbHover(false)}
            />
          </div>

          {/* Editierbare Wert-Bubble, hängt am Handle (Pfeil nach oben, leicht runde Ecken).
              Position/Pfeil via layoutBubble (am Rand geklemmt). Klick fokussiert das Feld. */}
          <div
            className="rechner-slider-input"
            ref={bubbleRef}
            onMouseDown={(e) => { e.preventDefault(); inputRef.current?.focus(); inputRef.current?.select(); }}
          >
            <input
              id={name}
              ref={inputRef}
              type="text"
              inputMode="decimal"
              name={name}
              value={display}
              style={{ width: `${widthCh}ch` }}
              onFocus={(e) => { focused.current = true; setInputFocused(true); e.target.select(); }}
              onKeyDown={(e) => { if (e.key === "Enter") { commitSlider(); inputRef.current?.blur(); } }}
              onBlur={() => {
                focused.current = false;
                setInputFocused(false);
                commitSlider();
              }}
              onChange={(e) => setDisplay(sanitize(e.target.value))}
              disabled={disabled}
              className="rechner-slider-input-field"
              aria-label={label}
              {...(max !== undefined ? { "aria-valuemax": max } : {})}
            />
            {einheit && <span className="rechner-slider-input-unit">{einheit}</span>}
          </div>

          <div className="rechner-slider-scale">
            <span ref={scaleMinRef}>{fmtVal(sMin)}{einheit ? ` ${einheit}` : ""}</span>
            <span ref={scaleMaxRef}>{fmtVal(sMax)}{einheit ? ` ${einheit}` : ""}</span>
          </div>
        </div>
      ) : (
        <div className="rechner-input-container field-wrap rechner-field">
          <input
            id={name}
            type="text"
            inputMode="decimal"
            name={name}
            value={display}
            onFocus={() => { focused.current = true; }}
            onBlur={() => {
              focused.current = false;
              if (display === "" || display === "-") {
                setDisplay(toDisplay(min));
                onChange(min);
              } else {
                setDisplay(toDisplay(parseNum(display)));
              }
            }}
            onChange={handleChange}
            disabled={disabled}
            className={`rechner-input ${einheit ? "rechner-input--has-unit" : ""} ${disabled ? "rechner-input--disabled" : ""}`}
            aria-label={label}
            {...(max !== undefined ? { "aria-valuemax": max } : {})}
          />
          {einheit && <span className="rechner-einheit-btn" aria-hidden>{einheit}</span>}
          <FieldOutline radius={19} />
        </div>
      )}
    </div>
  );
}
