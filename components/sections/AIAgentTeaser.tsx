import Link from "next/link";

export default function AIAgentTeaser() {
  return (
    <section className="py-16 bg-gradient-to-r from-blue-50 to-blue-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            KI-Agent
          </h2>
          <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
            Deine intelligente Finanzassistentin – Fragen beantworten, Konzepte erklären, Tipps geben.
          </p>
          <Link
            href="#ai-agent"
            className="inline-block px-8 py-3 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition"
          >
            Jetzt chatten
          </Link>
        </div>
      </div>
    </section>
  );
}
