"use client";

/**
 * MorphTransitionLayer — persistenter Klon-Layer für den Card→Artikel-Direkt-Morph.
 * Mounted AUSSERHALB `.scalable-content` (im layout), überlebt den Seitenwechsel.
 *
 * Choreografie (exakt):
 *  1) Klick (Phase "exiting"): Anker-Klone an der Card-Position erzeugen (Visual als
 *     Bild, Texte im Quell-Stil) und SOFORT zur Ziel-Position fliegen — parallel zum
 *     Ausblurren der alten Seite (pageTransition EXIT). Die Zielposition kommt aus dem
 *     CACHE (gemessen beim letzten echten Artikel-Mount), damit der Flug nicht auf das
 *     Laden der Artikelseite warten muss. Kein Cache (erster Morph/neue Breite) → der
 *     Flug startet beim Mount (Fallback).
 *  2) Phase "morphing" (Artikelseite gemountet): echte Ziele messen (unscaled, ohne
 *     die ENTER-Skalierung), cachen, echte Ziele auf opacity:0 und den Flug weich auf
 *     die exakte Position nachkorrigieren (Settle — die vertikale Zentrierung ist
 *     leicht content-abhängig).
 *  3) onMorphComplete → ENTER der neuen Seite freigeben (sie blendet mit scale/blur ein).
 *  4) Reveal: Morph UND ENTER fertig → echte Ziele zeigen, Klone entfernen.
 *
 * Umbruchsicher: Ziel-Klon im Ziel-Layout (Ziel-Breite+Font → Umbruch fix), nur
 * transform (x/y/scale) animiert. Crossfade Quell-Klon→Ziel-Klon, beide laufen
 * geometrisch deckungsgleich (gleiche effektive Schriftgröße + Position).
 */

import { useEffect, useRef } from "react";
import gsap from "@/lib/gsapConfig";
import {
  subscribeMorph,
  getMorphPhase,
  getMorphPayload,
  getMorphTargets,
  getIsPopstate,
  getPopstateScrollTop,
  setCachedTargets,
  onMorphComplete,
  finishMorph,
  type MorphItemSource,
  type MorphKind,
  type TargetCache,
  type CachedTarget,
  type CachedTextStyle,
} from "@/lib/morphTransition";
import { subscribe as subscribePageTransition } from "@/lib/pageTransition";

const MORPH_DURATION = 0.5;
const MORPH_EASE = "power2.inOut";

/**
 * Misst el-Rect ohne TRANSITIONS-Artefakte: neutralisiert (a) die EIGENE Transform
 * des Ziels (z. B. Phase-Skalierung scale(0)→1 einer Slider-Card) und (b) die
 * Transition-Wrapper `.scalable-content`/`.scalable-landing` (ENTER-Skalierung).
 * LEGITIME Layout-Transforms (Embla-Slider-Translate, Wrapper-translateX) BLEIBEN
 * erhalten → korrekte On-Screen-Position auch für Card-Ziele im Slider.
 */
function measureRectUnscaled(el: HTMLElement): DOMRect {
  const saved: { el: HTMLElement; transform: string; filter: string }[] = [];
  const neutralize = (node: HTMLElement) => {
    const cs = getComputedStyle(node);
    if (cs.transform !== "none" || (cs.filter && cs.filter !== "none")) {
      saved.push({ el: node, transform: node.style.transform, filter: node.style.filter });
      node.style.transform = "none";
      node.style.filter = "none";
    }
  };
  neutralize(el); // (a) eigene Transform des Ziels
  let node: HTMLElement | null = el.parentElement;
  while (node && node !== document.body && node !== document.documentElement) {
    if (node.classList.contains("scalable-content") || node.classList.contains("scalable-landing")) {
      neutralize(node); // (b) nur Transition-Wrapper
    }
    node = node.parentElement;
  }
  const rect = el.getBoundingClientRect();
  saved.forEach((s) => {
    s.el.style.transform = s.transform;
    s.el.style.filter = s.filter;
  });
  return rect;
}

function styleBundleFromComputed(cs: CSSStyleDeclaration): CachedTextStyle {
  return {
    fontFamily: cs.fontFamily,
    fontWeight: cs.fontWeight,
    fontStyle: cs.fontStyle,
    fontSize: cs.fontSize,
    lineHeight: cs.lineHeight,
    letterSpacing: cs.letterSpacing,
    color: cs.color,
    hyphens: cs.hyphens || "auto",
  };
}

function styleBundleFromItem(item: MorphItemSource): CachedTextStyle {
  return {
    fontFamily: item.fontFamily || "",
    fontWeight: item.fontWeight || "",
    fontStyle: item.fontStyle || "",
    fontSize: item.fontSize ? `${item.fontSize}px` : "",
    lineHeight: item.lineHeight || "",
    letterSpacing: item.letterSpacing || "",
    color: item.color || "",
    hyphens: "auto",
  };
}

