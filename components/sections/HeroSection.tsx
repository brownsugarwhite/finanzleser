"use client";
import Image from "next/image";
import { Merriweather } from "next/font/google";

const imgButtonIcon = "https://www.figma.com/api/mcp/asset/c1f35fec-f90b-4d4c-a280-e101e7eb02f6";

const merriweather = Merriweather({
  weight: ["700", "900"],
  subsets: ["latin"],
});

export default function HeroSection() {
  return (
    <>
      <style>{`
        .hero-section {
          display: flex;
          flex-direction: column;
          gap: 36px;
          align-items: center;
          justify-content: center;
          position: relative;
          width: 100%;
        }
        @media (min-width: 570px) {
          .hero-section {
            gap: 0;
          }
        }
        .hero-visual {
          width: 100%;
          max-width: none;
          height: 50vw;
          min-height: 300px
          aspect-ratio: 4 / 3;
        }
        @media (min-width: 570px) {
          .hero-visual {
            height: 50vw;
            max-height: 400px
            aspect-ratio: auto;
          }
        }
        @media (min-width: 861px) {
          .hero-section {
            flex-direction: row;
            gap: 36px;
          }
          .hero-visual {
            max-width: 500px;
            height: 400px;
            aspect-ratio: 4 / 3;
          }
        }
      `}</style>
      <div className="hero-section">
      {/* Left: Visual Placeholder */}
      <div className="hero-visual" style={{
        backgroundColor: "#d9d9d9",
        flexShrink: 0,
      }} />

      {/* Right: Content */}
      <div className="hero-content" style={{
        flex: "1 0 0",
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
      }}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          height: "100%",
          alignItems: "flex-start",
          justifyContent: "center",
        }}>
          {/* Text Content */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: 15,
            alignItems: "flex-start",
            width: "100%",
            marginBottom: 20,
          }}>
            {/* Heading */}
            <h1 style={{
              fontFamily: merriweather.style.fontFamily,
              fontSize: "clamp(42px, 6vw, 54px)",
              fontWeight: 900,
              lineHeight: 1.05,
              color: "#334a27",
              margin: 0,
              width: "100%",
            }}>
              Unser<br />Newsletter
            </h1>

            {/* Description */}
            <p style={{
              fontFamily: merriweather.style.fontFamily,
              fontSize: 18,
              fontWeight: 700,
              lineHeight: 1.38,
              color: "#334a27",
              margin: 0,
              width: "100%",
            }}>
              Bleiben Sie mit dem{" "}
              <span style={{ color: "#45a117" }}>finanzleser.de</span>
              <br />
              Newsletter immer auf dem neusten Stand.
            </p>

            {/* Button */}
            <button style={{
              display: "flex",
              alignItems: "center",
              gap: 15,
              paddingLeft: 20,
              paddingRight: 5,
              paddingTop: 5,
              paddingBottom: 5,
              borderRadius: 19,
              background: "rgba(198, 200, 204, 0.23)",
              border: "none",
              cursor: "pointer",
              fontFamily: "'Open Sans', sans-serif",
              fontSize: 17,
              color: "#686c6a",
              whiteSpace: "nowrap",
            }}>
              Kostenlos abonnieren
              <div style={{
                width: 40,
                height: 40,
                position: "relative",
                flexShrink: 0,
              }}>
                <img
                  src={imgButtonIcon}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                  }}
                />
              </div>
            </button>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
