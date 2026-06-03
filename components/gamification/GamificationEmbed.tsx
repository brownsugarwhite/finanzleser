"use client";

import { useState } from "react";

interface GamificationEmbedProps {
  gamType: string;
  fields: Record<string, string>;
}

const LABELS: Record<string, string> = {
  mythos: "Mythos oder Fakt?",
  karte: "Karteikarte",
  test: "Mini-Selbsttest",
  gewusst: "Schon gewusst?",
};

const ICONS: Record<string, string> = {
  mythos: "🔍",
  karte: "🔄",
  test: "🧠",
  gewusst: "💡",
};

/**
 * Interaktive Gamification-Box im Artikel.
 * Quelle: <div data-finanzleser-gamification="TYP"> mit data-gam-field-Feldern,
 * vom Content Studio erzeugt und in ArticleContent.parseContent() ausgelesen.
 */
export default function GamificationEmbed({ gamType, fields }: GamificationEmbedProps) {
  const [open, setOpen] = useState(false);
  const [flipped, setFlipped] = useState(false);

  const label = LABELS[gamType] ?? "Wissen";
  const icon = ICONS[gamType] ?? "💡";

  // Karteikarte – echtes Umdrehen
  if (gamType === "karte") {
    const front = fields.begriff ?? "";
    const back = fields.erklaerung ?? "";
    return (
      <div className={`fl-gam fl-gam-karte${flipped ? " is-flipped" : ""}`}>
        <button
          type="button"
          className="fl-gam-card-btn"
          onClick={() => setFlipped((v) => !v)}
          aria-pressed={flipped}
          aria-label={`Karteikarte ${front} umdrehen`}
        >
          <span className="fl-gam-card-inner">
            <span className="fl-gam-card-face fl-gam-card-front">
              <span className="fl-gam-tag">{icon} {label}</span>
              <span className="fl-gam-card-term">{front}</span>
              <span className="fl-gam-card-hint">Tippen zum Umdrehen</span>
            </span>
            <span className="fl-gam-card-face fl-gam-card-back">
              <span className="fl-gam-card-def">{back}</span>
              <span className="fl-gam-card-hint">Zurück tippen</span>
            </span>
          </span>
        </button>
      </div>
    );
  }

  // Schon gewusst – statische Hinweis-Box
  if (gamType === "gewusst") {
    return (
      <div className="fl-gam fl-gam-gewusst">
        <span className="fl-gam-tag">{icon} {label}</span>
        <p className="fl-gam-text">{fields.text ?? ""}</p>
      </div>
    );
  }

  // Mythos oder Fakt / Mini-Selbsttest – aufklappbar
  const primary = gamType === "mythos" ? (fields.behauptung ?? "") : (fields.frage ?? "");
  const reveal = gamType === "mythos" ? (fields.aufloesung ?? "") : (fields.antwort ?? "");
  const revealLabel = gamType === "mythos" ? "Auflösung anzeigen" : "Antwort anzeigen";

  return (
    <div className={`fl-gam fl-gam-${gamType}`}>
      <span className="fl-gam-tag">{icon} {label}</span>
      <p className="fl-gam-claim">{primary}</p>
      <button
        type="button"
        className="fl-gam-reveal-btn"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? "▾ " : "▸ "}
        {revealLabel}
      </button>
      {open && <p className="fl-gam-reveal">{reveal}</p>}
    </div>
  );
}
