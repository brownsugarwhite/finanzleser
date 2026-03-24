import Image from "next/image";

const imgButtonSwitchy = "https://www.figma.com/api/mcp/asset/14cc73d8-b8c8-4dbf-b792-e69885b554bd";

export default function HeroSection() {
  return (
    <section style={{ backgroundColor: "var(--color-bg-page)" }}>
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row items-center" style={{ gap: "48px" }}>
          {/* Left: Illustration - visual_wrapper */}
          <div className="flex-shrink-0 w-full lg:w-1/2">
            <Image
              src="/assets/visuals/animalVisual.svg?v=13"
              alt="Unser Newsletter"
              width={600}
              height={500}
              className="w-full h-auto dark:opacity-30"
              priority
            />
          </div>

          {/* Right: Content - hero_text */}
          <div className="w-full lg:w-1/2" style={{ maxWidth: "442px" }}>
            {/* H2 - Merriweather Black, 54px, line-height 1.05 */}
            <h2
              style={{
                color: "var(--color-text-medium)",
                fontFamily: "'Merriweather', serif",
                fontSize: "54px",
                fontWeight: 900,
                lineHeight: "1.05",
                margin: "0 0 15px 0",
                letterSpacing: "-0.5px",
              }}
            >
              <p style={{ margin: "0 0 0 0" }}>Unser</p>
              <p style={{ margin: "0 0 0 0" }}>Newsletter</p>
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
              <button
                style={{
                  backgroundColor: "rgba(198, 200, 204, 0.23)",
                  borderRadius: "19px",
                  paddingLeft: "20px",
                  paddingRight: "5px",
                  paddingTop: "5px",
                  paddingBottom: "5px",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "15px",
                  height: "50px",
                }}
              >
                <div
                  style={{
                    fontFamily: "Open Sans, sans-serif",
                    fontSize: "17px",
                    color: "var(--color-text-primary)",
                    fontWeight: "400",
                    lineHeight: "40px",
                    whiteSpace: "nowrap",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    margin: "0",
                  }}
                >
                  <p style={{ margin: "0", padding: "0" }}>Kostenlos abonnieren</p>
                </div>
                <div
                  style={{
                    position: "relative",
                    width: "40px",
                    height: "40px",
                    flexShrink: 0,
                  }}
                >
                  <img
                    alt="Arrow"
                    src={imgButtonSwitchy}
                    style={{
                      position: "absolute",
                      display: "block",
                      width: "100%",
                      height: "100%",
                      maxWidth: "none",
                    }}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
