"use client";

/**
 * Leos Vergleichskarte im Strom: Kicker, Titel, die drei besten Angebote der
 * Voreinstellung mit ihrer Kennzahl, der Bestwert markiert, darunter der Weg zum ganzen
 * Vergleich. Die Daten kommen kompakt von /api/vergleich-daten/<slug>?kurz=1 (aus dem
 * Snapshot, CDN-gecacht) — die Karte reist als Insel in den Schnappschuss.
 */
import { useEffect, useState } from "react";
import { useFaden } from "@/components/faden/FadenProvider";
import type { CardRef } from "@/lib/ai/karten";

interface Kurz {
  slug: string; titel: string; klasse: "A" | "B"; anzahl: number; stand: string | null; href: string; hauptLabel: string;
  produkte: { id: number; anbieter: string; tarif: string; wert: string; best: boolean }[];
  grund: string | null;
}

function stand(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function LeoVergleichKarte({ karte }: { karte: CardRef }) {
  const { navigieren } = useFaden();
  const [kurz, setKurz] = useState<Kurz | null>(null);
  const [fehler, setFehler] = useState(false);

  useEffect(() => {
    let aktiv = true;
    fetch(`/api/vergleich-daten/${encodeURIComponent(karte.slug)}?kurz=1`)
      .then(async (r) => { if (!r.ok) throw new Error(String(r.status)); return (await r.json()) as Kurz; })
      .then((k) => { if (aktiv) setKurz(k); })
      .catch(() => { if (aktiv) setFehler(true); });
    return () => { aktiv = false; };
  }, [karte.slug]);

  const mehrzahl = kurz?.klasse === "B" ? "Tarife" : "Angebote";
  return (
    <aside className="leo-karte" aria-label={`Vergleich: ${karte.titel}`}>
      <span className="kicker kicker--tool"><i className="dot dot--vergleich" aria-hidden="true" />Anzeige · Vergleich mit Partnerlinks</span>
      <a className="leo-karte__titel" href={karte.href} onClick={(e) => { e.preventDefault(); navigieren(karte.href); }}>{karte.titel}</a>
      <span className="leo-karte__grund">Leo: {karte.reason}.</span>
      {kurz && kurz.produkte.length > 0 && (
        <ol className="leo-karte__liste">
          {kurz.produkte.map((p) => (
            <li key={p.id} className={p.best ? "leo-karte__zeile leo-karte__zeile--best" : "leo-karte__zeile"}>
              <span className="leo-karte__name"><b>{p.anbieter}</b> <span>{p.tarif}</span></span>
              {p.wert && p.wert !== "–" && <span className="leo-karte__wert">{p.wert}</span>}
            </li>
          ))}
        </ol>
      )}
      {!kurz && !fehler && <span className="leo-karte__laedt">Angebote werden geladen …</span>}
      <a className="pfeil-link" href={karte.href} onClick={(e) => { e.preventDefault(); navigieren(karte.href); }}>
        {kurz ? `Alle ${kurz.anzahl} ${mehrzahl} nebeneinander` : "Zum Vergleich"}<i />
      </a>
      {kurz?.stand && <span className="leo-karte__stand">{kurz.hauptLabel ? `${kurz.hauptLabel} · ` : ""}Stand {stand(kurz.stand)}{kurz.grund ? ` · Bestwert: ${kurz.grund}` : ""}</span>}
    </aside>
  );
}
