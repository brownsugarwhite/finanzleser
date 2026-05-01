"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  type Versicherer,
  filterVersicherer,
  groupByLetter,
} from "@/lib/versicherer";

type Props = {
  value: Versicherer | null;
  onChange: (v: Versicherer | null) => void;
};

const PANEL_WIDTH = 320;
const PANEL_GAP = 13;
const VIEWPORT_PADDING = 23;
const MIN_HEIGHT = 270;

export default function VersichererSelect({ value, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(-1);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number; height: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => filterVersicherer(query), [query]);
  const groups = useMemo(() => groupByLetter(filtered), [filtered]);
  const flat = useMemo(() => groups.flatMap((g) => g.entries), [groups]);

  // Native Click-Listener am Trigger (umgeht React-Event-Delegation,
  // weil Leo per gsap-Flip außerhalb des React-Root-Containers verschoben wird)
  useEffect(() => {
    const t = triggerRef.current;
    if (!t) return;
    const handler = (e: MouseEvent) => {
      // Klick auf den ✕-Button ist separat behandelt
      const target = e.target as HTMLElement;
      if (target.closest(".versicherer-select__pill-x")) return;
      e.preventDefault();
      e.stopPropagation();
      setIsOpen((s) => !s);
    };
    t.addEventListener("click", handler);
    return () => t.removeEventListener("click", handler);
  }, [value]); // re-bind wenn Trigger zwischen Pill/Default wechselt

  // Native Click-Listener am ✕ (Pill-Modus)
  useEffect(() => {
    if (!value) return;
    const t = triggerRef.current;
    if (!t) return;
    const x = t.querySelector(".versicherer-select__pill-x");
    if (!x) return;
    const handler = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      onChange(null);
    };
    x.addEventListener("click", handler);
    return () => x.removeEventListener("click", handler);
  }, [value, onChange]);

  // Outside-Click → schließt (Trigger UND Panel sind "innen")
  useEffect(() => {
    if (!isOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideTrigger = wrapperRef.current?.contains(target);
      const insidePanel = panelRef.current?.contains(target);
      if (!insideTrigger && !insidePanel) setIsOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [isOpen]);

  // Panel-Position relativ zum Trigger berechnen + Höhen-Logik
  // (unten bis 23px vor Viewport-Rand; bei < MIN_HEIGHT nach oben verschieben)
  useLayoutEffect(() => {
    if (!isOpen) {
      setPanelPos(null);
      return;
    }
    const updatePos = () => {
      const t = triggerRef.current;
      if (!t) return;
      const r = t.getBoundingClientRect();
      const vh = window.innerHeight;

      // Right-aligned: panel.right = trigger.right (mit min 8px Viewport-Padding links)
      const left = Math.max(8, r.right - PANEL_WIDTH);

      // Panel sitzt IMMER unten am Viewport (23px Abstand), wächst nach oben.
      // Höhe = verfügbarer Platz unter Trigger ODER MIN_HEIGHT (überlagert dann den Trigger/Modal nach oben).
      const availableBelow = vh - r.bottom - PANEL_GAP - VIEWPORT_PADDING;
      const height = Math.max(MIN_HEIGHT, availableBelow);
      const top = vh - VIEWPORT_PADDING - height;
      setPanelPos({ top, left, height });
    };
    updatePos();
    window.addEventListener("resize", updatePos);
    window.addEventListener("scroll", updatePos, true);
    return () => {
      window.removeEventListener("resize", updatePos);
      window.removeEventListener("scroll", updatePos, true);
    };
  }, [isOpen]);

  // Beim Öffnen: Suche fokussieren, Highlight reset
  useEffect(() => {
    if (isOpen) {
      setHighlight(-1);
      setQuery("");
      // next-tick für die DOM-Verfügbarkeit
      const t = window.setTimeout(() => inputRef.current?.focus(), 30);
      return () => window.clearTimeout(t);
    }
  }, [isOpen]);

  const handleSelect = (v: Versicherer) => {
    onChange(v);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, flat.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
      return;
    }
    if (e.key === "Enter" && highlight >= 0 && flat[highlight]) {
      e.preventDefault();
      handleSelect(flat[highlight]);
    }
  };

  return (
    <div ref={wrapperRef} className="versicherer-select">
      {/* Trigger */}
      {value ? (
        <button
          type="button"
          ref={triggerRef}
          className="versicherer-select__pill"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span>{value.name}</span>
          <span
            role="button"
            tabIndex={0}
            aria-label={`Auswahl ${value.name} entfernen`}
            onClick={handleClear}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleClear(e as unknown as React.MouseEvent);
            }}
            className="versicherer-select__pill-x"
          >
            ✕
          </span>
        </button>
      ) : (
        <button
          type="button"
          ref={triggerRef}
          className="versicherer-select__trigger"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          Versicherer auswählen <span style={{ opacity: 0.6 }}>(optional)</span>{" "}
          <span aria-hidden style={{ marginLeft: 4 }}>⌄</span>
        </button>
      )}

      {/* Dropdown-Panel via Portal (sonst von .leo-badge overflow:hidden geclippt) */}
      {isOpen && panelPos && typeof document !== "undefined" && createPortal(
        <div
          ref={panelRef}
          className="versicherer-select__panel"
          role="listbox"
          style={{
            position: "fixed",
            top: panelPos.top,
            left: panelPos.left,
            width: PANEL_WIDTH,
            height: panelPos.height,
          }}
        >
          <div className="versicherer-select__search">
            <input
              ref={inputRef}
              type="text"
              placeholder="Versicherer suchen …"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlight(-1);
              }}
              onKeyDown={handleKey}
              aria-label="Versicherer suchen"
            />
          </div>

          <div className="versicherer-select__list">
            {groups.length === 0 && (
              <div className="versicherer-select__empty">Keine Treffer.</div>
            )}
            {groups.map((g) => (
              <div key={g.letter} className="versicherer-select__group">
                <div className="versicherer-select__letter">{g.letter}</div>
                {g.entries.map((v) => {
                  const flatIdx = flat.findIndex((f) => f.slug === v.slug);
                  const active = flatIdx === highlight;
                  const selected = value?.slug === v.slug;
                  return (
                    <button
                      key={v.slug}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => handleSelect(v)}
                      onMouseEnter={() => setHighlight(flatIdx)}
                      className={[
                        "versicherer-select__item",
                        active ? "is-active" : "",
                        selected ? "is-selected" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {v.name}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}

      <style>{`
        .versicherer-select {
          position: relative;
          display: inline-block;
        }
        .versicherer-select__trigger,
        .versicherer-select__pill {
          background: transparent;
          border: none;
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--color-text-medium);
          cursor: pointer;
          padding: 4px 0;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .versicherer-select__trigger:hover {
          color: var(--color-text-primary);
        }
        .versicherer-select__pill {
          background: var(--color-pill-bg);
          border: 1px solid var(--color-border-default);
          border-radius: 999px;
          padding: 4px 6px 4px 12px;
          color: var(--color-text-primary);
          font-weight: 500;
        }
        .versicherer-select__pill-x {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: rgba(0,0,0,0.06);
          color: var(--color-text-medium);
          font-size: 12px;
          margin-left: 6px;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .versicherer-select__pill-x:hover {
          background: rgba(0,0,0,0.12);
        }

        .versicherer-select__panel {
          /* position/top/left/width/height werden inline gesetzt (Portal in document.body) */
          /* Pill-Style analog leo-badge — backdrop-blur + brightness. Portal in document.body
             stellt sicher dass keine transformed/filtered ancestors den backdrop-filter blocken. */
          background-color: var(--color-pill-bg);
          backdrop-filter: brightness(1.15) blur(13px);
          -webkit-backdrop-filter: brightness(1.15) blur(13px);
          border-radius: 19px;
          box-shadow: 0 3px 23px rgba(0, 0, 0, 0.05);   /* matched leo-badge */
          z-index: 9999;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .versicherer-select__search {
          padding: 12px 20px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          flex-shrink: 0;
        }
        .versicherer-select__search input {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--color-text-primary);
          padding: 4px 0;
        }
        .versicherer-select__search input::placeholder {
          color: var(--color-text-medium);
          opacity: 1;
        }

        .versicherer-select__list {
          overflow-y: auto;
          flex: 1;
          padding: 0 0 8px;
        }
        .versicherer-select__empty {
          padding: 16px;
          text-align: center;
          color: var(--color-text-medium);
          font-family: var(--font-body);
          font-size: 14px;
        }
        .versicherer-select__group {
          display: flex;
          flex-direction: column;
        }
        .versicherer-select__letter {
          padding: 8px 16px 4px;
          font-family: var(--font-body);
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text-medium);
          letter-spacing: 0.5px;
          border-bottom: 1px solid var(--color-border-default);
          background: var(--color-bg-page);
          position: sticky;
          top: 0;
          z-index: 1;
        }
        .versicherer-select__item {
          background: transparent;
          border: none;
          text-align: left;
          padding: 8px 16px;
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--color-text-primary);
          cursor: pointer;
          transition: background 0.1s ease;
        }
        .versicherer-select__item:hover,
        .versicherer-select__item.is-active {
          background: var(--color-bg-page);
        }
        .versicherer-select__item.is-selected {
          background: var(--glass-brand-10);
          font-weight: 500;
        }

      `}</style>
    </div>
  );
}
