"use client";

import { useState, useRef, useLayoutEffect } from "react";
import Button from "@/components/ui/Button";
import RechnerCheckbox from "@/components/rechner/ui/RechnerCheckbox";
import FieldOutline from "@/components/ui/FieldOutline";

const PILL_BG = "var(--color-pill-bg)";

/**
 * Standalone Newsletter-CTA — full-width Section mit Hintergrundbild (cover, zentriert).
 * Die Abo-Elemente schweben frei über dem Hintergrund (kein Karten-Container) und sind
 * im Site-Stil gehalten (Merriweather-Heading, Such-Pill-Eingabefeld mit innenliegendem
 * Button, Rechner-Checkbox). Feinschliff/Positionierung folgt manuell.
 */
export default function NewsletterBanner() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);

  // Content so verschieben, dass das Eingabefeld exakt in der vertikalen Mitte der
  // Section sitzt. Der Block ist via align-items:center zentriert → wir translaten ihn
  // um (BlockMitte − Pill-Mitte), sodass die Pill-Mitte auf der Section-Mitte landet.
  useLayoutEffect(() => {
    const block = contentRef.current;
    const pill = pillRef.current;
    if (!block || !pill) return;
    const compute = () => {
      block.style.transform = "none"; // für saubere Messung
      // Mobile: Section skaliert auf Content (kein vertikales Zentrieren).
      if (window.matchMedia("(max-width: 767px)").matches) return;
      const blockH = block.offsetHeight;
      const pillCenter = pill.offsetTop + pill.offsetHeight / 2; // relativ zum Block
      block.style.transform = `translateY(${Math.round(blockH / 2 - pillCenter)}px)`;
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(block);
    window.addEventListener("resize", compute);
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(compute).catch(() => {});
    }
    return () => { ro.disconnect(); window.removeEventListener("resize", compute); };
  }, []);

  const handleSubmit = async () => {
    if (status === "loading") return;
    if (!email) { setStatus("error"); setFeedback("Bitte eine E-Mail-Adresse angeben."); return; }
    if (!consent) { setStatus("error"); setFeedback("Bitte der Datenschutzerklärung zustimmen."); return; }
    setStatus("loading");
    setFeedback("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus("success");
        setFeedback("Fast geschafft! Wir haben dir eine E-Mail geschickt – bitte bestätige darin deine Anmeldung.");
        setEmail("");
        setConsent(false);
      } else {
        setStatus("error");
        setFeedback(data?.error || "Anmeldung fehlgeschlagen. Bitte später erneut versuchen.");
      }
    } catch {
      setStatus("error");
      setFeedback("Anmeldung fehlgeschlagen. Bitte später erneut versuchen.");
    }
  };

  return (
    <section
      id="newsletter"
      className="newsletter-banner"
      style={{
        position: "relative",
        width: "100%",
        minHeight: 560,
        scrollMarginTop: 80,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "100px clamp(20px, 5vw, 60px)",
        boxSizing: "border-box",
        backgroundImage: "url(/assets/finanzleserBG.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Frei schwebende Inhalte über dem Hintergrund (kein Container-Hintergrund). */}
      <div
        ref={contentRef}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 620,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 18,
        }}
      >
        {/* Heading — groß, 900, Merriweather. Desktop einzeilig, Mobile gestapelt + größer. */}
        <h2
          className="nl-heading"
          style={{
            fontFamily: "var(--font-heading, 'Merriweather', serif)",
            fontWeight: 900,
            // Immer auf einer Zeile (nowrap); vw-basiert, damit es auf Mobile mitskaliert
            // und nicht überläuft.
            fontSize: "clamp(24px, 6.2vw, 58px)",
            lineHeight: 1.1,
            color: "var(--color-text-primary)",
            margin: 0,
            whiteSpace: "nowrap",
          }}
        >
          Finanzleser Newsletter
        </h2>

        {/* Subtext — nicht italic, größer, semibold */}
        <p
          style={{
            fontFamily: "var(--font-heading, 'Merriweather', serif)",
            fontWeight: 600,
            fontSize: 18,
            lineHeight: 1.55,
            color: "var(--color-text-primary)",
            margin: 0,
            maxWidth: 480,
          }}
        >
          Finanztipps, neue Ratgeber und Rechner – kostenlos und direkt in Ihr Postfach.
        </p>

        <form
          onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
          style={{ width: "100%", maxWidth: 580, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginTop: 6 }}
        >
          {/* E-Mail-Pill: nur Eingabe, „E-Mail-Adresse" als Placeholder */}
          <div
            ref={pillRef}
            className="nl-pill field-wrap field-wrap--dark"
            style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              boxSizing: "border-box",
              background: PILL_BG,
              backdropFilter: "blur(16px) brightness(1.15)",
              WebkitBackdropFilter: "blur(16px) brightness(1.15)",
              borderRadius: 19,
              padding: "6px 20px",
              boxShadow: "0 3px 23px rgba(0, 0, 0, 0.02)",
            }}
          >
            <input
              id="newsletter-email"
              type="email"
              placeholder="E-Mail Adresse eingeben"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              style={{
                flex: 1,
                minWidth: 0,
                border: "none",
                background: "transparent",
                outline: "none",
                fontFamily: "var(--font-body)",
                fontSize: 17,
                color: "var(--color-text-primary)",
                lineHeight: "40px",
                padding: 0,
              }}
            />
            <FieldOutline radius={19} />
          </div>

          {/* Einwilligung — gleiche Breite wie das Eingabefeld, Inhalt zentriert. */}
          <div style={{ width: "100%", textAlign: "center" }}>
            <RechnerCheckbox
              name="newsletter-consent"
              checked={consent}
              onChange={setConsent}
              label={
                <>
                  Ich möchte den Newsletter erhalten und stimme der{" "}
                  <a
                    href="/datenschutz"
                    className="nl-privacy-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Datenschutzerklärung
                  </a>{" "}
                  zu.
                </>
              }
            />
          </div>

          {/* Submit — darunter, zentriert, im Default-Button-Stil */}
          <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
            <Button label={status === "loading" ? "Wird gesendet…" : "Abonnieren"} onClick={handleSubmit} />
          </div>

          {/* Status-Meldung (Erfolg = Bestätigungshinweis, sonst Fehler) */}
          {feedback && (
            <p
              role="status"
              aria-live="polite"
              style={{
                margin: 0,
                maxWidth: 480,
                fontFamily: "var(--font-body)",
                fontSize: 15,
                lineHeight: 1.5,
                color: status === "error" ? "var(--color-brand-secondary)" : "var(--color-text-primary)",
                fontWeight: status === "success" ? 700 : 500,
              }}
            >
              {feedback}
            </p>
          )}
        </form>
      </div>

      {/* Scoped Overrides */}
      <style>{`
        /* Mehr Höhe vor allem auf Mobile. */
        @media (max-width: 767px) {
          .newsletter-banner {
            min-height: 0 !important;       /* Höhe skaliert auf den Content */
            padding-top: 80px !important;
            padding-bottom: 130px !important;
          }
          /* Heading auf Mobile gestapelt (untereinander) + größer. */
          .newsletter-banner .nl-heading {
            white-space: normal !important;
            font-size: clamp(38px, 12vw, 60px) !important;
            line-height: 1.05 !important;
          }
        }
        /* Checkbox zentriert unter dem Input; Box oben an der ersten Zeile ausrichten */
        .newsletter-banner .rechner-check {
          justify-content: center;
          align-items: flex-start;
        }
        .newsletter-banner .rechner-check-label {
          font-size: calc(0.95rem - 1px);
          text-align: left;
        }
        /* Datenschutz-Link: fett, nicht unterstrichen, Hover = brand-secondary */
        .newsletter-banner .nl-privacy-link {
          font-weight: 700;
          color: inherit;
          text-decoration: none;
          transition: color 0.15s ease;
        }
        .newsletter-banner .nl-privacy-link:hover {
          color: var(--color-brand-secondary);
        }
        /* Checkbox-Box wie das Eingabefeld: gleicher Hintergrund + Blur/Brightness, kein Outline */
        .newsletter-banner .rechner-check-box {
          border: none;
          background: ${PILL_BG};
          backdrop-filter: blur(16px) brightness(1.15);
          -webkit-backdrop-filter: blur(16px) brightness(1.15);
          box-shadow: 0 3px 23px rgba(0, 0, 0, 0.02);
        }
      `}</style>
    </section>
  );
}
