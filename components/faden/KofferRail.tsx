"use client";

/**
 * Die Aktenkoffer-Karte in der rechten Randspalte.
 *
 * Vorlage Zeile 1454–1458. Werte aus dem Quelltext gelesen:
 *
 *   Knopf      `border-top: 1px` Tinte, Innenabstand 12/0/6, beim Zeigen 4 px eingerückt
 *   Kicker     700 10.5px Open Sans gesperrt, grau
 *   Zahl       900 28px/1 Merriweather in Tinte, rechtsbündig — poppt beim Zuwachs
 *   Text       400 12.5px/1.5 Open Sans, grau
 *   Weg        500 12.5px Open Sans in Green-dark mit 16-px-Strich
 *
 * Die Karte fehlte bisher ganz.
 */
import { useEffect, useRef } from "react";
import { useFaden } from "./FadenProvider";

export default function KofferRail() {
  const { koffer, navigieren } = useFaden();
  const zahl = useRef<HTMLElement>(null);
  const vorher = useRef(koffer.length);

  // Die Zahl poppt, wenn etwas dazukommt — nicht beim ersten Rendern.
  useEffect(() => {
    if (koffer.length > vorher.current && zahl.current) {
      const el = zahl.current;
      el.classList.remove("popt");
      void el.offsetWidth; // Neustart erzwingen
      el.classList.add("popt");
    }
    vorher.current = koffer.length;
  }, [koffer.length]);

  return (
    <button type="button" className="koffer-rail" onClick={() => navigieren("/plus/aktenkoffer")}>
      <span className="koffer-rail__zeile">
        <span className="kicker">Aktenkoffer</span>
        <b ref={zahl} className="koffer-rail__zahl">{koffer.length}</b>
      </span>
      <span className="koffer-rail__text">
        {koffer.length ? "Rechnungen und Ratgeber, die Sie behalten wollen." : "Noch leer. Legen Sie ab, was Sie behalten wollen."}
      </span>
      <span className="koffer-rail__weg">Zum Koffer<i /></span>
    </button>
  );
}
