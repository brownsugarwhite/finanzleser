import Link from "next/link";
import { getToolCategories } from "@/lib/wordpress";
import NewsletterBanner from "@/components/sections/NewsletterBanner";
import AIAgentTeaser from "@/components/sections/AIAgentTeaser";
import Spacer from "@/components/ui/Spacer";

export default async function Footer({ hideNewsletter = false }: { hideNewsletter?: boolean } = {}) {
  // Hauptkategorien (hardcoded) mit kleinen Icons (gleiche wie Ratgeber-Slider)
  const mainCategories = [
    { name: "Finanzen", slug: "finanzen", icon: "/icons/icon_finanzen.svg" },
    { name: "Versicherungen", slug: "versicherungen", icon: "/icons/icon_versicherungen.svg" },
    { name: "Steuern", slug: "steuern", icon: "/icons/icon_steuer.svg" },
    { name: "Recht", slug: "recht", icon: "/icons/icon_recht.svg" },
  ];

  const toolCategories = await getToolCategories();

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
        <div className="max-w-7xl mx-auto px-6 pb-12" style={{ paddingTop: "68px" }}>
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
                    className="text-sm text-gray-600 footer-link inline-flex items-center gap-2"
                  >
                    <span
                      className="footer-category-icon"
                      aria-hidden="true"
                      style={{ "--icon-url": `url(${category.icon})` } as React.CSSProperties}
                    />
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
                    className="text-sm text-gray-600 footer-link"
                  >
                    {tool.label} ({tool.count})
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Service */}
          <div className="footer-column footer-service">
            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
              Service
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/anbieter"
                  className="text-sm text-gray-600 footer-link"
                >
                  Anbieter
                </Link>
              </li>
              <li>
                <Link
                  href="/dokumente"
                  className="text-sm text-gray-600 footer-link"
                >
                  Dokumente
                </Link>
              </li>
              <li>
                <Link
                  href="/kontakt"
                  className="text-sm text-gray-600 footer-link"
                >
                  Kontakt
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Platzhalter-Rechteck */}
          <div
            className="footer-column"
            style={{
              border: "1px solid var(--color-text-primary)",
              background: "transparent",
              minHeight: "100%",
            }}
          />
        </div>

        {/* Divider */}
        <div style={{ margin: "36px 0" }}>
          <Spacer noMargin maxWidth="100%" />
        </div>
        <div className="pt-8 pb-6">
          {/* Legal Links */}
          <div className="footer-legal mb-6">
            <ul className="flex flex-wrap gap-4 justify-center md:justify-start">
              {legalLinks.map((link, idx) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-gray-600 footer-link"
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
      <style>{`
        .footer-link {
          transition: color 0.15s ease;
        }
        .footer-link:hover {
          color: var(--color-brand-secondary) !important;
        }
        .footer-category-icon {
          display: inline-block;
          width: 18px;
          height: 18px;
          flex-shrink: 0;
          background-color: rgb(75 85 99);
          mask-image: var(--icon-url);
          mask-size: contain;
          mask-repeat: no-repeat;
          mask-position: center;
          -webkit-mask-image: var(--icon-url);
          -webkit-mask-size: contain;
          -webkit-mask-repeat: no-repeat;
          -webkit-mask-position: center;
          transition: background-color 0.15s ease;
        }
        .footer-link:hover .footer-category-icon {
          background-color: var(--color-brand-secondary);
        }
      `}</style>
    </footer>
    </>
  );
}
