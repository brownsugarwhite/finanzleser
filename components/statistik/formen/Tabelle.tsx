"use client";

/**
 * Vergleichstabelle im Zeitungssatz — Design A v2, Handoff Zeile 632–648, Logik 1900.
 *
 * Doppellinie über dem Kopf, Haarlinien zwischen den Zeilen, eine Spalte ist die Empfehlung
 * und trägt Marke, Auszeichnung und einen Hauch Magenta im Hintergrund. „✓“ steht grün,
 * „–“ grau. Zahlen laufen auf Tabellenziffern.
 */
import type { StatTabelle } from "@/lib/statistik/schema";

/** „–“ tritt zurück, „✓“ steht grün, alles andere in Tinte (Handoff, Logik Zeile 1900). */
function wertFarbe(w: string): string {
  if (w === "–" || w === "-") return "var(--muted)";
  if (w === "✓") return "var(--green-ink)";
  return "var(--ink)";
}

export default function Tabelle({ st }: { st: StatTabelle }) {
  return (
    <div className="st-tabelle">
      <div className="st-tabelle__doppel" />
      <div className="st-tabelle__doppel" />
      <div className="st-tabelle__rolle">
        <table>
          <thead>
            <tr>
              <th className="st-tabelle__kopf kicker">{st.zeilenkopf || "Leistung"}</th>
              {st.spalten.map((s) => (
                <th key={s.name} className={s.hervor ? "hervor" : undefined}>
                  <i style={{ background: s.hervor ? "var(--pink)" : "transparent" }} />
                  {s.name}
                  <small>{s.tag || ""}</small>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {st.zeilen.map((z) => (
              <tr key={z.name}>
                <td>{z.name}</td>
                {z.werte.map((w, j) => (
                  <td key={j} className={st.spalten[j]?.hervor ? "hervor" : undefined} style={{ color: wertFarbe(w) }}>{w}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="st-tabelle__schluss" />
      {st.fussnote && <p className="st-tabelle__fuss">{st.fussnote}</p>}
    </div>
  );
}
