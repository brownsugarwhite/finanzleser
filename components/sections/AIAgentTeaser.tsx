"use client";

import "@/lib/gsapConfig"; // ensures GSAP plugins are registered before tweens
import Image from "next/image";
import { useEffect, useRef } from "react";
import gsap from "@/lib/gsapConfig";
import { ScrollTrigger } from "@/lib/gsapConfig";

function ChatBubble({ children }: { children: React.ReactNode }) {
  const slotRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const slot = slotRef.current;
    const box = boxRef.current;
    const visual = visualRef.current;
    const text = textRef.current;
    if (!slot || !box || !visual || !text) return;

    let tl: gsap.core.Timeline | null = null;
    let trigger: ScrollTrigger | null = null;
    let cancelled = false;

    const setup = async () => {
      // Wait for web fonts so measurements are stable
      const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts;
      if (fonts?.ready) await fonts.ready;
      if (cancelled || !slot.isConnected) return;

      // Measure natural sizes (visual is currently position: relative in flow)
      const vRect = visual.getBoundingClientRect();
      const w = vRect.width;
      const h = vRect.height;
      const tRect = text.getBoundingClientRect();
      const tw = tRect.width;

      // Lock slot + box to natural layout size (reserves space; ScrollTrigger position stable)
      slot.style.width = `${w}px`;
      slot.style.height = `${h}px`;
      box.style.width = `${w}px`;
      box.style.height = `${h}px`;

      // Move visual to absolute bottom-left; text width locked; initial tiny state
      visual.style.position = "absolute";
      visual.style.left = "0";
      visual.style.bottom = "0";
      gsap.set(visual, { width: 40, height: 40 });
      gsap.set(text, { width: Math.ceil(tw) + 2, opacity: 0 });
      gsap.set(box, { opacity: 0 });

      slot.style.visibility = "visible";

      tl = gsap.timeline({ paused: true });
      // Fade in whole bubble box (visual + spike together — no alpha overlap)
      tl.to(box, { opacity: 1, duration: 0.3, ease: "power2.out" }, 0);
      // Bloom: grow to natural size with subtle overshoot (Apple-bubbly)
      tl.to(visual, {
        width: w,
        height: h,
        duration: 0.85,
        ease: "back.out(1.4)",
      }, 0);
      // Text fades in slightly later — appears as the bubble is mostly grown
      tl.to(text, { opacity: 1, duration: 0.45, ease: "power2.out" }, 0.35);

      trigger = ScrollTrigger.create({
        trigger: slot,
        start: "bottom bottom-=100",
        onEnter: () => tl?.play(),
        once: true,
      });
    };

    setup();

    const onLoad = () => ScrollTrigger.refresh();
    if (document.readyState === "complete") {
      requestAnimationFrame(onLoad);
    } else {
      window.addEventListener("load", onLoad);
    }
    const refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 400);

    return () => {
      cancelled = true;
      window.removeEventListener("load", onLoad);
      clearTimeout(refreshTimer);
      trigger?.kill();
      tl?.kill();
    };
  }, []);

  return (
    <div
      ref={slotRef}
      style={{
        position: "relative",
        maxWidth: "400px",
        visibility: "hidden",
      }}
    >
      <div ref={boxRef} style={{ position: "relative" }}>
        <div
          ref={visualRef}
          style={{
            position: "relative",
            display: "inline-block",
            maxWidth: "400px",
            background: "#CFFFE3",
            borderRadius: "27px",
            padding: "23px 27px",
            fontFamily: "var(--font-body)",
            fontSize: "17px",
            lineHeight: 1.35,
            color: "#636A5F",
            overflow: "hidden",
            boxSizing: "border-box",
          }}
        >
          <div ref={textRef}>{children}</div>
        </div>
        <img
          src="/assets/bubbleSpike.svg"
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "-6px",
            bottom: "-0.24px",
            width: "19.142px",
            height: "23.244px",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}

