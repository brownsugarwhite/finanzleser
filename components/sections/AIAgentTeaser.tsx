import Link from "next/link";

export default function AIAgentTeaser() {
  return (
    <section
      style={{
        minHeight: '600px',
        width: '100%',
        background: 'linear-gradient(to bottom right, rgba(10, 197, 144, 0.9) 0%, rgba(111, 230, 123, 0.9) 100%)',
        opacity: 0.95,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ maxWidth: '1280px', width: '100%', padding: '0 24px', textAlign: 'center' }}>
        <h2 style={{
          fontFamily: 'Merriweather, serif',
          fontWeight: 700,
          fontSize: '42px',
          lineHeight: 1.2,
          color: '#ffffff',
          marginBottom: '16px',
        }}>
          KI-Agent
        </h2>
        <p style={{
          fontFamily: 'Open Sans, sans-serif',
          fontSize: '18px',
          lineHeight: 1.6,
          color: 'rgba(255, 255, 255, 0.9)',
          maxWidth: '600px',
          margin: '0 auto 32px',
        }}>
          Deine intelligente Finanzassistentin – Fragen beantworten, Konzepte erklären, Tipps geben.
        </p>
        <Link
          href="#ai-agent"
          style={{
            display: 'inline-block',
            padding: '14px 32px',
            backgroundColor: '#ffffff',
            color: 'var(--color-text-primary)',
            fontFamily: 'Open Sans, sans-serif',
            fontWeight: 600,
            fontSize: '17px',
            borderRadius: '15px',
            textDecoration: 'none',
            transition: 'opacity 0.2s',
          }}
        >
          Jetzt chatten
        </Link>
      </div>
    </section>
  );
}
