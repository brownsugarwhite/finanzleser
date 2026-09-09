"use client";

/**
 * Die Werkzeuge eines eingefrorenen Kapitels wieder zum Leben erwecken.
 *
 * Läuft nur in aufgeklappten Kapiteln aus dem Verlauf: sucht die von `Insel` gesetzten
 * Marker im Schnappschuss und rendert die echten Komponenten per Portal hinein. Weil der
 * Schnappschuss samt Markern in der Sitzung liegt, gilt das auch nach einem Neuladen.
 *
 * Die Körper kommen über next/dynamic — ein aufgeklapptes Kapitel ist die Ausnahme, sein
 * Code soll nicht im Bundle jeder Seite liegen.
 */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import type { FadenFrage, FadenKurzfassung, FadenStatistik } from "@/lib/types";
import type { BeitragPdf } from "@/lib/articleToolData";

interface AktionenWerte { titel: string; url: string; kurzfassung?: FadenKurzfassung; artikelId: string; pdf?: BeitragPdf | null }
import type { InselTyp } from "./Insel";

const RechnerEmbed = dynamic(() => import("@/components/rechner/RechnerEmbed"));
const ChecklisteEmbed = dynamic(() => import("@/components/checkliste/ChecklisteEmbed"));
const VergleichEmbed = dynamic(() => import("@/components/vergleich/VergleichEmbed"));
const DokumenteEmbed = dynamic(() => import("@/components/dokumente/DokumenteEmbed"));
const StatistikKarte = dynamic(() => import("@/components/statistik/StatistikKarte"));
const Weiterlesen = dynamic(() => import("./Weiterlesen"));
const Aktionen = dynamic(() => import("./Aktionen"));
const AbschnittTeilen = dynamic(() => import("./AbschnittTeilen"));
const KastenFuss = dynamic(() => import("./KastenFuss"));
const WochenbriefForm = dynamic(() => import("@/components/faden/WochenbriefForm"));
const GamificationEmbed = dynamic(() => import("@/components/gamification/GamificationEmbed"));

interface Gefunden { el: HTMLElement; typ: InselTyp; arg: string; werte: unknown }

function Koerper({ typ, arg, werte }: { typ: InselTyp; arg: string; werte: unknown }) {
  if (typ === "rechner") return <RechnerEmbed slug={arg} noVisual />;
  if (typ === "checkliste") return <ChecklisteEmbed slug={arg} noVisual />;
  if (typ === "vergleich") return <VergleichEmbed slug={arg} />;
  if (typ === "dokumente") return <DokumenteEmbed slugs={arg.split(",").filter(Boolean)} />;
  if (typ === "statistik") return werte ? <StatistikKarte st={werte as FadenStatistik} /> : null;
  if (typ === "weiterlesen") return werte ? <Weiterlesen fragen={werte as FadenFrage[]} /> : null;
  if (typ === "spiel") { const w = werte as { typ: string; felder: Record<string, string> } | undefined; return w ? <GamificationEmbed gamType={w.typ} fields={w.felder} /> : null; }
  if (typ === "aktionen") { const w = werte as AktionenWerte | undefined; return w ? <Aktionen titel={w.titel} url={w.url} kurzfassung={w.kurzfassung} artikelId={w.artikelId} pdf={w.pdf} /> : null; }
  if (typ === "abschnitt-teilen") { const w = werte as { titel: string; url: string; id: string } | undefined; return w ? <AbschnittTeilen titel={w.titel} url={w.url} id={w.id} /> : null; }
  if (typ === "kasten-fuss") { const w = werte as { titel: string; url: string; kastenId: string; eigeneSeite?: boolean } | undefined; return w ? <KastenFuss titel={w.titel} url={w.url} kastenId={w.kastenId} eigeneSeite={w.eigeneSeite} /> : null; }
  if (typ === "wochenbrief") return <WochenbriefForm />;
  return null;
}

export default function InselnBeleben({ wurzel, stand }: { wurzel: HTMLElement | null; stand?: string }) {
  const [inseln, setInseln] = useState<Gefunden[]>([]);

  useEffect(() => {
    if (!wurzel) { setInseln([]); return; }
    const gefunden: Gefunden[] = [];
    wurzel.querySelectorAll<HTMLElement>("[data-insel]").forEach((el) => {
      const typ = el.dataset.insel as InselTyp | undefined;
      if (!typ) return;
      let werte: unknown;
      const sc = el.querySelector("script[data-insel-werte]");
      if (sc) { try { werte = JSON.parse(sc.textContent || "null"); } catch { /* kaputt → ohne Werte */ } }
      gefunden.push({ el, typ, arg: el.dataset.inselArg || "", werte });
    });
    setInseln(gefunden);
    // `stand` hängt am Inhalt: wird das HTML neu gesetzt, sind die alten Knoten weg und
    // die Inseln müssen neu gesucht werden.
  }, [wurzel, stand]);

  return <>{inseln.map((i, n) => createPortal(<Koerper typ={i.typ} arg={i.arg} werte={i.werte} />, i.el, `insel-${n}`))}</>;
}
