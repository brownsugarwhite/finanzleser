import Link from "next/link";
import Footer from "./Footer";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { splitAnbieterTitle } from "@/lib/anbieter-utils";
import type { AnbieterPost } from "@/lib/types";

type AnbieterListLayoutProps = {
  anbieter: AnbieterPost[];
};

export default function AnbieterListLayout({ anbieter }: AnbieterListLayoutProps) {
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Anbieter", href: "#" },
  ];

  // Anzeige-Namen vorab berechnen, damit Gruppierung + Sortierung konsistent sind.
  const items = anbieter.map((a) => ({ ...a, displayName: splitAnbieterTitle(a.title).name }));

  const umlautMap: Record<string, string> = { "Ä": "A", "Ö": "O", "Ü": "U" };
  const grouped = new Map<string, typeof items>();
  for (const a of items) {
    const first = (a.displayName[0] || "#").toUpperCase();
    const key = umlautMap[first] || (/[A-Z]/.test(first) ? first : "#");
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(a);
  }
  const letters = Array.from(grouped.keys()).sort();

  return (
    <>
      <main className="min-h-screen bg-white">
        <div style={{ maxWidth: 1200 }} className="mx-auto px-6 pb-12">
          <Breadcrumb items={breadcrumbItems} />

          <h1 className="font-bold mb-4" style={{ fontSize: "42px", lineHeight: "1.3em" }}>
            Anbieter
          </h1>
          <p className="mb-10 text-gray-600" style={{ fontFamily: "Merriweather, serif", fontSize: "18px" }}>
            Kontaktdaten von {anbieter.length} Versicherern und Finanzanbietern auf einen Blick.
          </p>

          {letters.map((letter) => (
            <section key={letter} className="mb-10">
              <h2 className="font-bold mb-4" style={{ fontSize: "24px", color: "var(--color-brand-secondary)" }}>
                {letter}
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-6">
                {grouped.get(letter)!.map((a) => (
                  <li key={a.slug}>
                    <Link
                      href={`/${a.slug}/`}
                      className="inline-block hover:opacity-80 transition"
                      style={{ color: "var(--color-text-dark)" }}
                    >
                      {a.displayName}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
