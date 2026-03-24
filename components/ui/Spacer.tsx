export default function Spacer() {
  return (
    <div
      className="spacer"
      style={{
        position: "relative",
        zIndex: 60,
        maxWidth: "1100px",
        margin: "40px auto",
        padding: "0 clamp(20px, 4vw, 40px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <svg
          style={{ flex: 1, height: "1px" }}
          viewBox="0 0 100 1"
          preserveAspectRatio="none"
        >
          <line
            x1="0"
            y1="0.5"
            x2="100"
            y2="0.5"
            stroke="rgba(129, 129, 129, 0.3)"
            strokeWidth="1"
            strokeDasharray="3,3"
            strokeLinecap="round"
          />
        </svg>
        <svg
          width="23"
          height="15"
          viewBox="0 0 23 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ flexShrink: 0 }}
        >
          <g>
            <path d="M12.5468 0.384615H10.5002V14.6583H12.5468V0.384615Z" fill="var(--color-brand)" />
            <path d="M6.3455 3.14844C4.88065 1.66561 3.77149 0 3.77149 0H0V0.766052C0 0.766052 0.792377 2.34584 3.1452 4.72823C4.48447 6.08392 5.77431 7.04307 6.43381 7.5C5.77431 7.95693 4.48447 8.91608 3.1452 10.2718C0.792377 12.6542 0 14.2339 0 14.2339V15H3.77149C3.77149 15 4.88065 13.3344 6.3455 11.8516C7.84275 10.3361 9.35378 9.37699 9.35378 9.37699V5.6246C9.35378 5.6246 7.84275 4.66545 6.3455 3.15003V3.14844Z" fill="var(--color-brand)" />
            <path d="M16.6537 3.14844C18.1193 1.66561 19.2285 0 19.2285 0H23V0.766052C23 0.766052 22.2076 2.34584 19.8548 4.72823C18.5155 6.08392 17.2257 7.04307 16.5662 7.5C17.2257 7.95693 18.5155 8.91608 19.8548 10.2718C22.2084 12.6542 23 14.2339 23 14.2339V15H19.2285C19.2285 15 18.1193 13.3344 16.6545 11.8516C15.1573 10.3361 13.6462 9.37699 13.6462 9.37699V8.2438V6.75779V5.6246C13.6462 5.6246 15.1573 4.66545 16.6545 3.15003L16.6537 3.14844Z" fill="var(--color-brand)" />
          </g>
        </svg>
        <svg
          style={{ flex: 1, height: "1px" }}
          viewBox="0 0 100 1"
          preserveAspectRatio="none"
        >
          <line
            x1="0"
            y1="0.5"
            x2="100"
            y2="0.5"
            stroke="rgba(129, 129, 129, 0.3)"
            strokeWidth="1"
            strokeDasharray="3,3"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}