function makeTextClone(style: CachedTextStyle, width: number, text: string): HTMLDivElement {
  const el = document.createElement("div");
  el.textContent = text;
  el.lang = "de";
  el.setAttribute("aria-hidden", "true");
  Object.assign(el.style, {
    position: "fixed",
    margin: "0",
    padding: "0",
    width: `${width}px`,
    fontFamily: style.fontFamily,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    fontSize: style.fontSize,
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing,
    color: style.color,
    whiteSpace: "normal",
    overflowWrap: "break-word",
    pointerEvents: "none",
    transformOrigin: "top left",
    willChange: "transform, opacity",
  } as Partial<CSSStyleDeclaration>);
  el.style.setProperty("hyphens", style.hyphens);
  el.style.setProperty("-webkit-hyphens", style.hyphens);
  return el;
}

interface ItemRuntime {
  item: MorphItemSource;
  kind: MorphKind;
  srcEl: HTMLElement; // Anker (Quell-Stil bzw. Visual)
  tgtEl: HTMLElement | null; // Ziel-Stil-Klon (nur Text)
}

export default function MorphTransitionLayer() {
  const hostRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<ItemRuntime[]>([]);
  const clonesRef = useRef<HTMLElement[]>([]);
  const hiddenTargetsRef = useRef<HTMLElement[]>([]);

  const cleanup = () => {
    // Reveal-Reihenfolge: ERST die echten Ziele wieder sichtbar machen, DANN die
    // Klone entfernen — sonst gibt es einen Frame, in dem weder Klon noch echtes
    // Element sichtbar ist (kurzes Aufblitzen am Morph-Ende).
    hiddenTargetsRef.current.forEach((t) => {
      if (document.contains(t)) gsap.set(t, { clearProps: "visibility" });
    });
    hiddenTargetsRef.current = [];
    clonesRef.current.forEach((c) => {
      gsap.killTweensOf(c);
      c.remove();
    });
    clonesRef.current = [];
    itemsRef.current = [];
  };

  // Anker-Klone an der Card-Position (scharf, sofort).
  const createSourceClones = () => {
    const payload = getMorphPayload();
    const host = hostRef.current;
    if (!payload || !host) return;
    cleanup();
    itemsRef.current = payload.items.map((item) => {
      let srcEl: HTMLElement;
      if (item.kind === "visual") {
        srcEl = document.createElement("div");
        srcEl.setAttribute("aria-hidden", "true");
        Object.assign(srcEl.style, {
          position: "fixed",
          top: `${item.rect.top}px`,
          left: `${item.rect.left}px`,
          width: `${item.rect.width}px`,
          height: `${item.rect.height}px`,
          borderRadius: item.borderRadius || "0px",
          overflow: "hidden",
          pointerEvents: "none",
          transformOrigin: "top left",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        } as Partial<CSSStyleDeclaration>);
        if (item.imgSrc) {
          const img = document.createElement("img");
          img.src = item.imgSrc;
          img.alt = "";
          Object.assign(img.style, {
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
          } as Partial<CSSStyleDeclaration>);
          srcEl.appendChild(img);
        }
      } else {
        srcEl = makeTextClone(styleBundleFromItem(item), item.rect.width, item.text || "");
        srcEl.style.top = `${item.rect.top}px`;
        srcEl.style.left = `${item.rect.left}px`;
        gsap.set(srcEl, { x: 0, y: 0, scale: 1, opacity: 1 });
      }
      host.appendChild(srcEl);
      clonesRef.current.push(srcEl);
      return { item, kind: item.kind, srcEl, tgtEl: null };
    });
  };

  // Promise-wrappende gsap.to (overwrite, damit Retarget den laufenden Tween ersetzt).
  const tweenP = (el: HTMLElement, vars: gsap.TweenVars): Promise<void> =>
    new Promise((resolve) => {
      gsap.to(el, { ...vars, overwrite: "auto", onComplete: () => resolve() });
    });

  // Anker (+ Ziel-Klone) zu den Ziel-Rects fliegen. `final` → Promise resolved bei Ende.
  const flyTo = (tc: TargetCache, duration: number, final: boolean): Promise<void> => {
    const host = hostRef.current!;
    const proms: Promise<void>[] = [];
    const half = Math.min(duration, MORPH_DURATION * 0.5);

    itemsRef.current.forEach((rt) => {
      const t: CachedTarget | undefined =
        rt.kind === "visual" ? tc.visual : rt.kind === "bold" ? tc.bold : tc.italic;
      if (!t) return;
      const src = rt.item.rect;
      const tx = t.rect.left - src.left;
      const ty = t.rect.top - src.top;

      if (rt.kind === "visual") {
        const p = tweenP(rt.srcEl, {
          x: tx,
          y: ty,
          width: t.rect.width,
          height: t.rect.height,
          borderRadius: t.borderRadius || "0px",
          duration,
          ease: MORPH_EASE,
        });
        if (final) proms.push(p);
        return;
      }

      // Text
      const tgtFont = t.fontSize || parseFloat(t.textStyle?.fontSize || "") || 16;
      const srcFont = rt.item.fontSize || tgtFont;

      if (!rt.tgtEl && t.textStyle) {
        const el = makeTextClone(t.textStyle, t.rect.width, rt.item.text || "");
        el.style.top = `${src.top}px`;
        el.style.left = `${src.left}px`;
        gsap.set(el, { x: 0, y: 0, scale: srcFont / tgtFont, opacity: 0 });
        host.appendChild(el);
        clonesRef.current.push(el);
        rt.tgtEl = el;
        gsap.to(el, { opacity: 1, duration: half, ease: "power1.out" });
      }
      if (rt.tgtEl) {
        const p = tweenP(rt.tgtEl, { x: tx, y: ty, scale: 1, duration, ease: MORPH_EASE });
        if (final) proms.push(p);
      }
      if (rt.srcEl) {
        gsap.to(rt.srcEl, { x: tx, y: ty, scale: tgtFont / srcFont, duration, ease: MORPH_EASE, overwrite: "auto" });
        gsap.to(rt.srcEl, { opacity: 0, duration: half, ease: "power1.in", overwrite: "auto" });
      }
    });

    return Promise.all(proms).then(() => undefined);
  };

  // Echte Ziele messen (unscaled) → TargetCache-Form, und cachen.
  const measureReal = (): TargetCache | null => {
    const targets = getMorphTargets();
    if (!targets) return null;
    const out: TargetCache = { vw: window.innerWidth };
    const rectOf = (r: DOMRect) => ({ top: r.top, left: r.left, width: r.width, height: r.height });
    if (targets.visual) {
      const r = measureRectUnscaled(targets.visual);
      const cs = getComputedStyle(targets.visual);
      out.visual = { rect: rectOf(r), borderRadius: cs.borderRadius };
    }
    if (targets.bold) {
      const r = measureRectUnscaled(targets.bold);
      const cs = getComputedStyle(targets.bold);
      out.bold = { rect: rectOf(r), fontSize: parseFloat(cs.fontSize) || undefined, textStyle: styleBundleFromComputed(cs) };
    }
    if (targets.italic) {
      const r = measureRectUnscaled(targets.italic);
      const cs = getComputedStyle(targets.italic);
      out.italic = { rect: rectOf(r), fontSize: parseFloat(cs.fontSize) || undefined, textStyle: styleBundleFromComputed(cs) };
    }
    return out;
  };

  // Phase "morphing": echte Ziele messen, verdecken, Flug exakt nachkorrigieren.
  const runMorphToReal = () => {
    const targets = getMorphTargets();
    if (!targets || !hostRef.current || itemsRef.current.length === 0) {
      onMorphComplete();
      return;
    }
    // Vorwärts (Klick) ODER popstate ZUR Artikelseite (Vor-Button): Seite startet oben
    // → Scroll auf 0 BEVOR gemessen wird. Nur popstate ZUR Liste (Zurück) NICHT
    // (Scroll wird wiederhergestellt, sonst läge die Ziel-Card falsch).
    if (!getIsPopstate() || getPopstateScrollTop()) window.scrollTo(0, 0);

    const real = measureReal();
    if (!real) {
      onMorphComplete();
      return;
    }
    setCachedTargets(real); // für späteren Excerpt-basierten Vorab-Flug

    // Echte Ziel-Elemente verdecken (Klon übernimmt visuell). visibility statt opacity:
    // instant, NICHT von der CSS-opacity-Transition der Card animiert (sonst „faden
    // die Card-Elemente animiert aus" während des Rückwärts-Morphs).
    [targets.visual, targets.bold, targets.italic].forEach((el) => {
      if (el) {
        gsap.set(el, { visibility: "hidden" });
        hiddenTargetsRef.current.push(el);
      }
    });

    flyTo(real, MORPH_DURATION, true).then(() => onMorphComplete());
  };

  // Morph-Phasen.
  useEffect(() => {
    return subscribeMorph((phase) => {
      if (phase === "exiting") {
        // Anker an der Quell-Position erzeugen (scharf, sofort). Der Flug startet
        // erst beim "morphing", wenn die EXAKTE Ziel-Position gemessen werden kann.
        createSourceClones();
      } else if (phase === "morphing") {
        runMorphToReal();
      } else if (phase === "settling" && getIsPopstate()) {
        // Rückwärts-Morph: kein pageTransition-ENTER, auf das gewartet werden könnte
        // → direkt beim Morph-Ende die echten Ziele zeigen und Klone entfernen.
        cleanup();
        // Snapshot NICHT hier entfernen — er managed sich selbst per Tween-onComplete
        // (0.34s). Früher entfernen würde den Ausblur-Crossfade abschneiden.
        finishMorph();
      } else if (phase === "idle") {
        cleanup();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reveal: pageTransition-ENTER fertig (idle) UND Morph in "settling" → swap.
  useEffect(() => {
    return subscribePageTransition((pPhase) => {
      if (pPhase === "idle" && getMorphPhase() === "settling") {
        cleanup();
        finishMorph();
      }
    });
  }, []);

  return (
    <div
      ref={hostRef}
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9500,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    />
  );
}
