/**
 * Der Server-Dispatcher für einen Vergleich: Slug → Körper.
 *
 *   financeads mit Snapshot   → eigener Rechner (SSR) in einer Insel mit allen Werten
 *   financeads ohne Snapshot  → Hinweis (Refresh noch nicht gelaufen / Endpunkt defekt)
 *   Fremd-Embed               → VergleichEmbed wie bisher (Zwei-Klick-Consent)
 *   unbekannt                 → null (der Aufrufer entscheidet, notFound oder leer)
 *
 * Die Insel trägt Definition, Quelle und Daten als JSON, damit InselnBeleben ein
 * eingefrorenes Kapitel ohne Refetch wiederbelebt.
 */
import { holeVergleich } from "@/lib/financeads/holeVergleich";
import { defLite } from "@/lib/financeads/registry";
import { kennwertSpalte, zinskurve } from "@/lib/financeads/kursblatt";
import Insel from "@/components/faden/kette/Insel";
import VergleichEmbed from "@/components/vergleich/VergleichEmbed";
import VergleichRechner from "@/components/vergleich/VergleichRechner";
import KursblattVergleich from "@/components/kursblatt/vergleich/KursblattVergleich";
import { KURSBLATT_AKTIV } from "@/lib/faden/flag";

export default async function VergleichKoerper({ slug, skin, mitSaeulen, beschreibung }: { slug: string; skin: "faden" | "alt"; mitSaeulen?: boolean; beschreibung?: string }) {
  const v = await holeVergleich(slug);
  if (!v) return null;
  if (v.art === "embed") {
    return <Insel typ="vergleich" arg={slug}><VergleichEmbed slug={slug} /></Insel>;
  }
  const def = defLite(v.def);
  if (v.def.defekt) {
    return (
      <div className={`vgl vgl--${skin} vgl__wartend`}>
        <p><strong>Dieser Vergleich wird gerade überarbeitet.</strong> Die Angebote unseres Partners für {def.titel} stehen vorübergehend nicht zur Verfügung. Sobald die Daten wieder fließen, erscheint die Liste hier automatisch.</p>
      </div>
    );
  }
  if (!v.daten || !v.daten.varianten.length) {
    return (
      <div className={`vgl vgl--${skin} vgl__wartend`}>
        <p><strong>Die Angebote werden gerade geladen.</strong> Der Vergleich {def.titel} bezieht seine Daten zweimal täglich von unserem Partner; der erste Stand liegt noch nicht vor.</p>
      </div>
    );
  }
  // Der Kursblatt-Satz ersetzt den Faden-Skin; die alte Seite behält ihre Liste.
  const kursblatt = KURSBLATT_AKTIV && skin === "faden";
  // Die Zinskurve muss HIER entstehen: sie braucht alle Laufzeit-Varianten, und genau die
  // fallen in der nächsten Zeile weg. Rund 400 Byte statt sieben Produktlisten.
  const kennwert = kursblatt && def.kursblatt?.band === "kurve" ? kennwertSpalte(def) : undefined;
  const kurve = kennwert ? zinskurve(def, v.daten.varianten, kennwert.key, def.kursblatt?.ohne) : null;
  // 🚨 Nur die Voreinstellung reist ins HTML und in die Insel (SSR, Schnappschuss,
  // sessionStorage). Ein Snapshot mit allen Preset-Varianten wiegt bis 160 KB; die
  // anderen Kombinationen holt der Client von /api/vergleich-daten (aus dem Snapshot).
  const daten = { ...v.daten, varianten: v.daten.varianten.slice(0, 1), ...(kurve ? { kurve } : {}) };
  const werte = { def, quelle: v.quelle, daten, skin, mitSaeulen: !!mitSaeulen, kursblatt, beschreibung };
  return (
    <Insel typ="vergleich" arg={slug} werte={werte}>
      {kursblatt
        ? <KursblattVergleich slug={slug} def={def} quelle={v.quelle} daten={daten} beschreibung={beschreibung} />
        : <VergleichRechner slug={slug} def={def} quelle={v.quelle} daten={daten} skin={skin} mitSaeulen={mitSaeulen} />}
    </Insel>
  );
}
