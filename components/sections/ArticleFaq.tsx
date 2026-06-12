"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "@/lib/gsapConfig";
import Spark from "@/components/ui/Spark";

export interface FaqPair {
  q: string;
  a: string; // HTML der Antwort
}

/**
 * Artikel-FAQ im Layout-Stil (feine Linien, Dotted-Trenner, Sparks — keine
 * Glass-Box). Desktop ≥1024px: Master-Detail (Fragen links, animierte Antwort-
 * box rechts). Mobile: Akkordeon (Single-Open). Alle Antworten liegen immer im
 * DOM (SEO). SSR rendert das Akkordeon; nach dem Mount wird auf Desktop
 * umgeschaltet → erste Client-Render === Server-Render (kein Hydration-Mismatch).
 */
export default function ArticleFaq({ pairs }: { pairs: FaqPair[] }) {
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mql = window.matchMedia("(min-width: 1024px)");
    const apply = () => setIsDesktop(mql.matches);
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, []);

  if (!pairs.length) return null;
  if (mounted && isDesktop) return <FaqMasterDetail pairs={pairs} />;
  return <FaqAccordion pairs={pairs} />;
}

function num(i: number) {
  return String(i + 1).padStart(2, "0");
}

/* ── Desktop: Master-Detail ──────────────────────────────────────────────── */
function FaqMasterDetail({ pairs }: { pairs: FaqPair[] }) {
  const [active, setActive] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const answerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const firstRun = useRef(true);

  // Panel-Höhe + Crossfade, wenn sich die aktive Frage ändert. Erster Lauf
  // instant (kein Auf-Animieren beim Laden), danach weiche Übergänge.
  useLayoutEffect(() => {
    const panel = panelRef.current;
    const answer = answerRefs.current[active];
    if (!panel || !answer) return;
    const target = answer.offsetHeight;
    const instant = firstRun.current;
    firstRun.current = false;

    gsap.to(panel, { height: target, duration: instant ? 0 : 0.42, ease: "power3.out", overwrite: true });
    answerRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.killTweensOf(el);
      if (i === active) {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: instant ? 0 : 10 },
          { autoAlpha: 1, y: 0, duration: instant ? 0 : 0.4, ease: "power2.out", delay: instant ? 0 : 0.06 }
        );
      } else {
        gsap.set(el, { autoAlpha: 0, y: instant ? 0 : 10 });
      }
    });
  }, [active]);

  return (
    <div className="faq2 faq2--md" data-faq>
      <ul className="faq2-list" role="tablist" aria-orientation="vertical">
        {pairs.map((p, i) => {
          const on = i === active;
          return (
            <li key={i} className="faq2-litem">
              <button
                role="tab"
                aria-selected={on}
                className={"faq2-q" + (on ? " is-active" : "")}
                onClick={() => setActive(i)}
                onMouseEnter={() => setActive(i)}
              >
                <span className="faq2-num">{num(i)}</span>
                <span className="faq2-q-text">{p.q}</span>
                <span className="faq2-spark" aria-hidden style={{ ["--fill-0" as string]: "var(--color-brand)" }}>
                  <Spark />
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="faq2-detail" ref={panelRef}>
        {pairs.map((p, i) => (
          <div
            key={i}
            ref={(el) => { answerRefs.current[i] = el; }}
            role="tabpanel"
            className="faq2-answer"
            style={{ visibility: i === active ? "visible" : "hidden" }}
            dangerouslySetInnerHTML={{ __html: p.a }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Mobile: Akkordeon (Single-Open) ─────────────────────────────────────── */
function FaqAccordion({ pairs }: { pairs: FaqPair[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const innerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const outerRefs = useRef<(HTMLDivElement | null)[]>([]);

  const animate = (i: number, willOpen: boolean) => {
    const outer = outerRefs.current[i];
    const inner = innerRefs.current[i];
    if (!outer || !inner) return;
    gsap.killTweensOf([outer, inner]);
    if (willOpen) {
      gsap.set(outer, { height: 0 });
      // Höhe inkl. Innen-Padding messen → kein End-Sprung durch separates Padding.
      gsap.to(outer, {
        height: inner.offsetHeight,
        duration: 0.44,
        ease: "power3.out",
        onComplete: () => { gsap.set(outer, { height: "auto" }); },
      });
      gsap.fromTo(inner, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power2.out", delay: 0.05 });
    } else {
      gsap.set(outer, { height: outer.offsetHeight });
      gsap.to(outer, { height: 0, duration: 0.34, ease: "power3.inOut" });
      gsap.to(inner, { y: 6, opacity: 0, duration: 0.24, ease: "power1.in" });
    }
  };

  const toggle = (i: number) => {
    const next = open === i ? null : i;
    if (open !== null && open !== i) animate(open, false);
    if (next === null) animate(i, false);
    else animate(i, true);
    setOpen(next);
  };

  return (
    <div className="faq2 faq2--acc" data-faq>
      {pairs.map((p, i) => {
        const on = open === i;
        return (
          <div key={i} className={"faq2-item" + (on ? " is-open" : "")}>
            <button className="faq2-q" aria-expanded={on} onClick={() => toggle(i)}>
              <span className="faq2-num">{num(i)}</span>
              <span className="faq2-q-text">{p.q}</span>
              <span
                className="faq2-spark"
                aria-hidden
                style={{ ["--fill-0" as string]: on ? "var(--color-brand)" : "var(--color-text-medium)" }}
              >
                <Spark />
              </span>
            </button>
            <div
              className="faq2-a-outer"
              ref={(el) => { outerRefs.current[i] = el; }}
              style={{ height: 0, overflow: "hidden" }}
            >
              <div
                className="faq2-answer"
                ref={(el) => { innerRefs.current[i] = el; }}
                dangerouslySetInnerHTML={{ __html: p.a }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
