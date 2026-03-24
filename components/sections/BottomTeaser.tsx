import Link from "next/link";

export default function BottomTeaser() {
  return (
    <div className="bg-white">
      {/* KI-Agent Teaser */}
      <section className="max-w-7xl mx-auto px-6 py-16 border-b border-gray-200">
        <div className="max-w-2xl">
          <span className="inline-block text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">
            KI-Agent
          </span>
          <h2 className="text-3xl font-bold mb-4">Finanziale - Dein intelligenter Finanzberater</h2>
          <p className="text-lg text-gray-600 mb-6">
            Stelle deine Fragen zu Steuern, Versicherungen und Finanzen. Unser KI-Agent antwortet basierend auf aktuellen Daten und Fachinformationen.
          </p>
          <Link
            href="/ki-agent"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded hover:bg-blue-800 transition"
          >
            Jetzt probieren →
          </Link>
        </div>
      </section>

      {/* Newsletter Teaser */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="max-w-2xl">
          <span className="inline-block text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">
            Newsletter
          </span>
          <h2 className="text-3xl font-bold mb-4">Bleiben Sie auf dem Laufenden</h2>
          <p className="text-lg text-gray-600 mb-6">
            Erhalten Sie wöchentliche Tipps zu Steuern, Versicherungen und Finanzen direkt in Ihren Posteingang.
          </p>
          <form className="flex gap-2 max-w-sm">
            <input
              type="email"
              placeholder="Ihre E-Mail-Adresse"
              className="flex-1 px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded hover:bg-blue-800 transition"
            >
              Anmelden
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
