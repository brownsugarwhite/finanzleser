"use client";

/**
 * Die Tokens des Fadens, so wie der Browser sie wirklich sieht.
 *
 * 🚨 Die Werte stehen NICHT in dieser Datei. Sie werden zur Laufzeit aus `.faden-shell`
 * gelesen (`getComputedStyle`) — eine abgeschriebene Liste veraltet beim ersten Umbau,
 * und dann zeigt der Schaukasten etwas anderes als die Seite. Neue Tokens hier nur
 * eintragen, wenn sie einen Namen bekommen sollen; der Wert kommt von selbst.
 */
import { useEffect, useRef, useState } from "react";

const FARBEN: [string, string][] = [
  ["--paper", "Die Seite. Standardgrund für alles"],
  ["--auflage", "Nur was über dem Papier schwebt: Menü, Dialog, Feld"],
  ["--ink", "Titel, Fließtext"],
  ["--muted", "Kicker, Hinweis, Bildunterschrift"],
  ["--green", "Marke: Pfeile, Punkte, Knopfscheibe"],
  ["--green-ink", "Marke als Schrift"],
  ["--pink", "Zweitmarke: Spiel, Finanzwort"],
  ["--tint", "Grüner Hauch, für Hervorhebungen"],
  ["--pink-tint", "Magenta-Hauch"],
  ["--tool-rechner", "Punkt: Rechner"],
  ["--tool-vergleich", "Punkt: Vergleich"],
  ["--tool-checkliste", "Punkt: Checkliste"],
  ["--tool-dokumente", "Punkt: Dokumente"],
];

const LINIEN: [string, string][] = [
  ["--rule-soft", "Feinster Trenner (Verzeichnis)"],
  ["--rule-fein", "Zeilen in Listen"],
  ["--rule", "Blocktrenner"],
  ["--rule-mid", "Kapitelkopf, Gleis, Chipkontur"],
  ["--rule-strong", "Volle Tinte: Blockkopf, Knopf"],
];

const LUFT: [string, string][] = [
  ["--luft-xs", "Zeilenabstand in einer Liste"],
  ["--luft-s", "Zwischen Kicker und Titel"],
  ["--luft-m", "Innerhalb eines Blocks"],
  ["--luft-l", "Zwischen zwei Teilen eines Blocks"],
  ["--luft-xl", "Zwischen zwei Blöcken"],
  ["--luft-xxl", "Zwischen zwei Kapitelteilen"],
];

const SCHRIFT: [string, string][] = [
  ["--schrift-kicker", "Kicker · Versalien"],
  ["--schrift-klein", "Fußnote, Quelle"],
  ["--schrift-hinweis", "Der kursive Halbsatz rechts"],
  ["--schrift-text", "Fließtext"],
  ["--schrift-zeile", "Titelzeile in einer Liste"],
  ["--schrift-vorspann", "Vorspann unter der Schlagzeile"],
  ["--schrift-schlag", "Blockschlagzeile"],
  ["--schrift-gross", "Kassensturzfrage"],
];

export default function SchaukastenTokens() {
  const anker = useRef<HTMLDivElement>(null);
  const [werte, setWerte] = useState<Record<string, string>>({});
  useEffect(() => {
    const el = anker.current?.closest(".faden-shell") || anker.current;
    if (!el) return;
    const s = getComputedStyle(el);
    const alle = [...FARBEN, ...LINIEN, ...LUFT, ...SCHRIFT].map(([k]) => k);
    setWerte(Object.fromEntries(alle.map((k) => [k, s.getPropertyValue(k).trim()])));
  }, []);

  return (
    <div className="token" ref={anker}>
      <h3 className="token__titel">Farben</h3>
      <ul className="token__felder">
        {FARBEN.map(([k, was]) => (
          <li key={k}>
            <i className="token__probe" style={{ background: `var(${k})` }} />
            <code>{k}</code>
            <b>{werte[k] || "…"}</b>
            <span>{was}</span>
          </li>
        ))}
      </ul>

      <h3 className="token__titel">Linien</h3>
      <ul className="token__linien">
        {LINIEN.map(([k, was]) => (
          <li key={k}>
            <code>{k}</code>
            <i style={{ background: `var(${k})` }} />
            <span>{was}</span>
            <b>{werte[k] || "…"}</b>
          </li>
        ))}
      </ul>

      <h3 className="token__titel">Abstandsleiter</h3>
      <ul className="token__luft">
        {LUFT.map(([k, was]) => (
          <li key={k}>
            <code>{k}</code>
            <b>{werte[k] || "…"}</b>
            <i style={{ width: `var(${k})` }} />
            <span>{was}</span>
          </li>
        ))}
      </ul>

      <h3 className="token__titel">Schriftleiter</h3>
      <ul className="token__schrift">
        {SCHRIFT.map(([k, was]) => (
          <li key={k}>
            <span className="token__satz" style={{ font: `var(${k})` }}>Finanzleser · 0123</span>
            <code>{k}</code>
            <span>{was}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
