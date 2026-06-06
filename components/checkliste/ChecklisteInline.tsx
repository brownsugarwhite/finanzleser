"use client";

import { useState, useEffect } from "react";
import type { ChecklisteData } from "./types";
import type { CheckboxPosition } from "@/lib/checklisteParser";
import InteraktiveCheckliste from "./InteraktiveCheckliste";
import { refreshScrollTriggers } from "@/lib/refreshScrollTriggers";

interface Props {
  slug: string;
}

export default function ChecklisteInline({ slug }: Props) {
  const [data, setData] = useState<ChecklisteData | null>(null);
  const [checkboxPositions, setCheckboxPositions] = useState<CheckboxPosition[]>([]);
  const [pdfUrl, setPdfUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/checkliste-data/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((json) => {
        setData(json.data);
        setCheckboxPositions(json.checkboxPositions);
        setPdfUrl(json.pdfUrl);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [slug]);

  // Nach dem Render der fertigen Checkliste hat sich die Dokumenthöhe geändert
  // → ScrollTrigger-Positionen (Logo-/Leo-Batch-Flip) neu vermessen.
  useEffect(() => {
    if (!loading && data) refreshScrollTriggers();
  }, [loading, data]);

  if (loading) {
    return (
      <div style={{ minHeight: 400, padding: 24, textAlign: "center", color: "var(--color-text-medium)" }}>
        Checkliste wird geladen...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "var(--color-text-medium)" }}>
        Checkliste konnte nicht geladen werden.
      </div>
    );
  }

  return (
    <InteraktiveCheckliste
      data={data}
      pdfUrl={pdfUrl}
      slug={slug}
      checkboxPositions={checkboxPositions}
    />
  );
}
