/**
 * Polarkoordinaten und Bögen — geteilt von Drehring, Zinsband und Zinskurve.
 *
 * Vorlage: „Finanzleser Vergleich & Rechner - Kursblatt.dc.html“:377-378 (`pol`, `bogen`).
 * Winkel in Grad, 0° zeigt nach oben, positiv im Uhrzeigersinn — so gelesen, wie man eine
 * Skala beschreibt.
 */

export function polar(cx: number, cy: number, r: number, grad: number): [number, number] {
  const t = (grad * Math.PI) / 180;
  return [cx + r * Math.sin(t), cy - r * Math.cos(t)];
}

export function bogen(cx: number, cy: number, r: number, von: number, bis: number): string {
  const [x1, y1] = polar(cx, cy, r, von);
  const [x2, y2] = polar(cx, cy, r, bis);
  const gross = bis - von > 180 ? 1 : 0;
  return `M${x1.toFixed(2)} ${y1.toFixed(2)} A${r} ${r} 0 ${gross} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}
