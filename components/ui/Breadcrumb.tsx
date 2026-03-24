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

    // Show up to 2 levels of navigation
    // For /kategorie/sub/artikel: show "Home > Kategorie > Sub"
    // For /suche or / : show nothing
    if (segments.length <= 1) {
      return [];
    }

    const breadcrumbs = [{ label: "Home", href: "/" }];
    let path = "";

    // Add first 2 segments (main category + subcategory)
    segments.slice(0, Math.min(2, segments.length - 1)).forEach((segment) => {
      path += `/${segment}`;
      const label = segment
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      breadcrumbs.push({ label, href: path });
    });

    return breadcrumbs;
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
