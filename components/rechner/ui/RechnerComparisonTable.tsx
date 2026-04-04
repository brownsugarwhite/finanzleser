/**
 * Vergleichstabelle für Szenarien nebeneinander (z.B. Normal vs Fünftelregelung)
 * Genutzt von: abfindung, steuerklassen
 */

interface Scenario {
  label: string;
  rows: { label: string; value: string }[];
}

interface RechnerComparisonTableProps {
  title?: string;
  scenarios: Scenario[];
  highlightDifference?: boolean; // Zeile hervorheben wenn sich Werte unterscheiden
}

export default function RechnerComparisonTable({
  title,
  scenarios,
  highlightDifference = false,
}: RechnerComparisonTableProps) {
  // Alle Zeilen-Labels aus dem ersten Szenario (alle Szenarien haben gleiche Labels)
  const rowLabels = scenarios[0]?.rows.map((r) => r.label) ?? [];

  return (
    <div className="rechner-comparison-wrapper">
      {title && <h4 className="rechner-comparison-title">{title}</h4>}
      <table className="rechner-result-table rechner-comparison-table">
        <thead>
          <tr>
            <th className="rechner-table-header">Position</th>
            {scenarios.map((s) => (
              <th key={s.label} className="rechner-table-header rechner-table-align-right">
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowLabels.map((label, idx) => {
            const values = scenarios.map((s) => s.rows[idx]?.value ?? "");
            const isDifferent = highlightDifference && new Set(values).size > 1;
            return (
              <tr
                key={label}
                className={isDifferent ? "rechner-table-row--highlight" : ""}
              >
                <td className="rechner-table-label">{label}</td>
                {values.map((val, sIdx) => (
                  <td key={sIdx} className="rechner-table-value rechner-table-align-right">
                    {val}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
