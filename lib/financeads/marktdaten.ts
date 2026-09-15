/**
 * Marktdaten, die kein Partner liefert und die trotzdem in einer Kennzahl stehen.
 *
 * 🚨 Der Wert steht als einzige Wahrheit in `config/rates.json` unter `marktdaten` und
 * wird hier gespiegelt — dasselbe Muster wie lib/calculators/rates.ts. Bewusst KEIN Fetch:
 * `useRates` lädt erst im Browser, die Kennzahl stünde dann beim Ausliefern noch falsch
 * da und spränge nach der Hydration. Und ein Fetch mit eigenem `revalidate` zöge die
 * ganze Route auf sein Minimum (Regel 11 in CLAUDE.md).
 */
import rates from "@/config/rates.json";

/** Verbraucherpreisindex, Jahresrate. Quelle und Stand stehen in config/rates.json. */
export const INFLATION_PA: number =
  (rates as { marktdaten?: { inflation_prozent_pa?: number } }).marktdaten?.inflation_prozent_pa ?? 2.1;
