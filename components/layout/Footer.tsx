import Link from "next/link";
import { getToolCategories } from "@/lib/wordpress";
import NewsletterBanner from "@/components/sections/NewsletterBanner";
import AIAgentTeaser from "@/components/sections/AIAgentTeaser";

export default async function Footer({ hideNewsletter = false }: { hideNewsletter?: boolean } = {}) {
  // Hauptkategorien (hardcoded)
  const mainCategories = [
    { name: "Finanzen", slug: "finanzen" },
    { name: "Versicherungen", slug: "versicherungen" },
    { name: "Steuern", slug: "steuern" },
    { name: "Recht", slug: "recht" },
  ];

  const toolCategories = await getToolCategories();

  // Vertrauens-Badges (statisch, Struktur zum Stylen)
  const badges = [
    { label: "Trusted by", icon: "🛡️" },
    { label: "Certified", icon: "✓" },
    { label: "Verified", icon: "⭐" },
  ];

  // Rechtliche Links (statisch)
  const legalLinks = [
    { label: "Impressum", href: "/impressum" },
    { label: "Datenschutz", href: "/datenschutz" },
    { label: "AGB", href: "/agb" },
    { label: "Kontakt", href: "/kontakt" },
  ];

  return (
    <>
      {!hideNewsletter && <NewsletterBanner />}
      <AIAgentTeaser />
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

          {/* Column 1: Hauptkategorien */}
          <div className="footer-column footer-categories">
            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
              Kategorien
            </h3>
            <ul className="space-y-2">
              {mainCategories.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/${category.slug}`}
                    className="text-sm text-gray-600 hover:text-blue-600 transition"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Finanztools */}
          <div className="footer-column footer-tools">
            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
              Finanztools
            </h3>
            <ul className="space-y-2">
              {toolCategories.map((tool) => (
                <li key={tool.href}>
                  <Link
                    href={tool.href}
                    className="text-sm text-gray-600 hover:text-blue-600 transition"
                  >
                    {tool.label} ({tool.count})
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Über uns & Links */}
          <div className="footer-column footer-about">
            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
              Über Uns
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/uber-uns"
                  className="text-sm text-gray-600 hover:text-blue-600 transition"
                >
                  Über finanzleser
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-sm text-gray-600 hover:text-blue-600 transition"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/kontakt"
                  className="text-sm text-gray-600 hover:text-blue-600 transition"
                >
                  Kontakt
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Vertrauens-Badges */}
          <div className="footer-column footer-badges">
            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
              Vertrauenszeichen
            </h3>
            <ul className="space-y-3">
              {badges.map((badge) => (
                <li key={badge.label} className="footer-badge flex items-center gap-2">
                  <span className="text-lg">{badge.icon}</span>
                  <span className="text-xs text-gray-600">{badge.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 pt-8 pb-6">
          {/* Legal Links */}
          <div className="footer-legal mb-6">
            <ul className="flex flex-wrap gap-4 justify-center md:justify-start">
              {legalLinks.map((link, idx) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-gray-600 hover:text-blue-600 transition"
                  >
                    {link.label}
                  </Link>
                  {idx < legalLinks.length - 1 && (
                    <span className="text-gray-300 ml-4">|</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Copyright & Company Info */}
          <div className="footer-bottom text-center md:text-left">
            <p className="text-xs text-gray-600 mb-1">
              © {new Date().getFullYear()} finanzleser.de. Alle Rechte vorbehalten.
            </p>
            <p className="text-xs text-gray-500">
              Finconext GmbH, Frankfurt am Main
            </p>
          </div>
        </div>
      </div>
    </footer>
    </>
  );
}
