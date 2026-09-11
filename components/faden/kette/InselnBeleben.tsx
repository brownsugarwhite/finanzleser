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
import type { SpaltenRubrik } from "@/lib/faden/spalten";

interface AktionenWerte { titel: string; url: string; kurzfassung?: FadenKurzfassung; artikelId: string; pdf?: BeitragPdf | null }
import type { InselTyp } from "./Insel";
import type { Statistik as StatistikDaten } from "@/lib/statistik/schema";

const RechnerEmbed = dynamic(() => import("@/components/rechner/RechnerEmbed"));
const ChecklisteEmbed = dynamic(() => import("@/components/checkliste/ChecklisteEmbed"));
const VergleichEmbed = dynamic(() => import("@/components/vergleich/VergleichEmbed"));
const DokumenteEmbed = dynamic(() => import("@/components/dokumente/DokumenteEmbed"));
const StatistikKarte = dynamic(() => import("@/components/statistik/StatistikKarte"));
const Statistik = dynamic(() => import("@/components/statistik/Statistik"));
const Weiterlesen = dynamic(() => import("./Weiterlesen"));
const Aktionen = dynamic(() => import("./Aktionen"));
const AbschnittTeilen = dynamic(() => import("./AbschnittTeilen"));
const KastenFuss = dynamic(() => import("./KastenFuss"));
const WochenbriefForm = dynamic(() => import("@/components/faden/WochenbriefForm"));
const FadenSpiel = dynamic(() => import("@/components/faden/spiele/FadenSpiel"));
const Spalten = dynamic(() => import("@/components/faden/spalten/Spalten"));
const Schlange = dynamic(() => import("@/components/faden/spiele/Schlange"));
const Vorlesen = dynamic(() => import("@/components/faden/Vorlesen"));

interface Gefunden { el: HTMLElement; typ: InselTyp; arg: string; werte: unknown }

function Koerper({ typ, arg, werte }: { typ: InselTyp; arg: string; werte: unknown }) {
  if (typ === "rechner") return <RechnerEmbed slug={arg} noVisual />;
  if (typ === "checkliste") return <ChecklisteEmbed slug={arg} noVisual />;
  if (typ === "vergleich") return <VergleichEmbed slug={arg} />;
  if (typ === "dokumente") return <DokumenteEmbed slugs={arg.split(",").filter(Boolean)} />;
  if (typ === "statistik") return werte ? <StatistikKarte st={werte as FadenStatistik} /> : null;
  if (typ === "statistik-block") return werte ? <Statistik st={werte as StatistikDaten} /> : null;
  if (typ === "weiterlesen") return werte ? <Weiterlesen fragen={werte as FadenFrage[]} /> : null;
  if (typ === "spiel") { const w = werte as { typ: string; felder: Record<string, string> } | undefined; return w ? <FadenSpiel typ={w.typ} felder={w.felder} /> : null; }
  if (typ === "aktionen") { const w = werte as AktionenWerte | undefined; return w ? <Aktionen titel={w.titel} url={w.url} kurzfassung={w.kurzfassung} artikelId={w.artikelId} pdf={w.pdf} /> : null; }
  if (typ === "abschnitt-teilen") { const w = werte as { titel: string; url: string; id: string } | undefined; return w ? <AbschnittTeilen titel={w.titel} url={w.url} id={w.id} /> : null; }
  if (typ === "kasten-fuss") { const w = werte as { titel: string; url: string; kastenId: string; eigeneSeite?: boolean } | undefined; return w ? <KastenFuss titel={w.titel} url={w.url} kastenId={w.kastenId} eigeneSeite={w.eigeneSeite} /> : null; }
  if (typ === "wochenbrief") return <WochenbriefForm />;
  if (typ === "spalten") return werte ? <Spalten rubriken={werte as SpaltenRubrik[]} /> : null;
  if (typ === "schlange") return <Schlange />;
  if (typ === "vorlesen") return arg ? <Vorlesen zielId={arg} /> : null;
  return null;
}

export default function InselnBeleben({ wurzel, stand, pause }: { wurzel: HTMLElement | null; stand?: string; pause?: boolean }) {
  const [inseln, setInseln] = useState<Gefunden[]>([]);

  useEffect(() => {
    if (!wurzel) { setInseln([]); return; }
    // 🚨 Solange eine Navigation läuft, keine NEUEN Portale: Sie rendern in Kästen, die
    // die gemessene Höhe nur als min-height tragen — wird der Inhalt höher, wächst das
    // eingefrorene Kapitel mitten im Sprung zum Skelett (gemessen +207 px) und das Ziel
    // rückt weg. Nach der Ankunft liegt das Kapitel über der Lesestelle, und der Ausgleich
    // (lib/faden/ausgleich.ts) fängt das Wachsen ab. Bestehende Portale bleiben stehen.
    if (pause) return;
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
  }, [wurzel, stand, pause]);

  return <>{inseln.map((i, n) => createPortal(<Koerper typ={i.typ} arg={i.arg} werte={i.werte} />, i.el, `insel-${n}`))}</>;
}
