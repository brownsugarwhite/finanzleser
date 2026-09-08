/** Server-Hülle für die Meldung im Kapitel „Heute“: lädt das heutige Finanzwort und seine Nummer. */
import { spielAm, spielNummer } from "@/lib/faden/spiele";
import FinanzwortMeldung from "./FinanzwortMeldung";

export default async function FinanzwortHeute() {
  const spiel = await spielAm("finanzwort");
  if (!spiel) return null;
  return <FinanzwortMeldung slug={spiel.slug} nr={await spielNummer(spiel)} />;
}
