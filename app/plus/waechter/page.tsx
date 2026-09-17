/** Der Wächter: Wecker auf Zahlen und Fristen (Regeln aus dem CMS, Schalter in diesem Browser). Nur mit NEXT_PUBLIC_FADEN=1. */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FADEN_AKTIV } from "@/lib/faden/flag";
import { getFadenOptionen } from "@/lib/faden/optionen";
import { SITE_NAME } from "@/lib/seo";
import KartenKapitel from "@/components/faden/KartenKapitel";
import WaechterKarte from "@/components/faden/karten/WaechterKarte";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: `Der Wächter – Wecker auf Zahlen und Fristen – ${SITE_NAME}`,
  description: "Leo meldet sich, wenn sich ein Wert ändert oder eine Frist naht: Kfz-Wechsel, Düsseldorfer Tabelle, Grundfreibetrag, Beitragsbemessungsgrenze.",
  robots: { index: false, follow: true },
};

export default async function WaechterSeite() {
  if (!FADEN_AKTIV) notFound();
  const { waechterRegeln } = await getFadenOptionen();
  return (
    <KartenKapitel schluessel="plus:waechter" titel="Wecker auf Zahlen und Fristen" kicker="Der Wächter" beschreibung="Jede Regel ist ein Wecker: einzeln abschaltbar, keine Nachricht ohne Anlass. Die Schalter merkt sich dieser Browser; die Nachrichten selbst kommen mit Finanzleser Plus." krumen={[{ name: "Finanzleser Plus", href: "/plus" }, { name: "Wächter", href: "/plus/waechter" }]} url="/plus/waechter">
      <div className="kasten kasten--lila" id="kasten-waechter">
        <span className="kicker kicker--tool kicker--gruen"><i className="dot dot--checkliste" />Der Wächter</span>
        <h3>{waechterRegeln.length} Regeln, die die Redaktion pflegt</h3>
        <WaechterKarte regeln={waechterRegeln} />
      </div>
    </KartenKapitel>
  );
}
