"use client";

/**
 * Die Pille — die eine Aufforderung, die den Blick holen soll.
 *
 * 🚨 Bis zum 16.09.2026 stand hier die ganze Gestalt als Inline-Style: fünfzig Zeilen
 * mit `#1a1a1a`, `17px`, `21px` Radius und einer 38-px-Scheibe mit 17 px Radius (also
 * gar keinem Kreis). Daneben baute das Kursblatt in kb-pille dieselbe Pille ein
 * zweites Mal, nach den Maßen des Handoffs. Jetzt gibt es eine: `.pille` in
 * app/knoepfe.css, und beide Welten setzen sie.
 *
 * Die Farbe der Scheibe kommt aus `--werkzeug` (Türkis im Vergleich, Magenta im
 * Rechner) und fällt sonst auf Grün zurück. `farbe` überschreibt sie für den Einzelfall.
 */
import { cn } from "@/lib/cn";

interface ButtonProps {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  /** Wenn gesetzt, rendert der Knopf als <a> (z. B. für Datei-Downloads). */
  href?: string;
  download?: boolean | string;
  target?: string;
  rel?: string;
  /** Zeichen in der Scheibe: Pfeil rechts (Vorgabe), nach unten, oder Herunterladen. */
  icon?: "arrow" | "arrow-down" | "download";
  /** Kleinere Pille (42 px) für Listenzeilen. */
  klein?: boolean;
  /** Die Füllung wächst beim Überfahren auf die ganze Innenfläche. */
  /** Farbe der Scheibe, wenn nicht die Werkzeugfarbe gelten soll. */
  farbe?: string;
  className?: string;
}

function Zeichen({ icon }: { icon: NonNullable<ButtonProps["icon"]> }) {
  if (icon === "download") {
    return (
      <svg width="11" height="12.5" viewBox="0 0 15 17" fill="none" aria-hidden="true">
        <path d="M13.5 1.5L7.5 9.5L1.5 1.5" stroke="var(--auf-tinte)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <path d="M1.5 15.5L13.5 15.5" stroke="var(--auf-tinte)" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
    );
  }
  return (
    <svg width="11" height="15" viewBox="0 0 11 15" fill="none" aria-hidden="true"
         style={{ overflow: "visible", transform: icon === "arrow-down" ? "rotate(90deg)" : undefined }}>
      <path d="M1.5 1.5L9.5 7.5L1.5 13.5" stroke="var(--auf-tinte)" strokeWidth="3" fill="none"
            strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default function Button({
  label, onClick, disabled = false, href, download, target, rel,
  icon = "arrow", klein = false, farbe, className,
}: ButtonProps) {
  const klassen = cn("pille", klein && "pille--klein", className);
  const stil = farbe ? ({ "--pille-farbe": farbe } as React.CSSProperties) : undefined;

  const inhalt = (
    <>
      <span className="pille__text">{label}</span>
      <span className="pille__scheibe"><Zeichen icon={icon} /></span>
    </>
  );

  if (href && !disabled) {
    return (
      <a href={href} download={download} target={target} rel={rel} className={klassen} style={stil}>
        {inhalt}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={klassen} style={stil}>
      {inhalt}
    </button>
  );
}
