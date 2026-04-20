"use client";

import { useState, useCallback } from "react";
import RechnerPlaceholder from "@/components/ui/RechnerPlaceholder";
import ChecklisteInline from "./ChecklisteInline";
import { ChecklisteLayoutContext } from "./ChecklisteLayoutContext";

interface ChecklisteEmbedProps {
  slug: string;
  formHeader?: React.ReactNode;
}

export default function ChecklisteEmbed({ slug, formHeader }: ChecklisteEmbedProps) {
  const [actionsContainer, setActionsContainer] = useState<HTMLElement | null>(null);

  const containerRefCallback = useCallback((node: HTMLDivElement | null) => {
    setActionsContainer(node);
  }, []);

  return (
    <ChecklisteLayoutContext.Provider value={{ actionsContainer }}>
      <div className="checkliste-layout">
        <div className="checkliste-form-col">
          {formHeader && <div className="checkliste-form-header">{formHeader}</div>}
          <ChecklisteInline slug={slug} />
        </div>
        <div className="checkliste-visual-col">
          <div className="checkliste-visual">
            <RechnerPlaceholder seed={slug}>
              <div className="checkliste-actions-portal" ref={containerRefCallback} style={{ display: "flex", justifyContent: "flex-end", padding: "12px 16px" }} />
            </RechnerPlaceholder>
          </div>
        </div>
      </div>
    </ChecklisteLayoutContext.Provider>
  );
}
