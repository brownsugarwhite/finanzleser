/**
 * Die Begriffe eines Kapitels als JSON im HTML: Klickmenü und Sitzungsleiste lesen sie
 * ohne weitere Anfrage (Sperrkontext für die Verlinkung: <script>).
 */
import type { BegriffDaten } from "@/lib/faden/glossar";

export default function GlossarDaten({ daten }: { daten: BegriffDaten[] }) {
  if (!daten.length) return null;
  return <script type="application/json" data-glossar-daten="" dangerouslySetInnerHTML={{ __html: JSON.stringify(daten).replace(/</g, "\\u003c") }} />;
}
