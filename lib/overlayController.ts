/**
 * Zentrale Overlay-Koordination für Menü, Finanztools, Leo und Vorschauslider.
 *
 * Problem vorher: Jedes Overlay feuerte eigenständig `menu-opened`/`menu-closed`.
 * Der ContentScaler (Background-Blur) wusste nur „irgendwas offen", nicht WAS.
 * Dadurch konnten mehrere Overlays gleichzeitig offen sein und ein `menu-closed`
 * eines Overlays hob den Blur auf, obwohl ein anderes noch offen war.
 *
 * Jetzt: Es ist immer GENAU EIN Overlay aktiv. Öffnet man B während A offen ist,
 * wird A's Inhalt ausanimiert (sein Closer läuft), der Blur bleibt aber bestehen
 * und B animiert/morpht ein. Erst wenn das letzte Overlay schließt, geht der Blur.
 *
 * Trick für „Blur bleibt beim Handoff bestehen": `active` wird VOR dem Aufruf des
 * vorherigen Closers umgesetzt. Der Closer ruft (wie bei einem normalen User-Close)
 * `closeOverlay(seineId)` auf — das ist beim Handoff aber ein No-Op, weil `active`
 * bereits auf das neue Overlay zeigt. Also wird KEIN `menu-closed` gefeuert und der
 * Blur bleibt erhalten. `menu-opened` ist idempotent (ContentScaler ignoriert es,
 * wenn schon offen), daher kein Flackern.
 */

export type OverlayId = "menu" | "finanztools" | "leo" | "preview";

export interface OverlayOpenDetail {
  extended?: boolean;
  label?: string;
  fromBurgerNav?: boolean;
}

type CloseFn = () => void;

let active: OverlayId | null = null;
const closers = new Map<OverlayId, CloseFn>();

/** Registriert den Inhalts-Closer eines Overlays (für den Handoff). */
export function registerOverlayCloser(id: OverlayId, fn: CloseFn): () => void {
  closers.set(id, fn);
  return () => {
    if (closers.get(id) === fn) closers.delete(id);
  };
}

/**
 * Overlay `id` öffnen. Ist bereits ein anderes Overlay aktiv, wird dessen Inhalt
 * geschlossen (Blur bleibt). Danach `menu-opened` (idempotenter Blur-Trigger).
 */
export function openOverlay(id: OverlayId, detail?: OverlayOpenDetail) {
  const prev = active;
  active = id; // ZUERST setzen → prev-Closer's closeOverlay(prev) wird No-Op (Blur bleibt)
  if (prev && prev !== id) {
    const prevCloser = closers.get(prev);
    if (prevCloser) prevCloser();
  }
  window.dispatchEvent(new CustomEvent("menu-opened", { detail }));
}

/**
 * Wie openOverlay, aber OHNE `menu-opened` zu feuern — für Overlays, die ihren
 * Blur bereits selbst per `menu-opened` anstoßen (das Megamenü hört selbst auf
 * dieses Event und würde durch ein erneutes Dispatch re-entrant toggeln).
 * Markiert das Overlay als aktiv und schließt defensiv ein evtl. anderes (Blur bleibt).
 */
export function setActiveOverlay(id: OverlayId) {
  const prev = active;
  active = id;
  if (prev && prev !== id) {
    const prevCloser = closers.get(prev);
    if (prevCloser) prevCloser();
  }
}

/** Aktives Overlay wurde vom User geschlossen → Blur aus. */
export function closeOverlay(id: OverlayId) {
  if (active !== id) return; // Handoff oder bereits geschlossen → kein Blur-Toggle
  active = null;
  window.dispatchEvent(new CustomEvent("menu-closed"));
}

/**
 * Für den Seitenübergang: aktives Overlay sofort schließen, OHNE `menu-closed` zu
 * feuern. Der Inhalts-Closer wird aufgerufen (sofortiges Hide via React-State), aber
 * der Blur bleibt stehen — die Page-Transition treibt den Wrapper anschließend ganz
 * raus (Fall A: geblurte Seite faded zu opacity 0). Gibt die geschlossene Overlay-Id
 * zurück (oder null, wenn keins offen war). Nachträgliche `closeOverlay(id)`-Aufrufe
 * aus dem Overlay-eigenen Cleanup sind danach No-Ops (active === null).
 */
export function consumeActiveOverlayForTransition(): OverlayId | null {
  const id = active;
  if (!id) return null;
  active = null; // VOR dem Closer → dessen closeOverlay(id) wird No-Op (kein menu-closed)
  const closer = closers.get(id);
  if (closer) closer();
  return id;
}

export function getActiveOverlay(): OverlayId | null {
  return active;
}