export default function AIAgentTeaser() {
  const leoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const leo = leoRef.current;
    if (!leo) return;

    const ctx = gsap.context(() => {
      // Start off-screen links unten, klein, leicht gekippt
      gsap.set(leo, {
        yPercent: -50,
        opacity: 0,
        scale: 0.35,
        x: -700,
        y: 180,
        rotation: -10,
        transformOrigin: "50% 50%",
      });

      const entrance = gsap.timeline({
        paused: true,
        onComplete: () => {
          // Schwebendes Wogen – zwei unabhängige Zyklen für organisches Gefühl
          gsap.to(leo, {
            y: "-=12",
            duration: 2.4,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          });
          gsap.to(leo, {
            rotation: 3,
            duration: 3.3,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          });
        },
      });

      entrance
        .to(leo, {
          x: 0,
          opacity: 1,
          scale: 1,
          rotation: 0,
          duration: 1.4,
          ease: "power3.out",
        }, 0)
        .to(leo, {
          y: 0,
          duration: 1.4,
          ease: "back.out(1.2)",
        }, 0);

      // Gleiche Trigger-Quelle wie die erste Bubble: deren slot-Element.
      // querySelector explicit damit der gsap.context-Scope nicht stört.
      const firstBubbleSlot = document.querySelector<HTMLElement>(
        ".ai-bubbles-group > div"
      );
      if (firstBubbleSlot) {
        ScrollTrigger.create({
          trigger: firstBubbleSlot,
          start: "bottom bottom-=100",
          onEnter: () => entrance.play(),
          onLeaveBack: () => {
            gsap.killTweensOf(leo);
            entrance.reverse();
          },
        });
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <section
      className="ai-agent-teaser"
      style={{
        position: "relative",
        width: "100%",
        padding: "96px 24px",
        overflow: "hidden",
        background:
          "linear-gradient(to bottom right, rgba(10, 197, 144, 0.9) 0%, rgba(111, 230, 123, 0.9) 100%)",
        opacity: 0.95,
      }}
    >
      <div
        ref={leoRef}
        className="ai-agent-leo"
        style={{
          position: "absolute",
          top: "50%",
          left: "calc(50% - 350px - 220px)",
          width: "183px",
          height: "189px",
          pointerEvents: "none",
        }}
      >
        <Image
          src="/assets/leo.svg"
          alt="Leo – KI-Finanzagent"
          width={183}
          height={189}
          priority={false}
        />
      </div>

      <div
        style={{
          maxWidth: "700px",
          width: "100%",
          margin: "0 auto",
          textAlign: "left",
          position: "relative",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "19px",
            fontWeight: 650,
            lineHeight: 1.2,
            color: "#ffffff",
            margin: 0,
            marginBottom: "2px",
          }}
        >
          Ihr Beratungsagent
        </h2>

        <p
          style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 800,
            fontSize: "clamp(32px, 5vw, 42px)",
            lineHeight: 1.1,
            color: "#ffffff",
            margin: 0,
            marginBottom: "32px",
          }}
        >
          Klare Antworten
        </p>

        <div
          className="ai-bubbles-group"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "23px",
            alignItems: "flex-start",
          }}
        >
          <ChatBubble>
            Hallo ich bin <span style={{ fontWeight: 700, color: "inherit" }}>Leo</span>,
            <br />
            Ihr persönlicher Finanzagent
          </ChatBubble>
          <ChatBubble>
            Ich analysiere tausende Versicherungs- und Finanzdokumente und bereite die Inhalte klar und verständlich für Sie auf.{" "}
            <span style={{ fontSize: "1.4em", letterSpacing: "0.15em", whiteSpace: "nowrap", verticalAlign: "-0.1em" }}>
              🔍🧠
            </span>
          </ChatBubble>
          <ChatBubble>Wie kann ich helfen?</ChatBubble>
        </div>

        {/* Reservierter Dock-Slot für LeoIcon (rechts-aligned, gegenüber der Bubbles).
            Höhe/Breite fest damit das Layout nicht springt wenn LeoIcon einfliegt. */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            width: "100%",
            marginTop: "28px",
          }}
        >
          <div
            id="leo-dock-slot-ai"
            style={{
              position: "relative",
              width: "410px",
              height: "70px",
              maxWidth: "100%",
            }}
          />
        </div>
      </div>

      <style>{`
        @media (max-width: 1100px) {
          .ai-agent-leo { display: none; }
        }
      `}</style>
    </section>
  );
}
