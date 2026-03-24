"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface BreadcrumbItem {
  label: string;
  href: string;
}

export default function Breadcrumb() {
  const pathname = usePathname();

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split("/").filter(Boolean);

    // Only show first segment (main category) if there are multiple segments
    // For /kategorie/sub/artikel: show only "Home > Kategorie"
    // For /suche or / : show nothing
    if (segments.length <= 1) {
      return [];
    }

    const mainCategory = segments[0];
    const label = mainCategory
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    return [
      { label: "Home", href: "/" },
      { label, href: `/${mainCategory}` }
    ];
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav className="mb-6" style={{ fontSize: "14px", color: "var(--color-text-medium)" }}>
      <ul style={{ display: "flex", alignItems: "center", gap: "8px", listStyle: "none", padding: 0, margin: 0 }}>
        {breadcrumbs.map((item, index) => (
          <li key={item.href} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Link
              href={item.href}
              style={{
                color: "var(--color-text-medium)",
                textDecoration: "none",
                transition: "opacity 0.2s",
              }}
              className="hover:opacity-80"
            >
              {item.label}
            </Link>
            {index < breadcrumbs.length - 1 && <span style={{ color: "var(--color-text-medium)" }}>&gt;</span>}
          </li>
        ))}
      </ul>
    </nav>
  );
}
