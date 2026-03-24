import Image from "next/image";
import Link from "next/link";

export default function NewsletterHero() {
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
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ color: "var(--color-text-primary)" }}
            >
              Das digitale Finanzmagazin
            </h2>

            <p
              className="text-lg mb-6"
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
            <Link
              href="#newsletter-signup"
              className="inline-flex items-center gap-3 px-6 py-3 rounded font-semibold transition"
              style={{ backgroundColor: "#E8E8E8", color: "var(--color-text-primary)" }}
            >
              Kostenlos abonnieren
              {/* Arrow Icon */}
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
