"use client";

/**
 * Aktenkoffer in der rechten Randspalte: Zahl der abgelegten Sachen und der Weg dorthin.
 * Vorlage ist die Randspalte der Übergabe — dort steht der Koffer unter dem Glossar.
 *
 * Kein Kasten: eine Trennlinie darüber und darunter, sonst nichts (siehe `.rand .block`).
 */
import { useFaden } from "./FadenProvider";

export default function KofferRail() {
  const { koffer, navigieren } = useFaden();
  return (
    <div className="block koffer-rail">
      <span className="kicker">Aktenkoffer</span>
      <b className="koffer-rail__zahl">{koffer.length}</b>
      <span className="koffer-rail__text">Rechnungen und Ratgeber, die Sie behalten wollen.</span>
      <button type="button" className="pfeil-link" onClick={() => navigieren("/plus/aktenkoffer")}>Zum Koffer<i /></button>
    </div>
  );
}
