/** Aktenkoffer: was der Leser abgelegt hat (Stufe 1: dieser Browser). Nur mit NEXT_PUBLIC_FADEN=1. */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FADEN_AKTIV } from "@/lib/faden/flag";
import { SITE_NAME } from "@/lib/seo";
import KartenKapitel from "@/components/faden/KartenKapitel";
import AktenkofferKarte from "@/components/faden/karten/AktenkofferKarte";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: `Mein Aktenkoffer – Finanzleser Plus – ${SITE_NAME}`,
  description: "Ergebnisse, Checklisten, Vergleiche und Antworten, die Sie abgelegt haben.",
  robots: { index: false, follow: true },
};

export default function AktenkofferSeite() {
  if (!FADEN_AKTIV) notFound();
  return (
    <KartenKapitel schluessel="plus:aktenkoffer" titel="Was Sie erarbeitet haben" kicker="Mein Aktenkoffer" krumen={[{ name: "Finanzleser Plus", href: "/plus" }, { name: "Aktenkoffer", href: "/plus/aktenkoffer" }]} url="/plus/aktenkoffer">
      <div className="kasten kasten--lila" id="kasten-aktenkoffer">
        <span className="kicker kicker--tool kicker--gruen"><i className="dot dot--checkliste" />Mein Aktenkoffer</span>
        <h3>Ergebnisse · Checklisten · Vergleiche · Gespräche</h3>
        <AktenkofferKarte />
      </div>
    </KartenKapitel>
  );
}
