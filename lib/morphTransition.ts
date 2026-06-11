/**
 * Morph-Transition-Controller (Singleton, framework-frei — wie pageTransition).
 *
 * Zweck: Beim Klick auf eine Artikel-Card morphen Visual + fetter Titel + kursiver
 * Secondary-Titel DIREKT an ihre Zielposition im Artikel-Header — über den
 * Seitenwechsel hinweg. Der Controller ist ein ADDITIVER Layer über `pageTransition`:
 * pageTransition bleibt alleiniger Owner von EXIT/ENTER des `.scalable-content`,
 * dieser Controller hält nur den Morph-State + die Quelldaten und koordiniert das
 * ENTER-Gate (der Rest der Seite blendet erst NACH dem Morph ein).
 *
 * Flow:
 *   Klick → startMorphNavigation(payload) → holdEnter() + pageTransition EXIT + push
 *   → Artikelseite mountet → notifyTargetMounted(targets) → Phase "morphing"
 *   → MorphTransitionLayer misst Ziele, morpht die Klone Quelle→Ziel
 *   → onMorphComplete() → releaseEnter() (pageTransition ENTER blendet Rest ein)
 *   → Phase "settling" → bei ENTER-Ende Reveal-Swap → reset.
 *
 * Schlägt der Morph fehl (keine Ziele / Timeout), wird das ENTER-Gate freigegeben
 * und alles fällt auf die normale Seiten-Transition zurück.
 */

import {
  startTransition,
  isTransitioning,
  holdEnter,
  releaseEnter,
} from "@/lib/pageTransition";

export type MorphKind = "visual" | "bold" | "italic";
export type MorphPhase = "idle" | "exiting" | "morphing" | "settling";

export interface MorphRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface MorphItemSource {
  kind: MorphKind;
  rect: MorphRect;
  /** Text-Items (Quell-Stil für den Anker-Klon): */
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  lineHeight?: string;
  letterSpacing?: string;
  color?: string;
  /** Visual-Items: */
  imgSrc?: string | null;
  borderRadius?: string;
}

export interface MorphPayload {
  href: string;
  items: MorphItemSource[];
}

export interface MorphTargets {
  visual?: HTMLElement | null;
  bold?: HTMLElement | null;
  italic?: HTMLElement | null;
}

// ── Ziel-Cache ──────────────────────────────────────────────────────────────
// Damit der Morph-Flug SOFORT starten kann (parallel zum Ausblenden der alten
// Seite), ohne auf das Mounten der Artikelseite zu warten, wird die Ziel-Geometrie
// gecached (gemessen beim letzten echten Artikel-Mount, in sessionStorage). Beim
// Klick fliegt der Layer sofort zur gecachten Position; beim echten Mount wird weich
// auf die exakte Position nachkorrigiert (die vertikale Zentrierung ist leicht
// content-abhängig). Key = Viewport-Breite → bei Resize greift der Cache nicht
// (sauberer Fallback auf Fly-on-Mount), die echte Messung re-cached für die neue Breite.

export interface CachedTextStyle {
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  fontSize: string;
  lineHeight: string;
  letterSpacing: string;
  color: string;
  hyphens: string;
}
export interface CachedTarget {
  rect: MorphRect;
  fontSize?: number;
  textStyle?: CachedTextStyle;
  borderRadius?: string;
}
export interface TargetCache {
  vw: number;
  visual?: CachedTarget;
  bold?: CachedTarget;
  italic?: CachedTarget;
}

const CACHE_KEY = "morphTargetCache";
let targetCache: TargetCache | null = null;

/** Gecachte Ziele — nur wenn die aktuelle Viewport-Breite passt (Layout ist breitenabhängig). */
export function getCachedTargets(): TargetCache | null {
  if (typeof window === "undefined") return null;
  if (!targetCache) {
    try {
      const s = sessionStorage.getItem(CACHE_KEY);
      if (s) targetCache = JSON.parse(s) as TargetCache;
    } catch {
      /* noop */
    }
  }
  if (targetCache && Math.abs(targetCache.vw - window.innerWidth) <= 1) return targetCache;
  return null;
}

export function setCachedTargets(c: TargetCache): void {
  targetCache = c;
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(c));
  } catch {
    /* noop */
  }
}

type Listener = (phase: MorphPhase) => void;

// Notbremse: wenn nach dem Klick nicht innerhalb dieser Zeit eine Artikelseite mit
// Zielen meldet (z. B. Navigation auf eine Nicht-Artikel-Route), Gate freigeben.
const SAFETY_MS = 1600;

let phase: MorphPhase = "idle";
let payload: MorphPayload | null = null;
let targets: MorphTargets | null = null;
let safetyTimer: ReturnType<typeof setTimeout> | null = null;
// Rückwärts-Morph (Browser Vor/Zurück): kein pageTransition-EXIT/ENTER, der Layer
// revealt direkt bei Morph-Ende (statt auf pageTransition-idle zu warten).
let isPopstate = false;
// Bei popstate ZUR Artikelseite (Vor-Button) soll der Layer auf 0 scrollen (Artikel
// startet oben); bei popstate ZUR Liste (Zurück) NICHT (Scroll wird wiederhergestellt).
let popstateScrollTop = false;
const listeners = new Set<Listener>();

export function getIsPopstate(): boolean {
  return isPopstate;
}

export function getPopstateScrollTop(): boolean {
  return popstateScrollTop;
}

function emit() {
  listeners.forEach((l) => l(phase));
}

