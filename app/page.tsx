"use client";
import { Merriweather } from "next/font/google";
import Image from "next/image";
import { Fragment, useEffect } from "react";
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollToPlugin);
import { useNavPill } from "@/hooks/useNavPill";
import Spacer from "@/components/ui/Spacer";
import lottie from "lottie-web";
import logoData from "@/assets/lottie/logoShrink.json";

const merriweather = Merriweather({
  weight: ["300", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-nav",
});

const NAV_ITEMS = [
  { label: "Finanzen", href: "/finanzen" },
  { label: "Versicherungen", href: "/versicherungen" },
  { label: "Steuern", href: "/steuern" },
  { label: "Recht", href: "/recht" },
  { label: "Finanztools", href: "/finanztools" },
];

const Spark = () => (
  <Image src="/icons/nav-spark.svg" alt="" width={12} height={12} aria-hidden style={{ pointerEvents: "none" }} />
);

const BTN_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-nav)", fontSize: "18px", fontWeight: 700,
  color: "#334a27", textDecoration: "none", whiteSpace: "nowrap",
  cursor: "pointer", background: "none", border: "none",
  padding: "12px 20px", margin: "0 -20px",
  position: "relative", zIndex: 1,
};

export default function LandingPage() {
  const blurContent = (blur: boolean) => {
    const wrapper = document.querySelector(".landing-below-nav") as HTMLElement;
    if (!wrapper) return;
    wrapper.style.transformOrigin = "center center";
    gsap.to(wrapper, {
      scale: blur ? 0.9 : 1,
      filter: blur ? "blur(13px)" : "blur(0px)",
      duration: blur ? 0.5 : 0.4,
      ease: "power3.out",
    });
  };

  const pill = useNavPill({
    items: NAV_ITEMS,
    hasLens: true,
    onActivate: (label) => {
      // Scroll nav to top position
      const navEl = document.querySelector("nav");
      if (navEl) {
        const targetTop = 23;
        const scrollTarget = window.scrollY + navEl.getBoundingClientRect().top - targetTop;
        gsap.to(window, {
          scrollTo: { y: scrollTarget },
          duration: 0.5,
          ease: "power3.out",
        });
      }
      window.dispatchEvent(new CustomEvent("mega-show", { detail: { label } }));
      blurContent(true);
    },
    onDeactivate: () => {
      window.dispatchEvent(new CustomEvent("mega-hide"));
      blurContent(false);
    },
  });

  // Mark body as landing page to hide global logo
  useEffect(() => {
    document.body.setAttribute("data-landing", "");
    return () => document.body.removeAttribute("data-landing");
  }, []);

  // Lens sync
  useEffect(() => {
    const sync = () => {
      if (!pill.pillRef.current || !pill.lensRef.current) return;
      const px = gsap.getProperty(pill.pillRef.current, "x") as number;
      const pw = gsap.getProperty(pill.pillRef.current, "width") as number;
      gsap.set(pill.lensRef.current, { x: -px });
      pill.lensRef.current.style.transformOrigin = `${px + pw / 2}px center`;
    };
    gsap.ticker.add(sync);
    return () => gsap.ticker.remove(sync);
  }, []);

  // Fixed shrunk logo: init lottie at last frame, slide in/out on scroll
  useEffect(() => {
    const container = document.querySelector(".landing-lottie") as HTMLElement;
    const navEl = document.querySelector("nav");
    if (!container || !navEl) return;

    const anim = lottie.loadAnimation({
      container,
      renderer: "svg",
      loop: false,
      autoplay: false,
      animationData: logoData,
    });
    // Start at shrunk state (last frame)
    anim.goToAndStop(anim.totalFrames - 1, true);

    let logoShown = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const wrapper = document.querySelector(".landing-logo-fixed") as HTMLElement;
        if (!wrapper) return;

        if (!entry.isIntersecting && !logoShown) {
          logoShown = true;
          window.dispatchEvent(new CustomEvent("nav-scrolled-out"));
          gsap.fromTo(wrapper,
            { opacity: 0, x: -60 },
            { opacity: 1, x: 0, duration: 0.5, ease: "power3.out" }
          );
        } else if (entry.isIntersecting && logoShown) {
          logoShown = false;
          window.dispatchEvent(new CustomEvent("nav-scrolled-in"));
          gsap.to(wrapper, {
            opacity: 0, x: -60, duration: 0.4, ease: "power2.in",
          });
        }
      },
      { threshold: 0 }
    );
    observer.observe(navEl);
    return () => {
      observer.disconnect();
      anim.destroy();
    };
  }, []);

  // Listen for mega-closed, burger-opened/closed
  useEffect(() => {
    const onMegaClosed = () => {
      pill.closeMenu();
      blurContent(false);
    };
    const onBurgerOpen = () => blurContent(true);
    const onBurgerClose = () => blurContent(false);

    window.addEventListener("mega-closed", onMegaClosed);
    window.addEventListener("burger-opened", onBurgerOpen);
    window.addEventListener("burger-closed", onBurgerClose);
    return () => {
      window.removeEventListener("mega-closed", onMegaClosed);
      window.removeEventListener("burger-opened", onBurgerOpen);
      window.removeEventListener("burger-closed", onBurgerClose);
    };
  }, [pill]);

  return (
    <div className={merriweather.variable} style={{ background: "#fff", minHeight: "100vh" }}>
      {/* Fixed shrunk logo — hidden initially, slides in from left on scroll */}
      <div className="landing-logo-fixed" style={{
        position: "fixed",
        top: 23,
        left: 36,
        zIndex: 61,
        opacity: 0,
        pointerEvents: "none",
        height: 50,
        display: "flex",
        alignItems: "center",
        paddingBottom: 8,
      }}>
        <div className="landing-lottie" style={{ width: 190, height: 22 }} />
      </div>

      <div className="landing-content">
        {/* Big centered logo */}
        <div style={{
          position: "relative",
          zIndex: 55,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 80,
        }}>
          <div style={{ width: 500, height: 58, position: "relative" }}>
            <div style={{ position: "absolute", inset: "1.36% 0 0.4% 19.91%" }}>
              <Image src="/icons/fl-logo-text.svg" alt="finanzleser" fill style={{ objectFit: "contain" }} />
            </div>
            <div style={{ position: "absolute", inset: "0 82.59% 0 0" }}>
              <Image src="/icons/fl-logo-icon.svg" alt="" fill style={{ objectFit: "contain" }} aria-hidden />
            </div>
          </div>

          {/* Subtitle */}
          <p style={{
            fontFamily: "var(--font-nav)",
            fontSize: 21,
            fontWeight: 300,
            fontStyle: "italic",
            color: "#686c6a",
            marginTop: 15,
            textAlign: "center",
          }}>
            Das digitale Finanzmagazin
          </p>
        </div>

      </div>

        {/* Centered nav with pill — outside landing-content so it doesn't blur */}
        <nav style={{
          position: "relative",
          zIndex: 55,
          display: "flex",
          justifyContent: "center",
          marginTop: 30,
          height: 50,
          overflow: "visible",
        }}>
          <div
            {...pill.containerProps}
            style={{
              position: "relative",
              display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 840, width: "100%",
              overflow: "visible",
            }}
          >
            {pill.renderPill()}

            {NAV_ITEMS.map((item, i) => (
              <Fragment key={item.href}>
                <Spark />
                <button {...pill.getButtonProps(i)} style={BTN_STYLE}>
                  {item.label}
                </button>
              </Fragment>
            ))}
            {/* Extra spark on the right */}
            <Spark />
          </div>
        </nav>

      <div className="landing-below-nav">
        {/* Spacer */}
        <Spacer />

        {/* Dummy content for scroll testing */}
        <div style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "60px clamp(20px, 4vw, 40px) 200px",
        }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ marginBottom: 60 }}>
              <h2 style={{
                fontFamily: "var(--font-nav)", fontSize: "28px", fontWeight: 700,
                color: "#334a27", marginBottom: 16,
              }}>
                Abschnitt {i}
              </h2>
              <p style={{
                fontFamily: "'Open Sans', sans-serif", fontSize: 18,
                color: "#475569", lineHeight: 1.75,
              }}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
