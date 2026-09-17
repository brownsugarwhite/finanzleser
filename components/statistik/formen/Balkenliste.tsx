"use client";

/**
 * Balkenliste — die eine Form des Bestands, für die Design A v2 keine Vorlage hat.
 *
 * 🚨 Kein 1:1-Nachbau, weil es nichts zum Nachbauen gibt: der Setzkasten des Handoffs kennt
 * Kreis, Säulen, Spannen und Anteilsleiste, aber keine gereihte Balkenliste — und 156 der
 * 288 Bestandsstatistiken sind genau das. Sie ist deshalb aus der Bildsprache der Spannen
 * gebaut (Handoff 986–1004): Haarlinie je Zeile, Name im Merriweather links, 3-px-Balken in
 * Tinte auf einer Grundlinie, Wert in Tabellenziffern am Balkenende, Einfahren über scaleX
 * mit derselben Kurve und Staffelung. Keine Kästen, keine Rundungen.
 *
 * Ein Wert aus dem Regler („Ihr Wert“) steht magenta, wie der Median in den Spannen.
 */
import type { Segment } from "../StatistikKarte";
import { formatWert } from "@/lib/statistik/formeln";
import { useZeichnen } from "@/lib/statistik/useZeichnen";

export default function Balkenliste({ segmente, einheit, onHover }: { segmente: Segment[]; einheit?: string; onHover: (l: string | null) => void }) {
  const [wurzel, an] = useZeichnen<HTMLDivElement>();
  const max = Math.max(...segmente.map((s) => s.wert), 0) || 1;
  const hatHervor = segmente.some((s) => s.hervor);

  return (
    <div className="st-balken" ref={wurzel} role="img" aria-label={segmente.map((s) => `${s.label}: ${formatWert(s.wert, einheit)}`).join(", ")}>
      {segmente.map((s, i) => {
        const breite = Math.max(0, Math.min(100, (s.wert / max) * 100));
        return (
          <div
            key={s.label}
            className={"st-balken__zeile" + (s.ihr ? " st-balken__zeile--ihr" : "") + (hatHervor && !s.hervor ? " gedimmt" : "")}
            onMouseEnter={() => onHover(s.ihr ? "__ihr" : s.label)}
            onMouseLeave={() => onHover(null)}
          >
            <span className="st-balken__name">{s.label}</span>
            <div className="st-balken__bahn">
              <i className="st-balken__grund" />
              <i className="st-balken__balken" style={{ width: `${breite}%`, background: s.farbe, transform: `scaleX(${an ? 1 : 0})`, transitionDelay: `${i * 0.09}s` }} />
            </div>
            <b className="st-balken__wert">{formatWert(s.wert, einheit)}</b>
          </div>
        );
      })}
    </div>
  );
}
