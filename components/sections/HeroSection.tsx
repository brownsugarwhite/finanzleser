import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="py-16 md:py-24" style={{ backgroundColor: "var(--color-bg-page)" }}>
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center gap-12">
          {/* Left: Illustration */}
          <div className="flex-shrink-0 w-full md:w-1/2">
            <Image
              src="/assets/newsletter-illustration.svg"
              alt="Das digitale Finanzmagazin"
              width={400}
              height={350}
              className="w-full h-auto"
              priority
            />
          </div>

          {/* Right: Content */}
          <div className="w-full md:w-1/2">
            <h2
              className="text-4xl md:text-5xl font-bold mb-6 leading-tight"
              style={{ color: "var(--color-text-primary)" }}
            >
              Das
              <br />
              digitale
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

            {/* CTA Button */}
            <button
              className="inline-flex items-center gap-3 px-6 py-3 rounded font-semibold transition hover:opacity-90"
              style={{ backgroundColor: "var(--color-brand)", color: "white" }}
            >
              Kostenlos abonnieren
              {/* Arrow Icon */}
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
