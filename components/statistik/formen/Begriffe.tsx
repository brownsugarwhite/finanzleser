"use client";

/**
 * Begriffe aus dem Glossar — Design A v2, Handoff Zeile 915–921, Logik 2038.
 *
 * Echte Definitionsliste: Begriff in Dunkelgrün auf 38 % der Breite, Erklärung auf dem Rest.
 * Die Begriffe sollen aus dem gepflegten Glossar stammen, nicht neu formuliert werden.
 */
import type { StatBegriffe } from "@/lib/statistik/schema";

export default function Begriffe({ st }: { st: StatBegriffe }) {
  return (
    <dl className="st-begriffe">
      {st.begriffe.map((g) => (
        <div key={g.begriff}>
          <dt>{g.begriff}</dt>
          <dd>{g.text}</dd>
        </div>
      ))}
    </dl>
  );
}
