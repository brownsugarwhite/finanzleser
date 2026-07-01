type Props = {
  pdfUrl: string;
  fileName?: string;
  fileSize?: number | string;
  label?: string;
};

function formatSize(bytes?: number | string): string | null {
  if (!bytes) return null;
  const n = typeof bytes === "string" ? parseInt(bytes, 10) : bytes;
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DokumentDownload({
  pdfUrl,
  fileName,
  fileSize,
  label = "PDF herunterladen",
}: Props) {
  if (!pdfUrl) return null;

  const sizeLabel = formatSize(fileSize);
  const text = sizeLabel ? `${label} (${sizeLabel})` : label;

  return (
    <a
      href={pdfUrl}
      download={fileName}
      target="_blank"
      rel="noopener"
      className="rechner-button"
      style={{
        backgroundColor: "transparent",
        borderRadius: "21px",
        paddingLeft: "19px",
        paddingRight: "3px",
        paddingTop: "3px",
        paddingBottom: "3px",
        border: "2px solid var(--color-text-primary)",
        outline: "1px solid var(--color-text-primary)",
        outlineOffset: "2px",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: "15px",
        height: "48px",
        alignSelf: "flex-start",
        textDecoration: "none",
      }}
    >
      <div
        style={{
          fontFamily: "Open Sans, sans-serif",
          fontSize: "17px",
          color: "var(--color-text-primary)",
          fontWeight: 500,
          lineHeight: "30px",
          whiteSpace: "nowrap",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          margin: 0,
        }}
      >
        <p style={{ margin: 0, padding: 0, color: "var(--color-text-primary)" }}>
          {text}
        </p>
      </div>
      <div
        style={{
          position: "relative",
          width: "38px",
          height: "38px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            backgroundColor: "var(--color-brand)",
            borderRadius: "17px",
          }}
        />
        {/* Download-Icon weiß — identisch zum Checklisten-Herunterladen-Button (Button.tsx) */}
        <svg
          width="11"
          height="12.5"
          viewBox="0 0 15 17"
          fill="none"
          style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
        >
          <path d="M13.5001 1.50009L7.50009 9.50009L1.50009 1.50009" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          <path d="M1.50009 15.5001L13.5001 15.5001" stroke="white" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
    </a>
  );
}
