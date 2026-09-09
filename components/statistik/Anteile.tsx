"use client";

/**
 * Anteilsleiste: ein Streifen, der ein Ganzes teilt — für Prozentwerte, die auf 100
 * aufgehen (siehe lib/statistik/darstellung.ts). Gegenüber dem Kreisdiagramm lassen sich
 * benachbarte Anteile direkt vergleichen; beim Kreis muss man Winkel schätzen.
 *
 * Aus Design A v2, Kapitel 3.
 *
 * 🚨 Beschriftet wird nur, was Platz hat. Der Prototyp hängt an jedes Stück eine Marke
 * und staffelt sie über kurze und lange Verbindungslinien. Bei echten Daten trägt das
 * nicht: Im Kfz-Bestand sind Hybrid, Elektro und Gas zusammen 11,4 % — drei Marken auf
 * einem Zehntel der Breite, und „Hybrid (davon Plug-in 2,0 %)" allein ist 154 px breit.
 * Nachgemessen liefen vier Beschriftungspaare ineinander. Ein Abstand in Prozent kann das
 * nicht verhindern, weil er die Breite der Schrift nicht kennt.
 *
 * Deshalb hier die Lösung, die eine Zeitung wählt: breite Stücke werden am Streifen
 * beschriftet, der schmale Rest wandert in eine Legende darunter. Die Grenze ist ein
 * fester Anteil, kein gemessener Wert — so entsteht kein Sprung beim Umschalten.
 */
import type { Segment } from "./StatistikKarte";
import { formatWert } from "@/lib/statistik/formeln";
import Legende from "./Legende";

/** Ab dieser Breite trägt ein Stück seine Beschriftung selbst. */
const SELBST_AB = 12;

export default function Anteile({ segmente, einheit, onHover, onToggle }: { segmente: Segment[]; einheit?: string; onHover: (l: string | null) => void; onToggle: (l: string) => void }) {
  const sichtbar = segmente.filter((s) => !s.aus);
  const summe = sichtbar.reduce((s, x) => s + x.wert, 0) || 1;
  const hatHervor = segmente.some((s) => s.hervor);

  let gelaufen = 0;
  const stuecke = sichtbar.map((s) => {
    const breite = (s.wert / summe) * 100;
    const mitte = gelaufen + breite / 2;
    gelaufen += breite;
    return { s, breite, mitte, amStreifen: breite >= SELBST_AB };
  });
  const amStreifen = stuecke.filter((x) => x.amStreifen);
  const inLegende = stuecke.filter((x) => !x.amStreifen);

  const zeigen = (s: Segment) => onHover(s.ihr ? "__ihr" : s.label);

  return (
    <div className="anteile">
      <div className="anteile__leiste" role="img" aria-label={segmente.map((s) => `${s.label}: ${formatWert(s.wert, einheit)}`).join(", ")}>
        {stuecke.map(({ s, breite }) => (
          <i
            key={s.label}
            className={"anteile__stueck" + (s.hervor ? " hervor" : "") + (hatHervor && !s.hervor ? " gedimmt" : "")}
            style={{ width: `${breite}%`, background: s.farbe }}
            onMouseEnter={() => zeigen(s)}
            onMouseLeave={() => onHover(null)}
            data-stueck=""
          />
        ))}
      </div>

      {amStreifen.length > 0 && (
        <div className="anteile__marken">
          {amStreifen.map(({ s, mitte }) => {
            // Am äußeren Rand würde eine mittige Beschriftung über die Kante laufen.
            const rechts = mitte > 88;
            const links = mitte < 12;
            return (
              <span
                key={s.label}
                className={"anteile__marke" + (hatHervor && !s.hervor ? " gedimmt" : "")}
                style={{ left: `${mitte}%`, transform: rechts ? "translateX(-100%)" : links ? "none" : "translateX(-50%)" }}
                onMouseEnter={() => zeigen(s)}
                onMouseLeave={() => onHover(null)}
              >
                <i className="anteile__strich" style={{ background: s.farbe }} />
                <b>{formatWert(s.wert, einheit)}</b>
                <em>{s.label}</em>
              </span>
            );
          })}
        </div>
      )}

      {inLegende.length > 0 && (
        <ul className="anteile__rest">
          {inLegende.map(({ s }) => (
            <li
              key={s.label}
              className={hatHervor && !s.hervor ? "gedimmt" : ""}
              onMouseEnter={() => zeigen(s)}
              onMouseLeave={() => onHover(null)}
            >
              <i style={{ background: s.farbe }} />
              <b>{formatWert(s.wert, einheit)}</b>
              <span>{s.label}</span>
            </li>
          ))}
        </ul>
      )}

      {segmente.some((s) => s.aus) ? <Legende segmente={segmente} einheit={einheit} onHover={onHover} onToggle={onToggle} /> : null}
    </div>
  );
}
