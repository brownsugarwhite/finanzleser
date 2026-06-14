"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "@/lib/gsapConfig";

export interface FaqPair {
  q: string;
  a: string; // HTML der Antwort
}

/**
 * Artikel-FAQ. Desktop ≥1024px: Master-Detail — Fragen links (Klick-Auswahl im
 * Checklisten-Stil), ein vertikaler Pfeil (wie im Rechner) gleitet zum aktiven
 * Tab, und die Antwortbox (weiß, backdrop-brightness) slided + morpht an die zum
 * Tab passende Stelle (oben/unten geklemmt). Mobile: Akkordeon (Single-Open).
 * Alle Antworten liegen immer im DOM (SEO).
 */
// Dekorierte Überschrift: zentrierter Text, links/rechts „?"-Füllung (Merriweather bold).
// Anzahl „?" wird gemessen → es werden nur GANZE „?" gerendert (kein Abschneiden).
function FaqHeading({ headingId }: { headingId?: string }) {
  const lRef = useRef<HTMLSpanElement>(null);
  const rRef = useRef<HTMLSpanElement>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const measure = () => {
      const el = lRef.current || rRef.current;
      if (!el) return;
      const avail = el.clientWidth;
      // Breite eines „?" einmalig messen.
      const probe = document.createElement("span");
      probe.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap;font-family:'Merriweather',Georgia,serif;font-weight:700;font-size:13px;letter-spacing:0;";
      probe.textContent = "?".repeat(50);
      document.body.appendChild(probe);
      const w = probe.getBoundingClientRect().width / 50;
      document.body.removeChild(probe);
      if (w > 0) setCount(Math.max(0, Math.floor(avail / w)));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const q = "?".repeat(count);
  return (
    <div className="faq2-heading">
      <span ref={lRef} className="faq2-heading-q faq2-heading-q--l" aria-hidden>{q}</span>
      <h2 id={headingId || undefined} className="faq2-heading-text">Häufig gestellte Fragen</h2>
      <span ref={rRef} className="faq2-heading-q faq2-heading-q--r" aria-hidden>{q}</span>
    </div>
  );
}

export default function ArticleFaq({ pairs, headingId }: { pairs: FaqPair[]; headingId?: string }) {
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
  return (
    <>
      <FaqHeading headingId={headingId} />
      {mounted && isDesktop ? <FaqMasterDetail pairs={pairs} /> : <FaqAccordion pairs={pairs} />}
    </>
  );
}

function num(i: number) {
  return String(i + 1).padStart(2, "0");
}

const EASE = "power3.out";

/* ── Desktop: Master-Detail ──────────────────────────────────────────────── */
function FaqMasterDetail({ pairs }: { pairs: FaqPair[] }) {
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const tabRefs = useRef<(HTMLLIElement | null)[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<SVGSVGElement>(null);
  const answerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const firstRun = useRef(true);
  const firstArrow = useRef(true);

  // Pfeil folgt dem HOVER-Tab; ohne Hover (Verlassen) gleitet er zur aktiven Card.
  useLayoutEffect(() => {
    const arrow = arrowRef.current;
    const tab = tabRefs.current[hovered ?? active];
    if (!arrow || !tab) return;
    const tabCenter = tab.offsetTop + tab.offsetHeight / 2;
    const instant = firstArrow.current;
    firstArrow.current = false;
    // SVG-Pfeil (Kerbe bei y≈1001 von 2003) so verschieben, dass die Spitze am Tab-Center sitzt.
    gsap.to(arrow, { y: tabCenter - 1001, duration: instant ? 0 : 0.4, ease: EASE, overwrite: true });
  }, [hovered, active]);

  // Antwortbox + Crossfade folgen dem KLICK (active).
  useLayoutEffect(() => {
    const list = listRef.current;
    const box = boxRef.current;
    const tab = tabRefs.current[active];
    const answer = answerRefs.current[active];
    if (!list || !box || !tab || !answer) return;

    const instant = firstRun.current;
    firstRun.current = false;
    const dur = instant ? 0 : 0.55;

    const listH = list.offsetHeight;
    const tabCenter = tab.offsetTop + tab.offsetHeight / 2;
    const boxH = answer.offsetHeight;
    // Box vertikal am Tab ausrichten, aber im Container klemmen (oben/unten bündig).
    const boxTop = Math.max(0, Math.min(tabCenter - boxH / 2, listH - boxH));

    gsap.to(box, { y: boxTop, height: boxH, duration: dur, ease: EASE, overwrite: true });

    // Crossfade der Antworten.
    answerRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.killTweensOf(el);
      if (i === active) {
        gsap.fromTo(
          el,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: instant ? 0 : 0.5, ease: "power2.out", delay: instant ? 0 : 0.12 }
        );
      } else {
        gsap.to(el, { autoAlpha: 0, duration: instant ? 0 : 0.28, ease: "power1.out" });
      }
    });
  }, [active]);

  return (
    <div className="faq2 faq2--md" data-faq>
      <ul className="faq2-list" ref={listRef} role="tablist" aria-orientation="vertical" onMouseLeave={() => setHovered(null)}>
        {pairs.map((p, i) => {
          const on = i === active;
          return (
            <li key={i} className="faq2-litem" ref={(el) => { tabRefs.current[i] = el; }}>
              <button
                role="tab"
                aria-selected={on}
                className={"faq2-q" + (on ? " is-active" : "")}
                onClick={() => setActive(i)}
                onMouseEnter={() => setHovered(i)}
              >
                <span className="faq2-num">{num(i)}</span>
                <span className="faq2-q-text">{p.q}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Vertikale Linie (volle Höhe) + gleitende >-Pfeilspitze, zeigt auf aktiven Tab */}
      <div className="faq2-arrow" aria-hidden>
        <svg ref={arrowRef} className="faq2-arrow-svg" viewBox="0 0 20 2003" fill="none" preserveAspectRatio="xMidYMid meet">
          <path
            d="M0.999913 1L0.999956 983.5L18.4999 1001L0.999957 1018.5L1 2001.5"
            stroke="var(--color-text-primary)"
            strokeWidth="1"
            strokeLinecap="square"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      {/* Rechte Spalte: Antwortbox slided + morpht zur richtigen Stelle */}
      <div className="faq2-detail">
        <div className="faq2-box" ref={boxRef}>
          {pairs.map((p, i) => (
            <div
              key={i}
              ref={(el) => { answerRefs.current[i] = el; }}
              role="tabpanel"
              className="faq2-answer"
              style={{ visibility: i === active ? "visible" : "hidden", opacity: i === active ? 1 : 0 }}
              dangerouslySetInnerHTML={{ __html: p.a }}
            />
          ))}
        </div>
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
            <button className={"faq2-q" + (on ? " is-active" : "")} aria-expanded={on} onClick={() => toggle(i)}>
              <span className="faq2-num">{num(i)}</span>
              <span className="faq2-q-text">{p.q}</span>
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