export function subscribeMorph(cb: Listener): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getMorphPhase(): MorphPhase {
  return phase;
}

export function getMorphPayload(): MorphPayload | null {
  return payload;
}

export function getMorphTargets(): MorphTargets | null {
  return targets;
}

function clearSafety() {
  if (safetyTimer) {
    clearTimeout(safetyTimer);
    safetyTimer = null;
  }
}

/** Vollständiger Reset — Gate freigeben, Phase auf idle. */
export function cancelMorph(): void {
  releaseEnter();
  clearSafety();
  phase = "idle";
  payload = null;
  targets = null;
  isPopstate = false;
  popstateScrollTop = false;
  emit();
}

/**
 * Einstiegspunkt aus den Cards. Baut keine Klone — das macht der Layer, der die
 * Phase abonniert. Triggert die normale pageTransition (EXIT → push → ENTER),
 * hält aber das ENTER zurück bis der Morph fertig ist.
 */
export function startMorphNavigation(
  p: MorphPayload,
  doPush: (href: string) => void
): void {
  // Läuft schon eine Transition? → kein Morph, normale Navigation überlassen.
  if (isTransitioning() || phase !== "idle") {
    doPush(p.href);
    return;
  }
  if (!p.items || p.items.length === 0) {
    // Nichts zu morphen → normale Transition.
    startTransition({ href: p.href, doPush });
    return;
  }

  payload = p;
  targets = null;
  isPopstate = false;
  phase = "exiting";
  emit(); // → MorphTransitionLayer erzeugt SOFORT Anker-Klone und fliegt (bei
          //   vorhandenem Cache) sofort zur Ziel-Position — parallel zum EXIT-Blur.

  // ENTER der NEUEN Seite zurückhalten: erst nach dem Morph blendet sie ein
  // (alte Seite blurt aus + Morph parallel → DANN neue Seite ein).
  holdEnter();

  // Notbremse: kommt keine Artikelseite mit Zielen, Morph abbrechen.
  clearSafety();
  safetyTimer = setTimeout(() => {
    cancelMorph();
  }, SAFETY_MS);

  // Normale Transition: alte Seite blurt/scaled AUS (EXIT), dann push. Der Morph-Flug
  // im Layer läuft parallel zum EXIT (Ziel kommt aus dem Cache, kein Warten aufs Mount).
  startTransition({ href: p.href, doPush });
}

/**
 * Von der Artikelseite (ArticleClient) per useLayoutEffect gerufen, sobald die
 * Ziel-Elemente im DOM sind. No-op wenn kein Morph aktiv ist (normale Navigation).
 */
export function notifyTargetMounted(t: MorphTargets): void {
  if (phase !== "exiting" || !payload) return;

  // Prüfen ob für die Payload-Items überhaupt passende Ziele existieren.
  const hasUsableTarget = payload.items.some((item) => {
    if (item.kind === "visual") return !!t.visual;
    if (item.kind === "bold") return !!t.bold;
    if (item.kind === "italic") return !!t.italic;
    return false;
  });

  if (!hasUsableTarget) {
    // Kein Ziel gefunden (z. B. alter Beitrag) → Fallback auf normale Transition.
    cancelMorph();
    return;
  }

  clearSafety();
  targets = t;
  phase = "morphing";
  emit();
}

/**
 * Vom Layer gerufen wenn alle Morph-Tweens fertig sind. Gibt das ENTER frei
 * (Rest der Seite blendet jetzt mit scale/blur ein) und geht in "settling".
 */
export function onMorphComplete(): void {
  if (phase !== "morphing") return;
  phase = "settling";
  emit();
  releaseEnter();
}

/**
 * Vom Layer gerufen wenn der Reveal-Swap erledigt ist (ENTER fertig + Klone
 * entfernt). Setzt zurück auf idle.
 */
export function finishMorph(): void {
  clearSafety();
  phase = "idle";
  payload = null;
  targets = null;
  isPopstate = false;
  popstateScrollTop = false;
  emit();
}

/**
 * Rückwärts-Morph (Browser Vor/Zurück). Anders als startMorphNavigation: KEIN
 * pageTransition (Next hat bei popstate bereits navigiert), KEIN ENTER-Gate. Der
 * Layer hebt die Anker aus den (noch im alten DOM erfassten) Quell-Items ab; die
 * Ziele kommen per setPopstateTargets, sobald die neue Seite gemountet ist.
 * Gibt false zurück, wenn gerade etwas anderes läuft / nichts zu morphen ist.
 */
export function startPopstateMorph(p: MorphPayload, scrollTop = false): boolean {
  if (phase !== "idle") return false;
  if (!p.items || p.items.length === 0) return false;
  isPopstate = true;
  popstateScrollTop = scrollTop;
  payload = p;
  targets = null;
  phase = "exiting";
  emit();
  clearSafety();
  safetyTimer = setTimeout(() => {
    cancelMorph();
  }, SAFETY_MS);
  return true;
}

/** Ziele des Rückwärts-Morphs setzen (neue Seite gemountet) → Flug starten. */
export function setPopstateTargets(t: MorphTargets): void {
  if (phase !== "exiting" || !payload || !isPopstate) return;
  const hasUsableTarget = payload.items.some((item) =>
    item.kind === "visual" ? !!t.visual : item.kind === "bold" ? !!t.bold : !!t.italic
  );
  if (!hasUsableTarget) {
    cancelMorph();
    return;
  }
  clearSafety();
  targets = t;
  phase = "morphing";
  emit();
}
