"use client";

/**
 * Register — ersetzt das Dropdown. Ein Verzeichnis klappt aus dem Blatt: nummeriert,
 * mit Punktführung und einer Zusatzinfo je Eintrag.
 *
 * Vorlage: design_handoff_finanzleser_kursblatt/„FL Register.dc.html“ (Markup :16-34,
 * Mechanik :37-62). Die Meta-Spalte ist ausdrücklich LEBENDIG (README:118): „36 Monate
 * ······ bis 3,45 %“ ist der Bestzins je Laufzeit, „Nur Deutschland ······ 4 Angebote“
 * die Trefferzahl. Deshalb nimmt `optionen` fertige Zeichenketten entgegen und rechnet
 * nichts selbst.
 */

import { useEffect, useRef, useState } from "react";
import { SPARK_PFAD } from "@/components/ui/Spark";
import type { Werkzeug } from "./Lineal";

export interface RegisterOption<T> {
  wert: T;
  label: string;
  meta?: string;
}

export interface RegisterProps<T extends string | number> {
  label: string;
  wert: T;
  onWert: (v: T) => void;
  optionen: RegisterOption<T>[];
  werkzeug?: Werkzeug;
  /** Höhe des Verzeichnisses, bevor es scrollt. 16 Bundesländer brauchen 300px. */
  maxHoehe?: string;
}

const FARBE: Record<Werkzeug, string> = {
  tuerkis: "var(--tuerkis)",
  magenta: "var(--pink)",
  gruen: "var(--green)",
  ink: "var(--ink)",
};

export default function Register<T extends string | number>({
  label, wert, onWert, optionen, werkzeug = "tuerkis", maxHoehe = "340px",
}: RegisterProps<T>) {
  const [offen, setOffen] = useState(false);
  const [hell, setHell] = useState(-1);
  const [lauf, setLauf] = useState(0);
  const wurzel = useRef<HTMLDivElement>(null);

  // Klick außerhalb schließt (FL Register:40).
  useEffect(() => {
    if (!offen) return;
    const aussen = (e: PointerEvent) => {
      if (wurzel.current && !wurzel.current.contains(e.target as Node)) setOffen(false);
    };
    document.addEventListener("pointerdown", aussen);
    return () => document.removeEventListener("pointerdown", aussen);
  }, [offen]);

  const gewaehlt = optionen.find((o) => o.wert === wert) ?? optionen[0];
  const umschalten = () => {
    setOffen((o) => !o);
    setLauf((l) => l + 1);
    setHell(optionen.findIndex((o) => o.wert === wert));
  };
  const waehle = (o: RegisterOption<T>) => { onWert(o.wert); setOffen(false); };

  const taste = (e: React.KeyboardEvent) => {
    if (!optionen.length) return;
    if (e.key === "Escape") { setOffen(false); return; }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!offen) { umschalten(); return; }
      const d = e.key === "ArrowDown" ? 1 : -1;
      setHell((h) => (h + d + optionen.length) % optionen.length);
    }
    if ((e.key === "Enter" || e.key === " ") && offen && hell >= 0) {
      e.preventDefault();
      waehle(optionen[hell]);
    }
  };

  const druck = lauf % 2 ? "fl-druck2" : "fl-druck";

  return (
    <div
      ref={wurzel}
      className="kb-register"
      data-offen={offen ? "an" : "aus"}
      onKeyDown={taste}
      style={{ "--kb-feld-farbe": FARBE[werkzeug], "--kb-register-hoehe": maxHoehe } as React.CSSProperties}
    >
      <span className="kb-register__label">{label}</span>

      <button
        type="button"
        className="kb-register__trigger"
        aria-haspopup="listbox"
        aria-expanded={offen}
        aria-label={`${label}: ${gewaehlt?.label ?? "–"}`}
        onClick={umschalten}
      >
        <span className="kb-register__gewaehlt">{gewaehlt?.label ?? "–"}</span>
        <span className="kb-register__rechts">
          {gewaehlt?.meta && <span className="kb-register__meta">{gewaehlt.meta}</span>}
          <svg width="14" height="14" viewBox="0 0 12 12.0005" className="kb-register__spark" aria-hidden="true">
            <path d={SPARK_PFAD} fill="currentColor" />
          </svg>
        </span>
      </button>

      <div className="kb-feldlinien" aria-hidden="true">
        <i className="kb-feldlinien__grund" />
        <i className="kb-feldlinien__doppel kb-feldlinien__doppel--stark" />
        <i className="kb-feldlinien__doppel kb-feldlinien__doppel--fein" />
      </div>

      <div className="kb-register__buehne">
        <div className="kb-register__verzeichnis" role="listbox" aria-label={label}>
          {optionen.map((o, i) => (
            <button
              key={String(o.wert)}
              type="button"
              role="option"
              aria-selected={o.wert === wert}
              tabIndex={-1}
              className="kb-register__eintrag"
              data-hell={i === hell ? "an" : "aus"}
              data-aktiv={o.wert === wert ? "an" : "aus"}
              onClick={() => waehle(o)}
              onMouseEnter={() => setHell(i)}
              style={{ animation: offen ? `${druck} .45s var(--kurve) ${(0.05 + i * 0.04).toFixed(2)}s both` : undefined }}
            >
              <i className="kb-register__nr">{String(i + 1).padStart(2, "0")}</i>
              <span className="kb-register__eintrag-label">
                <span>{o.label}</span>
                {o.meta && <i className="kb__fuehrung" />}
              </span>
              <small className="kb-register__eintrag-meta">{o.meta ?? ""}</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
