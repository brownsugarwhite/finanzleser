"use client";

/**
 * Stempel-Presets — „Schnell einstellen“ über den Eingaben des Rechners.
 *
 * Vorlage: „Finanzleser Vergleich & Rechner - Kursblatt.dc.html“:242-247 und :495.
 * Drei schief aufgesetzte Stempel; der aktive richtet sich gerade auf. Ein Klick spielt
 * `fl-stempelflach` — und zwar bei JEDEM Klick, auch auf denselben Stempel. Dafür
 * wechselt der Name zwischen den Zwillingen.
 */
import { useState } from "react";

export interface Preset<P> {
  id: string;
  label: string;
  sub: string;
  werte: P;
  /** Neigung im Ruhezustand (K:385-387: −3° / 2° / −1,5°). */
  neigung: string;
}

export default function StempelPresets<P extends Record<string, number | string>>({
  presets, aktiv, onWaehlen, label = "Schnell einstellen:",
}: {
  presets: Preset<P>[];
  /** id des Presets, dessen Werte gerade eingestellt sind. */
  aktiv: string | null;
  onWaehlen: (p: Preset<P>) => void;
  label?: string;
}) {
  const [geklickt, setGeklickt] = useState<{ id: string; lauf: number } | null>(null);

  return (
    <div className="kb-presets">
      <span className="kb-presets__label">{label}</span>
      {presets.map((p) => {
        const ist = aktiv === p.id;
        const schlag = geklickt?.id === p.id ? geklickt.lauf : 0;
        return (
          <button
            key={p.id}
            type="button"
            className="kb-presets__stempel"
            data-aktiv={ist ? "an" : "aus"}
            style={{
              "--kb-neigung": ist ? "0deg" : p.neigung,
              animation: schlag ? `fl-stempelflach${schlag % 2 ? "" : "2"} .6s var(--kb-kurve) both` : undefined,
            } as React.CSSProperties}
            onClick={() => { setGeklickt((g) => ({ id: p.id, lauf: (g?.id === p.id ? g.lauf : 0) + 1 })); onWaehlen(p); }}
          >
            <b>{p.label}</b>
            <span>{p.sub}</span>
          </button>
        );
      })}
    </div>
  );
}
