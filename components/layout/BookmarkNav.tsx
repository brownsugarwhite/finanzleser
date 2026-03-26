"use client";

import Image from "next/image";
import { useRef, useCallback } from "react";
import gsap from "gsap";

const BURGER_LINE_W = 20;
const BURGER_GAP = 5;

export default function BookmarkNav() {
  const burgerLinesRef = useRef<HTMLDivElement[]>([]);
  const burgerIsX = useRef(false);

  const animateToX = useCallback(() => {
    if (burgerIsX.current) return;
    burgerIsX.current = true;
    const lines = burgerLinesRef.current;
    if (lines.length < 3) return;
    const [top, mid, bot] = lines;
    const tl = gsap.timeline();
    tl.to(top, { y: BURGER_GAP + 2, duration: 0.2, ease: "power2.inOut" }, 0);
    tl.to(bot, { y: -(BURGER_GAP + 2), duration: 0.2, ease: "power2.inOut" }, 0);
    tl.to(mid, { opacity: 0, scaleX: 0, duration: 0.15, ease: "power2.in" }, 0);
    tl.to(top, { rotation: 45, duration: 0.25, ease: "power2.out" }, 0.15);
    tl.to(bot, { rotation: -45, duration: 0.25, ease: "power2.out" }, 0.15);
  }, []);

  const animateToBurger = useCallback(() => {
    if (!burgerIsX.current) return;
    burgerIsX.current = false;
    const lines = burgerLinesRef.current;
    if (lines.length < 3) return;
    const [top, mid, bot] = lines;
    const tl = gsap.timeline();
    tl.to(top, { rotation: 0, duration: 0.2, ease: "power2.inOut" }, 0);
    tl.to(bot, { rotation: 0, duration: 0.2, ease: "power2.inOut" }, 0);
    tl.to(top, { y: 0, duration: 0.2, ease: "power2.out" }, 0.15);
    tl.to(mid, { opacity: 1, scaleX: 1, duration: 0, ease: "power2.out" }, 0.15);
    tl.to(bot, { y: 0, duration: 0.2, ease: "power2.out" }, 0.15);
  }, []);

  const toggleBurger = useCallback(() => {
    if (burgerIsX.current) {
      animateToBurger();
      window.dispatchEvent(new CustomEvent("burger-closed"));
    } else {
      animateToX();
      window.dispatchEvent(new CustomEvent("burger-opened", { detail: { label: "Menü" } }));
    }
  }, [animateToX, animateToBurger]);

  return (
    <div
      style={{
        position: "fixed",
        top: 24,
        right: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        height: 50,
      }}
    >
      {/* Spike */}
      <div style={{ width: 40, height: 50, marginRight: -1, flexShrink: 0 }}>
        <Image
          src="/icons/lesezeichen-spikes.svg"
          alt=""
          width={40}
          height={50}
          style={{ display: "block", width: "100%", height: "100%" }}
          aria-hidden
        />
      </div>

      {/* Green rectangle with buttons */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          height: 50,
          gap: 4,
          paddingLeft: 1,
          paddingRight: 25,
          marginRight: -1,
          background: "linear-gradient(to left, rgba(22,142,3,0.8), #45a117)",
        }}
      >
        {/* Finanztools Button */}
        <button
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 36,
            padding: "0 10px",
            borderRadius: 15,
            border: "none",
            background: "transparent",
            color: "white",
            fontFamily: '"Open Sans", sans-serif',
            fontSize: 17,
            fontWeight: 400,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Finanztools
        </button>

        {/* Lupe Button */}
        <button
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: 15,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            padding: 4,
          }}
        >
          <Image
            src="/icons/lupe.svg"
            alt="Suche"
            width={18}
            height={18}
          />
        </button>

        {/* Burger Button */}
        <button
          onClick={toggleBurger}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: 15,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            gap: BURGER_GAP,
            paddingRight: 8,
          }}
        >
          <div
            ref={(el) => { if (el) burgerLinesRef.current[0] = el; }}
            style={{
              width: BURGER_LINE_W,
              height: 2,
              background: "white",
              borderRadius: 1,
              transformOrigin: "center",
            }}
          />
          <div
            ref={(el) => { if (el) burgerLinesRef.current[1] = el; }}
            style={{
              width: BURGER_LINE_W,
              height: 2,
              background: "white",
              borderRadius: 1,
              transformOrigin: "center",
            }}
          />
          <div
            ref={(el) => { if (el) burgerLinesRef.current[2] = el; }}
            style={{
              width: BURGER_LINE_W,
              height: 2,
              background: "white",
              borderRadius: 1,
              transformOrigin: "center",
            }}
          />
        </button>
      </div>
    </div>
  );
}
