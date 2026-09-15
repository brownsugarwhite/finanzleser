"use client";

/**
 * Die Säulen über der Tabelle: die Top 8 der aktuellen Sortierung als vertikale Säulen —
 * dieselbe Form wie die Statistiken im Faden (components/statistik/formen/Saeulen.tsx,
 * Design A v2). Die Skala steht fest auf dem größten Wert der ganzen Liste, damit sie beim
 * Sortieren oder Filtern nicht springt. Nur im Faden: das CSS der Form ist auf .faden-shell
 * gescoped.
 */
import type { StatSaeulen } from "@/lib/statistik/schema";
import type { SpalteDef, VergleichProdukt } from "@/lib/financeads/typen";
import Saeulen from "@/components/statistik/formen/Saeulen";

function kurz(name: string): string {
  return name.length > 14 ? name.slice(0, 13).trimEnd() + "…" : name;
}

export default function VergleichSaeulen({ zeilen, spalte, maximum, titel }: { zeilen: VergleichProdukt[]; spalte: SpalteDef; maximum: number; titel: string }) {
  const top = zeilen.filter((p) => typeof p.kennzahlen[spalte.key] === "number").slice(0, 8);
  if (top.length < 2) return null;
  // Ein Anbieter kann mehrere Tarife haben (Crédit Agricole, GEFA) — die Beschriftung
  // muss je Säule eindeutig sein, sonst kollidieren die React-Keys der Form.
  const gesehen = new Map<string, number>();
  const label = (p: (typeof top)[number]) => {
    const k = kurz(p.anbieter); const n = (gesehen.get(k) || 0) + 1; gesehen.set(k, n);
    return n > 1 ? `${k} ${n}` : k;
  };
  const st: StatSaeulen = {
    art: "saeulen",
    titel,
    einheit: spalte.art === "prozent" ? "%" : spalte.art === "geld" ? "€" : undefined,
    reihen: [{ label: spalte.label }],
    kategorien: top.map((p) => ({ label: label(p), werte: [Math.abs(p.kennzahlen[spalte.key] as number)] })),
    maximum: maximum > 0 ? maximum * 1.1 : undefined,
  };
  return (
    <div className="vgl__saeulen st st--saeulen st--rahmen-blank" data-stand="fertig">
      <div className="st__kopf"><span className="kicker">{titel}</span></div>
      <Saeulen st={st} />
    </div>
  );
}
