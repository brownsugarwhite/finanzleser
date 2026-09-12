/**
 * Finanzleser Plus · Mein Bereich (Stufe 1 ohne Anmeldung): Level, Punkte, Serie,
 * Wappen-Album, Aktenkoffer- und Wächter-Stand aus diesem Browser. Nur mit NEXT_PUBLIC_FADEN=1.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FADEN_AKTIV } from "@/lib/faden/flag";
import { getFadenOptionen } from "@/lib/faden/optionen";
import { SITE_NAME } from "@/lib/seo";
import KartenKapitel from "@/components/faden/KartenKapitel";
import MeinBereich from "@/components/faden/karten/MeinBereich";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: `Mein Bereich – Finanzleser Plus – ${SITE_NAME}`,
  description: "Punkte, Serie, Wappen, Aktenkoffer und Wächter: Ihr Bereich bei finanzleser.de.",
  robots: { index: false, follow: true },
};

export default async function PlusSeite() {
  if (!FADEN_AKTIV) notFound();
  const { waechterRegeln } = await getFadenOptionen();
  return (
    <KartenKapitel schluessel="plus" titel="Mein Bereich" kicker="Finanzleser Plus · kostenlos, ohne Passwort" beschreibung="Was Sie hier sehen, liegt in diesem Browser: Punkte und Serie aus den Spielen, Ihre Wappen, der Aktenkoffer und die Wächter. Mit Finanzleser Plus wandert alles auf Ihre Geräte." krumen={[{ name: "Finanzleser Plus", href: "/plus" }, { name: "Mein Bereich", href: "/plus" }]} url="/plus">
      <MeinBereich regeln={waechterRegeln} />
    </KartenKapitel>
  );
}
