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
import type { FadenFrage, FadenStatistik } from "@/lib/types";
import type { InselTyp } from "./Insel";

const RechnerEmbed = dynamic(() => import("@/components/rechner/RechnerEmbed"));
const ChecklisteEmbed = dynamic(() => import("@/components/checkliste/ChecklisteEmbed"));
const VergleichEmbed = dynamic(() => import("@/components/vergleich/VergleichEmbed"));
const DokumenteEmbed = dynamic(() => import("@/components/dokumente/DokumenteEmbed"));
const StatistikKarte = dynamic(() => import("@/components/statistik/StatistikKarte"));
const Weiterlesen = dynamic(() => import("./Weiterlesen"));

interface Gefunden { el: HTMLElement; typ: InselTyp; arg: string; werte: unknown }

function Koerper({ typ, arg, werte }: { typ: InselTyp; arg: string; werte: unknown }) {
  if (typ === "rechner") return <RechnerEmbed slug={arg} noVisual />;
  if (typ === "checkliste") return <ChecklisteEmbed slug={arg} noVisual />;
  if (typ === "vergleich") return <VergleichEmbed slug={arg} />;
  if (typ === "dokumente") return <DokumenteEmbed slugs={arg.split(",").filter(Boolean)} />;
  if (typ === "statistik") return werte ? <StatistikKarte st={werte as FadenStatistik} /> : null;
  if (typ === "weiterlesen") return werte ? <Weiterlesen fragen={werte as FadenFrage[]} /> : null;
  return null;
}

export default function InselnBeleben({ wurzel }: { wurzel: HTMLElement | null }) {
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
  }, [wurzel]);

  return <>{inseln.map((i, n) => createPortal(<Koerper typ={i.typ} arg={i.arg} werte={i.werte} />, i.el, `insel-${n}`))}</>;
}
