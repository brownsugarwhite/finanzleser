import Image from "next/image";

const imgButtonIcon = "https://www.figma.com/api/mcp/asset/1fd08e07-983b-47fd-9051-123478fe6f83";

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
            {/* H1_big */}
            <h1
              className="mb-6 font-bold leading-tight"
              style={{
                color: "var(--color-text-primary)",
                fontFamily: "Merriweather, serif",
                fontSize: "48px",
                lineHeight: "1.2",
              }}
            >
              Das<br />
              digitale<br />
              Finanzmagazin
            </h1>

            {/* p_serif */}
            <p
              className="mb-8 leading-relaxed"
              style={{
                color: "var(--color-text-primary)",
                fontFamily: "Merriweather, serif",
                fontSize: "18px",
                lineHeight: "1.5",
              }}
            >
              Bleiben Sie mit dem{" "}
              <span style={{ color: "var(--color-brand)" }} className="font-semibold">
                finanzleser.de
              </span>
              {" "}
              Newsletter immer auf dem neusten Stand.
            </p>

            {/* button_wrapper with button_switchy */}
            <div style={{ paddingTop: "5px" }}>
              <button
                className="inline-flex items-center transition hover:opacity-90"
                style={{
                  backgroundColor: "rgba(129, 129, 129, 0.12)",
                  borderRadius: "20px",
                  paddingLeft: "20px",
                  paddingRight: "6px",
                  paddingTop: "6px",
                  paddingBottom: "6px",
                  gap: "15px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    fontFamily: "Open Sans, sans-serif",
                    fontSize: "17px",
                    color: "#636a5f",
                    fontWeight: "400",
                    lineHeight: "40px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Kostenlos abonnieren
                </span>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    flexShrink: 0,
                    backgroundColor: "var(--color-brand)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={imgButtonIcon}
                    alt="Arrow"
                    style={{ width: "20px", height: "20px" }}
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
