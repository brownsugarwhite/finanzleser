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
        {/* Download-Icon weiß */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            marginLeft: "-7px",
            marginTop: "-7px",
          }}
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </div>
    </a>
  );
}
