import Image from "next/image";
import Button from "@/components/ui/Button";

export default function HeroSection() {
  return (
    <section style={{ backgroundColor: "var(--color-bg-page)", minHeight: "100vh", display: "flex", alignItems: "center", marginTop: -100 }}>
      <div className="max-w-[1200px] mx-auto px-6 py-12 w-full">
        <div className="flex flex-col lg:flex-row items-center" style={{ gap: "48px" }}>
          {/* Left: Illustration - visual_wrapper */}
          <div className="flex-shrink-0 w-full lg:w-1/2" style={{ position: "relative", height: "clamp(350px, 80vh, 500px)" }}>
            <Image
              src="/assets/visuals/animalVisual.svg?v=13"
              alt="Unser Newsletter"
              fill
              className="dark:opacity-30"
              style={{ objectFit: "contain", objectPosition: "right center" }}
              priority
            />
          </div>

          {/* Right: Content - hero_text */}
          <div className="w-full lg:w-1/2" style={{ maxWidth: "442px" }}>
            {/* H2 - Merriweather Black, 54px, line-height 1.05 */}
            <h2
              style={{
                color: "var(--color-text-primary)",
                fontFamily: "'Merriweather', serif",
                fontSize: "54px",
                fontWeight: 900,
                lineHeight: "1.05",
                margin: "0 0 15px 0",
                letterSpacing: "-0.5px",
              }}
            >
              <p style={{ margin: "0 0 0 0", color: "var(--color-text-primary)" }}>Unser</p>
              <p style={{ margin: "0 0 0 0", color: "var(--color-text-primary)" }}>Newsletter</p>
            </h2>

            {/* p_serif - Merriweather Bold, 21px, line-height 1.38 */}
            <div
              style={{
                fontFamily: "Merriweather, serif",
                fontSize: "21px",
                fontWeight: "700",
                lineHeight: "1.38",
                color: "var(--color-text-primary)",
                marginBottom: "15px",
              }}
            >
              <span style={{ color: "var(--color-text-primary)" }}>Bleiben Sie mit dem </span>
              <span style={{ color: "#45a117" }}>finanzleser.de</span>
              <span style={{ color: "var(--color-text-primary)" }}> Newsletter immer auf dem neusten Stand.</span>
            </div>

            {/* button_wrapper with button_switchy - 50px height */}
            <div style={{ paddingTop: "5px" }}>
              <Button label="Kostenlos abonnieren" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
