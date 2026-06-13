"use client";

import { useEffect, useState } from "react";
import DokumentPreview from "@/components/dokument/DokumentPreview";

interface DokumentCard {
  slug: string;
  title: string;
  beschreibung: string;
  pdfUrl: string;
  fileName?: string;
  fileSize?: number | string;
  kategorie?: string;
}

interface Props {
  slugs: string[];
  headingId: string;
}

export default function DokumenteEmbed({ slugs, headingId }: Props) {
  const [dokumente, setDokumente] = useState<DokumentCard[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (slugs.length === 0) return;
    fetch(`/api/dokumente/${encodeURIComponent(slugs.join(","))}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.dokumente)) setDokumente(data.dokumente);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [slugs]);

  // Nichts rendern, wenn (nach dem Laden) keine gültigen Dokumente gefunden wurden.
  if (loaded && dokumente.length === 0) return null;

  const count = dokumente.length || slugs.length;

  return (
    <div className="dokumente-embed">
      <h2 id={headingId} className="article-tool-label">
        <span className="article-tool-badge article-tool-badge--dokumente">Dokumente</span>
      </h2>

      <div className="dokumente-grid" data-count={count}>
        {dokumente.map((dok) => (
          <article key={dok.slug} className="dok-card">
            <h3 className="dok-card-title">{dok.title}</h3>
            <div className="dok-card-sheet">
              <DokumentPreview slug={dok.slug} pdfUrl={dok.pdfUrl} title={dok.title} />
              <div className="dok-card-overlay">
                {dok.beschreibung && <p className="dok-card-desc">{dok.beschreibung}</p>}
                {dok.pdfUrl && (
                  <div className="dok-card-actions">
                    <a
                      href={`/api/dokument-pdf/${encodeURIComponent(dok.slug)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rechner-button dok-card-btn"
                    >
                      Vorschau
                    </a>
                    <a
                      href={dok.pdfUrl}
                      download={dok.fileName}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rechner-button dok-card-btn dok-card-btn--download"
                    >
                      Download
                    </a>
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
