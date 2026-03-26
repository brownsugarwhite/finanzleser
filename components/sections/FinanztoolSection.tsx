export default function FinanztoolSection() {
  return (
    <section
      style={{
        width: "100%",
        maxWidth: 1200,
        margin: "0 auto",
        padding: "0 clamp(20px, 4vw, 40px)",
      }}
    >
      <div style={{ display: "flex", gap: 24, marginTop: "-100vh" }}>
        {/* Finanztool Wrapper */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Heading */}
          <div style={{ marginTop: "100vh" }}>
            <p
              style={{
                fontFamily: "var(--font-heading, 'Merriweather', serif)",
                fontStyle: "italic",
                fontWeight: 300,
                fontSize: 21,
                lineHeight: 1.38,
                color: "var(--color-text-medium)",
                margin: 0,
              }}
            >
              Die Finanztools
            </p>
            <p
              style={{
                fontFamily: "var(--font-heading, 'Merriweather', serif)",
                fontWeight: 900,
                fontSize: 40,
                lineHeight: 1.3,
                color: "var(--color-text-primary)",
                margin: 0,
                whiteSpace: "nowrap",
              }}
            >
              Alles in eigener Hand
            </p>
          </div>

          {/* Lottie Wrapper (Platzhalter) */}
          <div
            style={{
              minHeight: 600,
              width: "100%",
              marginTop: 24,
              background: "var(--color-bg-subtle)",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-text-medium)",
              fontSize: 14,
            }}
          >
            Lottie Animation Platzhalter
          </div>

          {/* Finanztool Slider */}
          <div
            style={{
              position: "sticky",
              bottom: 0,
              display: "flex",
              gap: 5,
              paddingTop: 23,
              paddingBottom: 23,
            }}
          >
            {[1, 2, 3].map((i, idx) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, flex: 1 }}>
                {idx > 0 && (
                  <svg width="12" height="12" viewBox="0 0 12 12.0005" fill="none" aria-hidden style={{ flexShrink: 0 }}>
                    <path d="M12 6.00047C10.3384 5.64978 8.28716 5.41362 7.24241 3.91374C6.47491 2.81169 6.27276 1.28871 6.00024 0.000471365C5.61861 1.71435 5.40087 3.79684 3.79407 4.83384C2.69548 5.54325 1.25351 5.72142 0 6.01226C1.28705 6.29225 2.79561 6.48692 3.89751 7.25194C5.4174 8.30686 5.61672 10.3366 6.00024 12.0005C6.17594 11.1204 6.33322 10.2272 6.62463 9.37638C7.27878 7.46453 8.37832 6.85223 10.2643 6.37379L12 6.00047Z" fill="var(--fill-0, #334A27)"/>
                  </svg>
                )}
                <div
                  style={{
                    flex: 1,
                    height: 120,
                    borderRadius: 12,
                    background: "var(--color-bg-subtle)",
                    border: "1px solid var(--color-border-default)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-text-medium)",
                    fontSize: 14,
                  }}
                >
                  Tool {i}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preview Wrapper */}
        <div
          style={{
            width: 300,
            flexShrink: 0,
          }}
        />
      </div>
    </section>
  );
}
