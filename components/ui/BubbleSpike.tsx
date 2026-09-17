/**
 * Schwanz einer Sprechblase — dieselbe Form wie in der KI-Section (AIAgentTeaser)
 * und im Leo-Chat.
 *
 * Zwei Ausführungen, die deckungsgleich übereinander liegen:
 *   ohne `kontur` — nur Füllung in `currentColor`. Liegt VOR der Blase und deckt
 *                   deren Umrisslinie dort ab, wo der Schwanz ansetzt.
 *   mit  `kontur` — Füllung plus Strich, `paint-order: stroke` legt den Strich
 *                   unter die Füllung, sodass nur seine äußere Hälfte stehen bleibt.
 *                   Liegt HINTER der Blase und setzt deren Umriss um den Schwanz fort.
 *                   Farben kommen aus dem CSS (`fill` / `stroke`), nicht aus dem Markup.
 *
 * 🚨 Zwei Kleinigkeiten halten die Spitze spitz — fehlt eine, wird sie stumpf:
 *   `strokeMiterlimit={6}` — an der Spitze treffen die Kurven in 23,5° aufeinander,
 *      das Miter-Verhältnis ist 4,91. Über der Standardgrenze 4 flacht jeder Renderer
 *      die Ecke zu einer Kante ab.
 *   `overflow: visible` — die ausgezogene Spitze ragt links aus dem viewBox heraus.
 *      Genau deshalb ist das hier ein eingebettetes SVG und keine Datei: ein <img>
 *      beschneidet immer an seiner Box, egal wie das SVG darin gebaut ist.
 */
const PFAD =
  "M17 17C10.2 24.2 3.83333 23.9346 0 22.268C2.04406 22.268 4.0144 20.5274 5 18.5C6.1185 16.1992 6 12.4237 6 9.5V0C12.8333 3 23.8 9.8 17 17Z";

export default function BubbleSpike({
  className = "chat-bubble-spike",
  kontur = false,
}: {
  className?: string;
  kontur?: boolean;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 22 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={kontur ? { overflow: "visible" } : undefined}
      aria-hidden
    >
      <g transform="translate(2, 2)">
        {kontur ? (
          <path d={PFAD} paintOrder="stroke" strokeWidth={2} strokeMiterlimit={6} />
        ) : (
          <path d={PFAD} fill="currentColor" />
        )}
      </g>
    </svg>
  );
}
