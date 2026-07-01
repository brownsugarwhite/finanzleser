"use client";

import { useEffect, useState } from "react";
import DokumentPreview from "@/components/dokument/DokumentPreview";
import DokumentDownload from "@/components/dokument/DokumentDownload";

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
  headingId?: string;
  /** Serverseitig vorgeladen (ISR) → kein Client-Fetch. */
  initialDokumente?: DokumentCard[] | null;
}

export default function DokumenteEmbed({ slugs, initialDokumente }: Props) {
  const [dokumente, setDokumente] = useState<DokumentCard[]>(initialDokumente ?? []);
  const [loaded, setLoaded] = useState(!!initialDokumente);

  useEffect(() => {
    if (initialDokumente) return; // bereits serverseitig geladen
    if (slugs.length === 0) return;
    fetch(`/api/dokumente/${encodeURIComponent(slugs.join(","))}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.dokumente)) setDokumente(data.dokumente);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [slugs, initialDokumente]);

  // Nichts rendern, wenn (nach dem Laden) keine gültigen Dokumente gefunden wurden.
  if (loaded && dokumente.length === 0) return null;

  const count = dokumente.length || slugs.length;
  // 1–2 Dokumente: Text neben der Vorschau. 3+: Text unter der Vorschau.
  const layout = count <= 2 ? "row" : "grid";

  return (
    <div className="dokumente-embed" data-count={count} data-layout={layout}>
      {dokumente.map((dok) => (
        <article key={dok.slug} className="dok-card">
          {/* Rahmen (2px) + innere Eck-Winkel nur um das Dokument selbst */}
          <div className="dok-card-frame">
            <div className="dok-card-sheet">
              <DokumentPreview slug={dok.slug} pdfUrl={dok.pdfUrl} title={dok.title} />
            </div>
          </div>
          {/* Textblock (Titel/Beschreibung/Button) — auf Mobile via display:contents
              aufgelöst, damit der Titel über das Dokument rückt. */}
          <div className="dok-card-body">
            <h3 className="dok-card-title">{dok.title}</h3>
            {dok.beschreibung && <p className="dok-card-desc">{dok.beschreibung}</p>}
            {dok.pdfUrl && (
              <div className="dok-card-download">
                <DokumentDownload
                  pdfUrl={dok.pdfUrl}
                  fileName={dok.fileName}
                  fileSize={dok.fileSize}
                  label="Herunterladen"
                />
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
