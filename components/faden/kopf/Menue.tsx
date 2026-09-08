"use client";

/** Mobiles Menü (unter 900 px): Register, Verlauf, Glossar, Plus. */
import { useFaden } from "@/components/faden/FadenProvider";

export default function Menue({ offen, onZu, onRand }: { offen: boolean; onZu: () => void; onRand: (seite: "links" | "rechts") => void }) {
  const { blattOeffnen, toast } = useFaden();
  if (!offen) return null;
  const eintraege = [
    { key: "ratgeber" as const, label: "Ratgeber", small: "4 Rubriken" },
    { key: "finanztools" as const, label: "Finanztools", small: "Rechner · Vergleiche · Checklisten" },
    { key: "service" as const, label: "Service", small: "Anbieter · Dokumente · Glossar" },
  ];
  return (
    <div className="menue offen" aria-label="Menü" role="dialog">
      <div className="menue__kopf"><img src="/icons/fl_logo.svg" alt="finanzleser" /><button type="button" className="btn btn--klein btn--still" onClick={onZu}>Schließen ✕</button></div>
      {eintraege.map((e) => (
        <button key={e.key} type="button" className="zeile-m" onClick={() => { onZu(); window.scrollTo({ top: 0 }); blattOeffnen(e.key); }}>{e.label}<small>{e.small}</small></button>
      ))}
      <div className="klein">
        <button type="button" onClick={() => { onZu(); onRand("links"); }}><span>☰</span> Verlauf und Inhalt</button>
        <button type="button" onClick={() => { onZu(); onRand("rechts"); }}><span>✦</span> Glossar der Sitzung</button>
        <button type="button" onClick={() => { onZu(); toast("Finanzleser Plus kommt mit Stufe 3."); }}><span>●</span> Anmelden · Finanzleser Plus</button>
      </div>
    </div>
  );
}
