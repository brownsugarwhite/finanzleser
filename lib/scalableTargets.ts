/**
 * Geteilte Quelle für die „skalierbaren" Seiten-Elemente, die ContentScaler beim
 * Overlay-Open blurt/skaliert — und die der Page-Transition-Controller beim
 * Seitenwechsel übernehmen muss (Fall A: aus offenem Overlay heraus navigieren).
 *
 * ContentScaler meldet sein aktuell offenes Element-Set hier an (setOpenScalableTargets),
 * der Transition-Controller liest es (getOpenScalableTargets), um exakt dieselben
 * Elemente auszufaden und danach wieder einzufaden.
 */

/** Der persistente Layout-Wrapper (überlebt Routenwechsel, enthält die neuen children). */
export function getTransitionWrapper(): HTMLElement[] {
  const el = document.querySelector<HTMLElement>(".scalable-content");
  return el ? [el] : [];
}

// ContentScalers aktuell „offenes" (geblurtes) Element-Set — Content + ggf. Chrome.
let openTargets: HTMLElement[] = [];

export function setOpenScalableTargets(els: HTMLElement[]): void {
  openTargets = els;
}

export function getOpenScalableTargets(): HTMLElement[] {
  return openTargets;
}

export function clearOpenScalableTargets(): void {
  openTargets = [];
}
