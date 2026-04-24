import Image from "next/image";

function ChatBubble({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "relative",
        display: "inline-block",
        maxWidth: "400px",
        background: "#CFFFE3",
        borderRadius: "27px",
        padding: "23px 27px",
        fontFamily: "var(--font-body)",
        fontSize: "17px",
        lineHeight: 1.35,
        color: "#636A5F",
      }}
    >
      {children}
      <img
        src="/assets/bubbleSpike.svg"
        alt=""
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-6px",
          bottom: "-0.24px",
          width: "19.142px",
          height: "23.244px",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

export default function AIAgentTeaser() {
  return (
    <section
      className="ai-agent-teaser"
      style={{
        position: "relative",
        width: "100%",
        padding: "96px 24px",
        overflow: "hidden",
        background:
          "linear-gradient(to bottom right, rgba(10, 197, 144, 0.9) 0%, rgba(111, 230, 123, 0.9) 100%)",
        opacity: 0.95,
      }}
    >
      <div
        className="ai-agent-leo"
        style={{
          position: "absolute",
          top: "50%",
          transform: "translateY(-50%)",
          left: "calc(50% - 350px - 220px)",
          width: "183px",
          height: "189px",
          pointerEvents: "none",
        }}
      >
        <Image
          src="/assets/leo.svg"
          alt="Leo – KI-Finanzagent"
          width={183}
          height={189}
          priority={false}
        />
      </div>

      <div
        style={{
          maxWidth: "700px",
          width: "100%",
          margin: "0 auto",
          textAlign: "left",
          position: "relative",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "19px",
            fontWeight: 650,
            lineHeight: 1.2,
            color: "#ffffff",
            margin: 0,
            marginBottom: "2px",
          }}
        >
          Ihr Beratungsagent
        </h2>

        <p
          style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 800,
            fontSize: "clamp(32px, 5vw, 42px)",
            lineHeight: 1.1,
            color: "#ffffff",
            margin: 0,
            marginBottom: "32px",
          }}
        >
          Klare Antworten
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "23px",
            alignItems: "flex-start",
          }}
        >
          <ChatBubble>
            Hallo ich bin Leo,
            <br />
            Ihr persönlicher Finanzagent
          </ChatBubble>
          <ChatBubble>
            Ich analysiere tausende Versicherungs- und Finanzdokumente und bereite die Inhalte klar und verständlich für Sie auf.{" "}
            <span style={{ fontSize: "1.4em", letterSpacing: "0.15em", whiteSpace: "nowrap", verticalAlign: "-0.1em" }}>
              🔍🧠
            </span>
          </ChatBubble>
          <ChatBubble>Wie kann ich helfen?</ChatBubble>
        </div>
      </div>

      <style>{`
        @media (max-width: 1100px) {
          .ai-agent-leo { display: none; }
        }
      `}</style>
    </section>
  );
}
