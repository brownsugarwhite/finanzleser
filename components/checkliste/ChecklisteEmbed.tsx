"use client";

import RechnerPlaceholder from "@/components/ui/RechnerPlaceholder";
import ChecklisteInline from "./ChecklisteInline";

interface ChecklisteEmbedProps {
  slug: string;
  formHeader?: React.ReactNode;
}

export default function ChecklisteEmbed({ slug, formHeader }: ChecklisteEmbedProps) {
  return (
    <div className="checkliste-layout">
      <div className="checkliste-form-col">
        {formHeader && <div className="checkliste-form-header">{formHeader}</div>}
        <ChecklisteInline slug={slug} />
      </div>
      <div className="checkliste-visual-col">
        <div className="checkliste-visual">
          <RechnerPlaceholder />
        </div>
      </div>
    </div>
  );
}
