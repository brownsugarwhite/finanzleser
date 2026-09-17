"use client";

/**
 * Der Zeiger — eine Quote als Ring, im Kursblatt-Satz.
 *
 * Ersetzt `components/rechner/ui/RechnerGauge.tsx` (13 Rechner). Dort ist es ein
 * GSAP-animierter Ring in Brand-Magenta; hier dieselbe Aussage in der Sprache des
 * Kursblatts: Haarlinie statt Kasten, der Bogen zeichnet sich wie die Zinskurve
 * (`fl-zeichnen`), die Zahl läuft im Zählwerk hoch.
 *
 * 🚨 Kein GSAP. Der Kursblatt-Rechner kommt ohne aus, und eine zweite Animationsmaschine
 * für einen Kreisbogen wäre Ballast — `stroke-dashoffset` kann das CSS selbst.
 */
import { useZaehlwerkKb } from "@/lib/kursblatt/useZaehlwerkKb";

export interface ZeigerProps {
  label: string;
  wert: number;
  max?: number;
  einheit?: string;
  /** Animationsname aus useLauf; „none" heißt: sofort fertig. */
  zeichnen: string;
  aktiv: boolean;
}

/* Maße der Vorlage (Handoff Runde 2, Punkt 6): Ring 150 px, Spur und Bogen 12 px,
   Radius 67, innen ein dünner Tinte-Kreis mit r 55. Der viewBox ist deshalb 150 und
   nicht mehr 120 — dann sind die Zahlen hier dieselben wie in der Übergabe. */
const R = 67;
const INNEN = 55;
const UMFANG = 2 * Math.PI * R;

export default function Zeiger({ label, wert, max = 100, einheit = " %", zeichnen, aktiv }: ZeigerProps) {
  const anteil = Math.min(1, Math.max(0, max ? wert / max : 0));
  const zahl = useZaehlwerkKb(aktiv ? wert : 0);

  return (
    <div className="kb-zeiger">
      <svg viewBox="0 0 150 150" className="kb-zeiger__bild" aria-hidden="true">
        {/* Innenkreis als Haarlinie — der Kasten des alten Satzes wird zur Linie. */}
        <circle cx="75" cy="75" r={INNEN} className="kb-zeiger__innen" />
        <circle cx="75" cy="75" r={R} className="kb-zeiger__spur" />
        <circle
          cx="75" cy="75" r={R}
          className="kb-zeiger__bogen"
          /* 🚨 Drehpunkt = Mittelpunkt. Beim Umstellen von viewBox 120 auf 150 blieb hier
             (60 60) stehen — der Bogen drehte sich um einen Punkt neben der Mitte und
             schob sich aus dem Ring heraus. */
          transform="rotate(-90 75 75)"
          strokeDasharray={UMFANG}
          style={{
            strokeDashoffset: UMFANG * (1 - anteil),
            // Ohne Animation steht der Bogen sofort; sonst zeichnet er sich von 0 auf.
            // Vorlage: 1,3 s mit .35 s Verzug — der Ring beginnt, wenn die Kacheln stehen.
            transition: zeichnen === "none" || !aktiv ? "none" : "stroke-dashoffset 1.3s ease-out .35s",
          }}
        />
      </svg>
      <div className="kb-zeiger__mitte">
        <b>{zahl.toLocaleString("de-DE", { maximumFractionDigits: 0 })}{einheit}</b>
        <span>{label}</span>
      </div>
    </div>
  );
}
