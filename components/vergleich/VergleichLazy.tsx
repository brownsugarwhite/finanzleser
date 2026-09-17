"use client";

/**
 * Der Vergleich in einem Artikel der ALTEN Seite: lazy, wie VergleichEmbed es immer war —
 * erst wenn der Block in Sichtweite rollt, holt er /api/vergleich-data/<slug> und rendert
 * je nach Antwort den eigenen Rechner (financeads) oder das Fremd-Embed.
 */
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { DefLite, VergleichDaten, VergleichQuelle } from "@/lib/financeads/typen";

const VergleichRechner = dynamic(() => import("./VergleichRechner"));
const VergleichEmbed = dynamic(() => import("./VergleichEmbed"));

type Antwort =
  | { art: "financeads"; slug: string; def: DefLite; quelle: VergleichQuelle; daten: VergleichDaten | null; defekt?: boolean }
  | { art: "embed" }
  | { art: "fehler" };

export default function VergleichLazy({ slug }: { slug: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [antwort, setAntwort] = useState<Antwort | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      fetch(`/api/vergleich-data/${encodeURIComponent(slug)}`)
        .then(async (r) => { if (!r.ok) throw new Error(String(r.status)); return (await r.json()) as Antwort & Record<string, unknown>; })
        .then((j) => setAntwort(j.art === "financeads" ? j : { art: "embed" }))
        .catch(() => setAntwort({ art: "fehler" }));
    }, { rootMargin: "300px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [slug]);

  return (
    <div ref={ref} className="vergleich-lazy">
      {!antwort && <div className="vgl__wartend vgl--alt"><p>Vergleich wird geladen …</p></div>}
      {antwort?.art === "embed" && <VergleichEmbed slug={slug} />}
      {antwort?.art === "fehler" && <div className="vgl__wartend vgl--alt"><p>Der Vergleich konnte nicht geladen werden.</p></div>}
      {antwort?.art === "financeads" && (antwort.daten && !antwort.defekt
        ? <VergleichRechner slug={slug} def={antwort.def} quelle={antwort.quelle} daten={antwort.daten} skin="alt" />
        : <div className="vgl__wartend vgl--alt"><p><strong>Dieser Vergleich wird gerade überarbeitet.</strong> Die Angebote stehen vorübergehend nicht zur Verfügung.</p></div>)}
    </div>
  );
}
