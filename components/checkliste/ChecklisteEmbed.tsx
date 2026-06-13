"use client";

import { useState, useCallback } from "react";
import RechnerPlaceholder from "@/components/ui/RechnerPlaceholder";
import ChecklisteInline from "./ChecklisteInline";
import { ChecklisteLayoutContext } from "./ChecklisteLayoutContext";

interface ChecklisteEmbedProps {
  slug: string;
  formHeader?: React.ReactNode;
  /** Im Artikel: ohne Visual-Spalte, Liste volle Breite (Body-Breite). */
  noVisual?: boolean;
}

export default function ChecklisteEmbed({ slug, formHeader, noVisual = false }: ChecklisteEmbedProps) {
  const [actionsContainer, setActionsContainer] = useState<HTMLElement | null>(null);

  const containerRefCallback = useCallback((node: HTMLDivElement | null) => {
    setActionsContainer(node);
  }, []);

  return (
    <ChecklisteLayoutContext.Provider value={{ actionsContainer }}>
      <div className={`checkliste-layout${noVisual ? " checkliste-layout--no-visual" : ""}`}>
        <div className="checkliste-form-col">
          {formHeader && <div className="checkliste-form-header">{formHeader}</div>}
          <ChecklisteInline slug={slug} />
          {/* Ohne Visual: Aktions-Portal (PDF-Download) inline unter der Liste. */}
          {noVisual && (
            <div
              className="checkliste-actions-portal checkliste-actions-portal--inline"
              ref={containerRefCallback}
              style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}
            />
          )}
        </div>
        {!noVisual && (
          <div className="checkliste-visual-col">
            <div className="checkliste-visual">
              <RechnerPlaceholder seed={slug} image="/assets/general/checklisten_visual.png">
                <div className="checkliste-actions-portal" ref={containerRefCallback} style={{ display: "flex", justifyContent: "flex-end", padding: "12px 16px" }} />
              </RechnerPlaceholder>
            </div>
          </div>
        )}
      </div>
    </ChecklisteLayoutContext.Provider>
  );
}
