"use client";

import { useState } from "react";

type Props = {
  pdfUrl: string;
  title: string;
};

export default function DokumentPreview({ pdfUrl, title }: Props) {
  const [loaded, setLoaded] = useState(false);

  if (!pdfUrl) {
    return (
      <div
        className="dokument-preview dokument-preview--empty"
        style={{
          width: "100%",
          aspectRatio: "210 / 297",
          maxHeight: "min(900px, 80vh)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 12,
          background: "var(--color-placeholder-bg)",
          color: "var(--color-text-medium)",
          fontFamily: "var(--font-body)",
        }}
      >
        Keine Vorschau verfügbar
      </div>
    );
  }

  return (
    <div
      className="dokument-preview"
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "210 / 297",
        maxHeight: "min(900px, 80vh)",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
        background: "white",
      }}
    >
      {!loaded && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-text-medium)",
            fontFamily: "var(--font-body)",
            fontSize: 14,
            pointerEvents: "none",
          }}
        >
          Vorschau wird geladen …
        </div>
      )}
      <iframe
        src={`${pdfUrl}#toolbar=0&navpanes=0&view=FitH`}
        title={`Vorschau: ${title}`}
        onLoad={() => setLoaded(true)}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          border: 0,
          background: "white",
        }}
      />
    </div>
  );
}
