/**
 * Finanz-Kassensturz: acht Fragen, ein Ergebnis (Service · Kassensturz). Fragen, Lücken,
 * Profil und Score kommen aus den Faden-Optionen des CMS; die Ziele der Lückenkarten
 * (Ratgeber, Rechner, Vergleiche …) löst diese Server-Seite zu Adresse und Titel auf,
 * damit die Client-Komponente nur noch verlinkt. Nur mit NEXT_PUBLIC_FADEN=1.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FADEN_AKTIV } from "@/lib/faden/flag";
import { getFadenOptionen } from "@/lib/faden/optionen";
import { buildMetadata } from "@/lib/seo";
import KartenKapitel from "@/components/faden/KartenKapitel";
import Kassensturz from "@/components/faden/kassensturz/Kassensturz";
import { zieleAufloesen } from "@/lib/faden/kassensturzZiele";

export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Finanz-Kassensturz: 3 Minuten – finanzleser.de",
  description: "Acht Fragen, keine Tastatur, keine Anmeldung: Ihr Profil, Ihre Ampel und die drei größten Lücken, sofort und vollständig, mit passendem Ratgeber und Werkzeug.",
  path: "/kassensturz",
});

export default async function KassensturzSeite() {
  if (!FADEN_AKTIV) notFound();
  const { kassensturz } = await getFadenOptionen();
  if (!kassensturz || !Array.isArray(kassensturz.fragen) || !kassensturz.fragen.length) notFound();
  const ziele = await zieleAufloesen(kassensturz);
  return (
    <KartenKapitel
      schluessel="kassensturz"
      titel="Finanz-Kassensturz"
      kicker={`Service · ${kassensturz.untertitel || "3 Minuten · keine Anmeldung"}`}
      beschreibung="Acht Fragen, keine Tastatur. Am Ende sehen Sie Ihr Profil und Ihre drei größten Lücken, sofort und vollständig."
      krumen={[{ name: "Service", href: "/kassensturz" }, { name: "Kassensturz", href: "/kassensturz" }]}
      url="/kassensturz"
    >
      <Kassensturz daten={kassensturz} ziele={ziele} />
    </KartenKapitel>
  );
}
