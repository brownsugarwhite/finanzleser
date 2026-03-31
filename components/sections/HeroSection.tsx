"use client";

import { useState } from "react";
import Image from "next/image";
import InlineSVG from "@/components/ui/InlineSVG";
import type { Post } from "@/lib/types";

const Spark = () => (
  <svg width="12" height="12" viewBox="0 0 12 12.0005" fill="none" aria-hidden style={{ display: "block" }}>
    <path d="M12 6.00047C10.3384 5.64978 8.28716 5.41362 7.24241 3.91374C6.47491 2.81169 6.27276 1.28871 6.00024 0.000471365C5.61861 1.71435 5.40087 3.79684 3.79407 4.83384C2.69548 5.54325 1.25351 5.72142 0 6.01226C1.28705 6.29225 2.79561 6.48692 3.89751 7.25194C5.4174 8.30686 5.61672 10.3366 6.00024 12.0005C6.17594 11.1204 6.33322 10.2272 6.62463 9.37638C7.27878 7.46453 8.37832 6.85223 10.2643 6.37379L12 6.00047Z" fill="var(--fill-0, #334A27)" />
  </svg>
);

function MiniCard({ title, desc }: { title: string; desc: string }) {
  const [infoHovered, setInfoHovered] = useState(false);
  return (
    <div style={{
      width: "100%",
      maxWidth: 200,
      background: "rgba(181, 181, 181, 0.10)",
      borderRadius: 30,
      padding: 15,
      display: "flex",
      flexDirection: "column",
      gap: 10,
      overflow: "hidden",
    }}>
      <p lang="de" style={{
        fontFamily: "var(--font-body, 'Open Sans', sans-serif)",
        fontWeight: 600,
        fontSize: 17,
        lineHeight: 1.3,
        color: "var(--color-text-primary)",
        margin: 0,
        hyphens: "auto",
        WebkitHyphens: "auto",
      }}>
        {title}
      </p>
      <p style={{
        fontFamily: "var(--font-body, 'Open Sans', sans-serif)",
        fontWeight: 400,
        fontSize: 15,
        lineHeight: 1.3,
        color: "var(--color-text-medium)",
        margin: 0,
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }}>
        {desc}
      </p>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
      }}>
        <div
          onMouseEnter={() => setInfoHovered(true)}
          onMouseLeave={() => setInfoHovered(false)}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: infoHovered ? "none" : "1px solid var(--color-text-primary)",
            background: infoHovered ? "var(--color-text-primary)" : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            transition: "background 0.1s, border 0.1s",
            ["--fill-0" as string]: infoHovered ? "#ffffff" : "var(--color-text-primary)",
          }}>
          <InlineSVG
            src="/icons/info_i.svg"
            alt="Info"
            style={{ width: 9, height: 17 }}
          />
        </div>
        <div style={{
          width: 51,
          height: 42,
          borderRadius: 18,
          background: "rgba(198, 200, 204, 0.23)",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          paddingRight: 5,
          cursor: "pointer",
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 14,
            backgroundColor: "var(--color-brand)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            paddingLeft: 1,
          }}>
            <svg width="11" height="15" viewBox="0 0 11 15" fill="none">
              <path d="M1.5 1.50009L9.5 7.50009L1.5 13.5001" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

interface HeroSectionProps {
  posts?: Post[];
}

export default function HeroSection({ posts = [] }: HeroSectionProps) {
  return (
    <section
      style={{
        backgroundColor: "var(--color-bg-page)",
      }}
    >
      <div className="max-w-[1200px] mx-auto px-6 py-12 w-full">
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "40px",
          }}
        >
          {/* Left: Heading + Subline */}
          <div style={{ flexShrink: 0, width: "min-content" }}>
            <h2
              style={{
                color: "var(--color-text-primary)",
                fontFamily: "'Merriweather', serif",
                fontSize: "54px",
                fontWeight: 900,
                lineHeight: "1.05",
                margin: "0 0 15px 0",
                letterSpacing: "-0.5px",
                whiteSpace: "nowrap",
                textAlign: "right",
              }}
            >
              <span style={{ display: "block", color: "var(--color-text-primary)" }}>Unsere</span>
              <span style={{ display: "block", color: "var(--color-text-primary)" }}>Finanztools</span>
            </h2>

            <p
              style={{
                fontFamily: "'Merriweather', serif",
                fontSize: "18px",
                fontWeight: 500,
                lineHeight: "1.45",
                color: "var(--color-text-medium)",
                textAlign: "right",
                width: "380px",
                marginLeft: "auto",
              }}
            >
              Mit den neu überarbeiteten Finanztools haben Sie die volle Kontrolle über Ihre Finanzen!
            </p>
          </div>

          {/* Center: Visual */}
          <div style={{ flex: 1, minWidth: "500px", position: "relative", height: "clamp(350px, 60vh, 500px)" }}>
            <Image
              src="/assets/visuals/animalVisual.svg?v=13"
              alt="Finanztools"
              fill
              className="dark:opacity-30"
              style={{ objectFit: "contain", objectPosition: "center" }}
              priority
            />
          </div>

          {/* Right: Neuste Beiträge */}
          <div
            style={{
              flexShrink: 0,
              width: 220,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 0,
            }}
          >
            <p style={{
              fontFamily: "Merriweather, serif",
              fontWeight: 700,
              fontSize: 22,
              lineHeight: 1.3,
              color: "var(--color-text-primary)",
              margin: "0 0 20px 0",
              textAlign: "right",
            }}>
              Neuste<br />Beiträge
            </p>

            {posts.map((post, idx) => (
              <div key={post.id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                {idx > 0 && (
                  <div style={{ padding: "10px 0" }}>
                    <Spark />
                  </div>
                )}
                <MiniCard
                  title={post.title}
                  desc={post.excerpt?.replace(/<[^>]*>/g, "") || ""}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
