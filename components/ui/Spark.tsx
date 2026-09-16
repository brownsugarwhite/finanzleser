/**
 * Der Spark — das Zeichen der Marke.
 *
 * Der Pfad steht als Konstante daneben, weil ihn auch das Register des Kursblatts
 * braucht (components/kursblatt/eingabe/Register.tsx): dort ist er 14 px groß und
 * wechselt beim Aufklappen die Farbe, was `fill="currentColor"` verlangt. Ein zweites
 * Mal abgetippt wäre er über kurz oder lang ein zweiter Pfad.
 */
export const SPARK_PFAD =
  "M12 6.00047C10.3384 5.64978 8.28716 5.41362 7.24241 3.91374C6.47491 2.81169 6.27276 1.28871 6.00024 0.000471365C5.61861 1.71435 5.40087 3.79684 3.79407 4.83384C2.69548 5.54325 1.25351 5.72142 0 6.01226C1.28705 6.29225 2.79561 6.48692 3.89751 7.25194C5.4174 8.30686 5.61672 10.3366 6.00024 12.0005C6.17594 11.1204 6.33322 10.2272 6.62463 9.37638C7.27878 7.46453 8.37832 6.85223 10.2643 6.37379L12 6.00047Z";

export default function Spark() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12.0005" fill="none" aria-hidden style={{ pointerEvents: "none", display: "block", flexShrink: 0 }}>
      <path d={SPARK_PFAD} fill="var(--fill-0, #334A27)" />
    </svg>
  );
}
