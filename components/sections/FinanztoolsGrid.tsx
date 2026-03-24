import Link from "next/link";
import type { ToolCategory } from "@/lib/wordpress";

interface FinanztoolsGridProps {
  categories: ToolCategory[];
}

const CATEGORY_DETAILS: Record<
  string,
  { description: string; icon: string }
> = {
  Rechner: {
    description: "Interaktive Rechner für Finanzen, Steuern und Versicherungen",
    icon: "🧮",
  },
  Checklisten: {
    description: "Praktische Checklisten für wichtige finanzielle Entscheidungen",
    icon: "✓",
  },
  Vergleiche: {
    description: "Vergleichstabellen für Angebote und Leistungen",
    icon: "⚖️",
  },
};

export default function FinanztoolsGrid({ categories }: FinanztoolsGridProps) {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((category) => {
            const details = CATEGORY_DETAILS[category.label] || {
              description: "",
              icon: "📋",
            };
            return (
              <Link
                key={category.href}
                href={category.href}
                className="group p-8 border border-gray-200 rounded-lg hover:shadow-lg hover:border-blue-300 transition"
              >
                <div className="text-4xl mb-4">{details.icon}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition">
                  {category.label}
                </h3>
                <p className="text-gray-700 mb-4">{details.description}</p>
                <p className="text-sm text-gray-500">
                  {category.count} {category.count === 1 ? "Eintrag" : "Einträge"}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
