export default function Home() {
  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)" }}
    >
      <div className="text-center px-6">

        {/* Logo / Titel */}
        <h1
          className="text-5xl font-bold mb-3"
          style={{ fontFamily: "var(--font-heading)", color: "#fff" }}
        >
          finanzleser<span style={{ color: "var(--color-brand)" }}>.de</span>
        </h1>
        <p
          className="text-lg mb-12"
          style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.6)" }}
        >
          Steuern · Finanzen · Versicherungen
        </p>

        {/* Glassmorphism Cards – Funktionstest */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <div className="glass-card rounded-2xl p-6 text-left w-64">
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
              glass-card
            </p>
            <p className="text-white font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
              Outfit Heading
            </p>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-body)" }}>
              Inter Body Text
            </p>
          </div>

          <div className="glass-brand rounded-2xl p-6 text-left w-64">
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
              glass-brand
            </p>
            <p className="text-white font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
              Outfit Heading
            </p>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-body)" }}>
              Inter Body Text
            </p>
          </div>

          <div className="glass-dark rounded-2xl p-6 text-left w-64">
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
              glass-dark
            </p>
            <p className="text-white font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
              Outfit Heading
            </p>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-body)" }}>
              Inter Body Text
            </p>
          </div>
        </div>

        <p className="mt-10 text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
          Platzhalter · Design kommt aus Figma
        </p>
      </div>
    </main>
  );
}
