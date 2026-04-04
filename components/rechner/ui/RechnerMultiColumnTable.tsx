/**
 * Mehrspaltige Ergebnistabelle (z.B. Position | Monatlich | Jährlich)
 * Genutzt von: brutto-netto, einkommensteuer, u.a.
 */

interface Column {
  key: string;
  label: string;
  align?: "left" | "right";
}

interface RechnerMultiColumnTableProps {
  columns: Column[];
  rows: Record<string, string>[];
  footer?: Record<string, string>;
  highlightLastRow?: boolean;
  groupSeparators?: number[]; // Zeilen-Indices nach denen ein Trennstrich eingefügt wird
}

export default function RechnerMultiColumnTable({
  columns,
  rows,
  footer,
  highlightLastRow = false,
  groupSeparators = [],
}: RechnerMultiColumnTableProps) {
  return (
    <table className="rechner-result-table rechner-multi-column-table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th
              key={col.key}
              className={`rechner-table-header ${col.align === "right" ? "rechner-table-align-right" : ""}`}
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => {
          const isLast = idx === rows.length - 1;
          const hasSeparator = groupSeparators.includes(idx);
          return (
            <tr
              key={idx}
              className={[
                highlightLastRow && isLast ? "rechner-table-row--highlight" : "",
                hasSeparator ? "rechner-table-row--separator" : "",
              ].filter(Boolean).join(" ")}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`${col.key === columns[0].key ? "rechner-table-label" : "rechner-table-value"} ${col.align === "right" ? "rechner-table-align-right" : ""}`}
                >
                  {row[col.key] ?? ""}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
      {footer && (
        <tfoot>
          <tr>
            {columns.map((col) => (
              <td
                key={col.key}
                className={`${col.key === columns[0].key ? "rechner-table-footer-label" : "rechner-table-footer-value"} ${col.align === "right" ? "rechner-table-align-right" : ""}`}
              >
                {footer[col.key] ?? ""}
              </td>
            ))}
          </tr>
        </tfoot>
      )}
    </table>
  );
}
