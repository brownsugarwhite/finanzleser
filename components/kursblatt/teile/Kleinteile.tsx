"use client";
/**
 * Die Kleinteile des Kursblatts: Filter-Chip, Strich-Link, Logorahmen, Merken-Knopf,
 * Punktzeile und Schalter.
 *
 * Vorlagen in „Finanzleser Vergleich & Rechner - Kursblatt.dc.html“:
 * Chip :173 · Strich-Link :159 · Logorahmen :127/:154/:190 · Merken :145/:160/:202 ·
 * Punktzeile :136-138.
 *
 * Bis auf Chip, Merken und Schalter alles Serverkomponenten — es gibt nichts zu bedienen.
 */
import type { ReactNode } from "react";

/* ── Filter-Chip (K:173) ─────────────────────────────────────────────────────────── */
export function Chip({
  label, aktiv, onKlick, treffer,
}: {
  label: string;
  aktiv: boolean;
  onKlick: () => void;
  /** Zahl in Klammern; fehlt sie, steht nur das Wort da. */
  treffer?: number;
}) {
  return (
    <button type="button" className="kb-chip" data-aktiv={aktiv ? "an" : "aus"} aria-pressed={aktiv} onClick={onKlick}>
      <i className="kb-chip__punkt" aria-hidden="true" />
      {label}
      {treffer !== undefined && <small className="kb-chip__zahl">{treffer}</small>}
    </button>
  );
}

/* ── Strich-Link: der Strich wächst beim Überfahren (K:159) ──────────────────────── */
export function StrichLink({
  text, href, rel, target, onClick,
}: {
  text: string;
  href?: string;
  rel?: string;
  target?: string;
  onClick?: () => void;
}) {
  const inneres = (<><span>{text}</span><i className="kb-strich__strich" aria-hidden="true" /></>);
  if (href) return <a className="kb-strich" href={href} rel={rel} target={target}>{inneres}</a>;
  return <button type="button" className="kb-strich" onClick={onClick}>{inneres}</button>;
}

/* ── Logorahmen (K:127 Gewinner 120×42, :154 Platz 96×34, :190 Zeile 96/64×34) ───── */
export function Logorahmen({
  quelle, name, groesse = "zeile",
}: {
  quelle?: string;
  name: string;
  groesse?: "gewinner" | "platz" | "zeile";
}) {
  return (
    <div className={`kb-logo kb-logo--${groesse}`}>
      {quelle ? (
        // Bewusst <img>: die Logos liegen auf dem Partner-CDN in unbekannten Maßen und
        // wechseln zweimal täglich; next/image brächte hier nur eine Optimierungsschleife.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={quelle} alt={name} loading="lazy" />
      ) : (
        <b aria-hidden="true">{name.slice(0, 1).toUpperCase()}</b>
      )}
    </div>
  );
}

/* ── Merken (K:145) ──────────────────────────────────────────────────────────────── */
export function MerkenKnopf({
  gemerkt, onKlick, klein = false,
}: {
  gemerkt: boolean;
  onKlick: () => void;
  klein?: boolean;
}) {
  return (
    <button
      type="button"
      className={"kb-merken" + (klein ? " kb-merken--klein" : "")}
      data-gemerkt={gemerkt ? "an" : "aus"}
      aria-pressed={gemerkt}
      onClick={onKlick}
    >
      <svg width={klein ? 13 : 14} height={klein ? 13 : 14} viewBox="0 0 14 14" fill={gemerkt ? "var(--kb-gruen)" : "none"} stroke="currentColor" strokeWidth={1.5}>
        <path d="M3 1.5h8v11L7 9.6 3 12.5z" />
      </svg>
      {gemerkt ? "Gemerkt" : "Merken"}
    </button>
  );
}

/* ── Punktzeile: Bezeichnung ····· Wert (K:136-138) ──────────────────────────────── */
export function Punktzeile({
  k, v, ton, gross,
}: {
  k: string;
  v: ReactNode;
  ton?: "gut" | "warnung" | "werkzeug";
  /** Der Wert der ersten Zeile steht größer (K:136: 700 19px). */
  gross?: boolean;
}) {
  return (
    <div className="kb__punktzeile">
      <span className="kb__punktzeile-k">{k}</span>
      <i className="kb__fuehrung" aria-hidden="true" />
      <b className="kb__punktzeile-v" data-ton={ton} data-gross={gross ? "an" : undefined}>{v}</b>
    </div>
  );
}

/* ── Schalter ────────────────────────────────────────────────────────────────────── */
/**
 * 🚨 Nicht in der Kursblatt-Übergabe. 21 der 56 Rechner brauchen eine Ja/Nein-Eingabe
 * (RechnerCheckbox), das Kursblatt kennt aber keine. Statt etwas zu erfinden, kommt der
 * Schalter aus der vorherigen Faden-Übergabe (42×24, faden.css:1319-1330) in die
 * Kursblatt-Farben — dieselbe Designfamilie.
 */
export function Schalter({
  label, an, onSchalten,
}: {
  label: ReactNode;
  an: boolean;
  onSchalten: (an: boolean) => void;
}) {
  return (
    <button type="button" className="kb-schalter" role="switch" aria-checked={an} onClick={() => onSchalten(!an)}>
      <span className="kb-schalter__knopf" aria-hidden="true"><i /></span>
      <span>{label}</span>
    </button>
  );
}
