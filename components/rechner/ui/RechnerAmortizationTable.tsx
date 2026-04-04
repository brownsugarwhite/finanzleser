/**
 * Tilgungsplan-Tabelle mit Jahres- und optionaler Monatssicht
 * Genutzt von: tilgung, annuitaet, kfw-studienkredit
 */

"use client";

import { useState } from "react";

export interface AmortizationRow {
  [key: string]: string | number;
}

interface Column {
  key: string;
  label: string;
  visible?: boolean; // Spalte nur anzeigen wenn true (default: true)
}

interface RechnerAmortizationTableProps {
  columns: Column[];
  yearlyRows: AmortizationRow[];
  monthlyRows?: AmortizationRow[][]; // Gruppiert nach Jahr
  showMonthlyToggle?: boolean;
}

export default function RechnerAmortizationTable({
  columns,
  yearlyRows,
  monthlyRows,
  showMonthlyToggle = true,
}: RechnerAmortizationTableProps) {
  const [showMonthly, setShowMonthly] = useState(false);
  const [expandedYear, setExpandedYear] = useState<number | null>(null);

  const visibleColumns = columns.filter((col) => col.visible !== false);
  const displayRows = showMonthly ? undefined : yearlyRows;

  return (
    <div className="rechner-amortization-wrapper">
      {showMonthlyToggle && monthlyRows && (
        <div className="rechner-amortization-toggle">
          <button
            type="button"
            className={`rechner-toggle-btn ${!showMonthly ? "rechner-toggle-btn--active" : ""}`}
            onClick={() => { setShowMonthly(false); setExpandedYear(null); }}
          >
            Jahresübersicht
          </button>
          <button
            type="button"
            className={`rechner-toggle-btn ${showMonthly ? "rechner-toggle-btn--active" : ""}`}
            onClick={() => setShowMonthly(true)}
          >
            Monatsübersicht
          </button>
        </div>
      )}

      <table className="rechner-result-table rechner-amortization-table">
        <thead>
          <tr>
            {visibleColumns.map((col) => (
              <th key={col.key} className="rechner-table-header rechner-table-align-right">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {!showMonthly &&
            yearlyRows.map((row, idx) => (
              <tr
                key={idx}
                className={monthlyRows ? "rechner-amortization-year-row" : ""}
                onClick={() => {
                  if (monthlyRows) {
                    setExpandedYear(expandedYear === idx ? null : idx);
                  }
                }}
              >
                {visibleColumns.map((col) => (
                  <td key={col.key} className="rechner-table-value rechner-table-align-right">
                    {String(row[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}

          {showMonthly &&
            monthlyRows?.map((yearMonths, yearIdx) =>
              yearMonths.map((row, monthIdx) => (
                <tr key={`${yearIdx}-${monthIdx}`}>
                  {visibleColumns.map((col) => (
                    <td key={col.key} className="rechner-table-value rechner-table-align-right">
                      {String(row[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
        </tbody>
      </table>
    </div>
  );
}
