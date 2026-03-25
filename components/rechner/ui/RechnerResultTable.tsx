interface RechnerResultTableProps {
  rows: {
    label: string;
    value: string;
  }[];
  footer?: {
    label: string;
    value: string;
  };
}

export default function RechnerResultTable({ rows, footer }: RechnerResultTableProps) {
  return (
    <table className="rechner-result-table">
      <tbody>
        {rows.map((row) => (
          <tr key={row.label}>
            <td className="rechner-table-label">{row.label}</td>
            <td className="rechner-table-value">{row.value}</td>
          </tr>
        ))}
      </tbody>
      {footer && (
        <tfoot>
          <tr>
            <td className="rechner-table-footer-label">{footer.label}</td>
            <td className="rechner-table-footer-value">{footer.value}</td>
          </tr>
        </tfoot>
      )}
    </table>
  );
}
