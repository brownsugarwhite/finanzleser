"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Sticky Werbe-Rails links + rechts neben dem zentrierten Content.
 *
 * - Ohne `variant`: rein statisch, positioniert über CSS (`.page-ad-rail-left/right`
 *   + die Kategorie-spezifischen Overrides). Bisheriges Verhalten.
 * - variant="tool": Rails sitzen in den Seitenbändern des (auf 1200 gedeckelten)
 *   Frames, werden nur gezeigt, wenn das Band breit genug ist (kein Abschneiden am
 *   Bildrand), und enden 40px vor der Newsletter-Section (#newsletter).
 */
const RAIL_BOTTOM_GAP = 40;
const MIN_BAND = 170;

export default function PageAdRails({
  variant,
  contentWidth = 0,
  railGap = 24,
}: {
  variant?: "tool";
  contentWidth?: number;
  railGap?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (variant !== "tool") return;
    const region = ref.current?.closest(".page-ad-region") as HTMLElement | null;
    if (!region) return;
    const compute = () => {
      const band = (region.clientWidth - contentWidth) / 2 - railGap;
      setHidden(band < MIN_BAND);
      const top = region.getBoundingClientRect().top + window.scrollY;
      // Rails enden 40px VOR dem ersten Hindernis: der Dokumente-Section (falls auf der
      // Seite, z. B. Suche) ODER der Newsletter-Section — je nachdem was zuerst kommt.
      let boundary = Infinity;
      const dok = document.querySelector(".category-dokumente") as HTMLElement | null;
      if (dok) boundary = Math.min(boundary, dok.getBoundingClientRect().top + window.scrollY);
      const nl = document.getElementById("newsletter");
      if (nl) boundary = Math.min(boundary, nl.getBoundingClientRect().top + window.scrollY);
      if (!isFinite(boundary)) { setHeight(null); return; }
      setHeight(Math.max(0, boundary - top - RAIL_BOTTOM_GAP));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(document.body);
    window.addEventListener("resize", compute);
    const t1 = setTimeout(compute, 600);
    const t2 = setTimeout(compute, 1600);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [variant, contentWidth, railGap]);

  if (variant === "tool" && hidden) return null;

  const style = variant === "tool" && height != null ? { height, bottom: "auto" as const } : undefined;

  return (
    <div ref={ref} style={{ display: "contents" }}>
      <div className="page-ad-rail page-ad-rail-left" aria-hidden style={style}>
        <div className="page-ad-rail-sticky">
          <div className="page-ad-rail-box" data-ad-format="rail" role="complementary" aria-label="Werbung" />
        </div>
      </div>
      <div className="page-ad-rail page-ad-rail-right" aria-hidden style={style}>
        <div className="page-ad-rail-sticky">
          <div className="page-ad-rail-box" data-ad-format="rail" role="complementary" aria-label="Werbung" />
        </div>
      </div>
    </div>
  );
}
