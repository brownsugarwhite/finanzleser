"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  /** Slug des Dokuments — geladen über Same-Origin-Proxy /api/dokument-pdf/[slug] */
  slug: string;
  /** Optional: Original-PDF-URL nur für Fallback-Check (leer = "Keine Vorschau") */
  pdfUrl?: string;
  title: string;
};

export default function DokumentPreview({ slug, pdfUrl, title }: Props) {
  const proxyUrl = `/api/dokument-pdf/${encodeURIComponent(slug)}`;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    if (!pdfUrl) {
      setStatus("error");
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";

        const doc = await pdfjs.getDocument({ url: proxyUrl }).promise;
        if (cancelled) return;
        const page = await doc.getPage(1);
        if (cancelled) return;

        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        // Render-Skalierung an Container-Breite anpassen (DPR-aware)
        const baseViewport = page.getViewport({ scale: 1 });
        const cssWidth = container.clientWidth || 600;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const scale = (cssWidth * dpr) / baseViewport.width;
        const viewport = page.getViewport({ scale });

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = "100%";
        canvas.style.height = "auto";

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        await page.render({ canvasContext: ctx, viewport }).promise;
        if (cancelled) return;

        setStatus("ready");
      } catch (err) {
        console.error("PDF-Vorschau Fehler:", err);
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pdfUrl, proxyUrl]);

  if (!pdfUrl) {
    return (
      <div
        className="dokument-preview dokument-preview--empty"
        style={{
          width: "100%",
          aspectRatio: "210 / 297",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
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
      ref={containerRef}
      className="dokument-preview"
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "210 / 297",
        overflow: "hidden",
        background: "white",
      }}
      aria-label={`Vorschau: ${title}`}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "auto",
        }}
      />
      {status !== "ready" && (
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
            background: "var(--color-placeholder-bg)",
          }}
        >
          {status === "error" ? "Vorschau nicht verfügbar" : "Vorschau wird geladen …"}
        </div>
      )}
    </div>
  );
}
