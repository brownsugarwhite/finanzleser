import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="py-16 md:py-24" style={{ backgroundColor: "var(--color-bg-page)" }}>
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center gap-12">
          {/* Left: Large Button with Arrow */}
          <div className="flex-shrink-0 w-full md:w-1/2 flex justify-center md:justify-start">
            <button
              className="w-64 h-64 rounded-3xl flex items-center justify-center transition hover:opacity-90"
              style={{ backgroundColor: "var(--color-brand)" }}
              aria-label="Zum Newsletter anmelden"
            >
              {/* Arrow Icon */}
              <svg
                className="w-24 h-24"
                fill="none"
                stroke="white"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Right: Content */}
          <div className="w-full md:w-1/2">
            <h2
              className="text-4xl md:text-5xl font-bold mb-6 leading-tight"
              style={{ color: "var(--color-text-primary)" }}
            >
              Das digitale
              <br />
              Finanzmagazin
            </h2>

            <p
              className="text-base md:text-lg mb-8 leading-relaxed"
              style={{ color: "var(--color-text-primary)" }}
            >
              Bleiben Sie mit dem{" "}
              <span style={{ color: "var(--color-brand)" }} className="font-semibold">
                finanzleser.de
              </span>
              {" "}
              Newsletter immer auf dem neusten Stand.
            </p>

            {/* CTA Text Link */}
            <Link
              href="#newsletter-signup"
              className="inline-flex items-center gap-2 font-semibold transition"
              style={{ color: "var(--color-brand)" }}
            >
              Kostenlos abonnieren
              {/* Small Arrow */}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
