"use client";

interface Props {
  checked: number;
  total: number;
}

export default function ChecklisteProgress({ checked, total }: Props) {
  const percent = total > 0 ? Math.round((checked / total) * 100) : 0;

  return (
    <div className="checkliste-progress">
      <div className="checkliste-progress-info">
        <span>{checked} von {total} erledigt</span>
        <span>{percent}%</span>
      </div>
      <div className="checkliste-progress-track">
        <div
          className="checkliste-progress-bar"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
