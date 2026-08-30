"use client";

import { useState, useEffect } from "react";
import type { BeitragPdf } from "@/lib/articleToolData";

interface PdfPreviewProps {
  slug: string;
  /**
   * Serverseitig vorgeladen (ISR). `null` = geprüft, kein PDF vorhanden.
   * `undefined` = nicht vorgeladen → Client-Fallback auf /api/beitrag-pdf.
   */
  initialData?: BeitragPdf | null;
}

export default function PdfPreview({ slug, initialData }: PdfPreviewProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(initialData?.pdfUrl ?? null);
  const [pdfTitle, setPdfTitle] = useState<string>(initialData?.pdfTitle ?? "");

  useEffect(() => {
    // Vorgeladen (inkl. „kein PDF" = null) → kein Client-Roundtrip. Ohne diesen Guard
    // feuerte /api/beitrag-pdf auf JEDEM der 202 Artikel-Views, auch ohne PDF.
    if (initialData !== undefined) return;

    fetch(`/api/beitrag-pdf/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.pdfUrl) {
          setPdfUrl(data.pdfUrl);
          setPdfTitle(data.pdfTitle || "PDF-Dokument");
        }
      })
      .catch(() => {});
  }, [slug, initialData]);

  if (!pdfUrl) return null;

  return (
    <div className="pdf-preview">
      <div className="pdf-preview-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        <span className="pdf-preview-title">{pdfTitle}</span>
        <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="pdf-preview-download">
          PDF herunterladen
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </a>
      </div>
      <div className="pdf-preview-embed">
        <iframe
          src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
          title={pdfTitle}
        />
      </div>
    </div>
  );
}
