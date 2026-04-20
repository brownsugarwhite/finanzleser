"use client";

import { useEffect, useState } from "react";
import lottie from "lottie-web";
import animationData from "@/assets/lottie/visualBackground01.json";

type CachedSvg = {
  innerHTML: string;
  viewBox: string;
};

let cachedSvg: CachedSvg | null = null;
let cachePromise: Promise<CachedSvg> | null = null;

function extractStaticSvg(): Promise<CachedSvg> {
  if (cachedSvg) return Promise.resolve(cachedSvg);
  if (cachePromise) return cachePromise;

  cachePromise = new Promise<CachedSvg>((resolve) => {
    const holder = document.createElement("div");
    holder.style.cssText =
      "position:absolute;left:-9999px;top:-9999px;width:100px;height:100px;visibility:hidden;pointer-events:none;";
    document.body.appendChild(holder);

    const anim = lottie.loadAnimation({
      container: holder,
      renderer: "svg",
      loop: false,
      autoplay: false,
      animationData: animationData as any,
      rendererSettings: { preserveAspectRatio: "none" },
    });

    anim.addEventListener("DOMLoaded", () => {
      anim.goToAndStop(anim.totalFrames - 1, true);
      const svg = holder.querySelector("svg");
      if (!svg) {
        anim.destroy();
        holder.remove();
        return;
      }
      svg.querySelectorAll("[fill]").forEach((el) => {
        const f = el.getAttribute("fill");
        if (f && f !== "none") el.setAttribute("fill", "currentColor");
      });
      const result: CachedSvg = {
        innerHTML: svg.innerHTML,
        viewBox: svg.getAttribute("viewBox") ?? "0 0 1600 1200",
      };
      cachedSvg = result;
      anim.destroy();
      holder.remove();
      resolve(result);
    });
  });

  return cachePromise;
}

function hashToIndex(seed: string, buckets: number): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (Math.abs(h) % buckets) + 1;
}

type Props = {
  className?: string;
  style?: React.CSSProperties;
  seed?: string;
};

export default function VisualLottie({ className, style, seed }: Props) {
  const [svg, setSvg] = useState<CachedSvg | null>(cachedSvg);

  useEffect(() => {
    if (svg) return;
    let active = true;
    extractStaticSvg().then((r) => {
      if (active) setSvg(r);
    });
    return () => {
      active = false;
    };
  }, [svg]);

  const index = seed ? hashToIndex(seed, 10) : 1;
  const color = `var(--visual-fill-${index})`;

  if (!svg) {
    return (
      <div
        aria-hidden
        className={className}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          ...style,
        }}
      />
    );
  }

  return (
    <svg
      aria-hidden
      className={className}
      viewBox={svg.viewBox}
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        display: "block",
        color,
        ...style,
      }}
      dangerouslySetInnerHTML={{ __html: svg.innerHTML }}
    />
  );
}
