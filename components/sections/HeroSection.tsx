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
              src="/assets/newsletter-illustration.svg"
              alt="Das digitale Finanzmagazin"
              width={600}
              height={500}
              className="w-full h-auto"
              priority
            />
          </div>

          {/* Right: Content - hero_text */}
          <div className="w-full lg:w-1/2" style={{ maxWidth: "442px" }}>
            {/* H1_big - Merriweather Black, 54px, line-height 1.05 */}
            <h1
              className="mb-6"
              style={{
                color: "#334a27",
                fontFamily: "Merriweather, serif",
                fontSize: "54px",
                fontWeight: "900",
                lineHeight: "1.05",
                margin: "0 0 24px 0",
              }}
            >
              <p style={{ margin: "0 0 0 0" }}>Das</p>
              <p style={{ margin: "0 0 0 0" }}>digitale</p>
              <p style={{ margin: "0 0 0 0" }}>Finanzmagazin</p>
            </h1>

            {/* p_serif - Merriweather Bold, 21px, line-height 1.38 */}
            <div
              style={{
                fontFamily: "Merriweather, serif",
                fontSize: "21px",
                fontWeight: "700",
                lineHeight: "1.38",
                color: "#334a27",
                marginBottom: "32px",
              }}
            >
              <span>Bleiben Sie mit dem </span>
              <span style={{ color: "#45a117" }}>finanzleser.de</span>
              <span> Newsletter immer auf dem neusten Stand.</span>
            </div>

            {/* button_wrapper with button_switchy */}
            <div style={{ paddingTop: "5px" }}>
              <button
                style={{
                  backgroundColor: "rgba(129, 129, 129, 0.12)",
                  borderRadius: "20px",
                  paddingLeft: "20px",
                  paddingRight: "6px",
                  paddingTop: "6px",
                  paddingBottom: "6px",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "15px",
                }}
              >
                <div
                  style={{
                    fontFamily: "Open Sans, sans-serif",
                    fontSize: "17px",
                    color: "#636a5f",
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
