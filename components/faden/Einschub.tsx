/**
 * Anzeigenplatz (adblocker-neutral benannt, fiktive Marken aus dem Prototyp):
 * Beschriftung „Anzeige“ und eine Fläche im IAB-Format. Platzhalter für Stufe 4;
 * die Bilder liegen unter public/assets/einschub (aus docs/prototype/werbung.py).
 * Ein Klick auf die Fläche zeigt den Toast (EinschubKlick, Client-Hülle).
 */
import EinschubKlick from "./EinschubKlick";

export type EinschubFormat = "leaderboard" | "rectangle" | "halfpage" | "skyscraper" | "square" | "mobile";

const BILDER: Record<EinschubFormat, { name: string; w: number; h: number }[]> = {
  leaderboard: [{ name: "lb-kontora", w: 728, h: 90 }, { name: "lb-steuerfuchs", w: 728, h: 90 }],
  rectangle: [{ name: "mr-nordlicht", w: 300, h: 250 }, { name: "mr-pfotenschutz", w: 300, h: 250 }],
  halfpage: [{ name: "hp-nordlicht", w: 300, h: 600 }, { name: "hp-baufix", w: 300, h: 600 }],
  skyscraper: [{ name: "sk-kontora", w: 160, h: 600 }],
  square: [{ name: "sq-nordlicht", w: 200, h: 200 }, { name: "sq-steuerfuchs", w: 200, h: 200 }],
  mobile: [{ name: "mo-pfotenschutz", w: 320, h: 100 }, { name: "mo-steuerfuchs", w: 320, h: 100 }],
};

export default function Einschub({ format, variante, nr = 0 }: { format: EinschubFormat; variante?: "top" | "feed" | "artikel" | "umflossen"; nr?: number }) {
  const liste = BILDER[format];
  const bild = liste[nr % liste.length];
  const schmal = format === "leaderboard" ? BILDER.mobile[nr % BILDER.mobile.length] : null;
  return (
    <div className={"einschub" + (variante ? ` einschub--${variante}` : "")} data-format={format} aria-label="Anzeige (Beispiel)">
      <span className="einschub__label">Anzeige</span>
      <EinschubKlick>
        <img className="breit-bild" src={`/assets/einschub/${bild.name}.svg`} width={bild.w} height={bild.h} alt="Anzeige (Beispiel, fiktive Marke)" loading="lazy" />
        {schmal && <img className="schmal" src={`/assets/einschub/${schmal.name}.svg`} width={schmal.w} height={schmal.h} alt="Anzeige (Beispiel, fiktive Marke)" loading="lazy" />}
      </EinschubKlick>
    </div>
  );
}
