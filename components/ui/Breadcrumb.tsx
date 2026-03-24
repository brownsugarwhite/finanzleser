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
    const breadcrumbs: BreadcrumbItem[] = [{ label: "Home", href: "/" }];

    // For category/sub/slug URLs, only show up to 2 segments (kategorie/sub)
    // For other URLs, show all but the last segment
    let maxSegments = 2;
    if (!pathname.includes("/finanztools") && !pathname.includes("/suche")) {
      maxSegments = Math.min(2, segments.length - 1);
    }

    let path = "";
    segments.slice(0, maxSegments).forEach((segment) => {
      path += `/${segment}`;

      // Format label: convert slug to readable text
      const label = segment
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      breadcrumbs.push({ label, href: path });
    });

    // Remove "Home" if it's the only item
    return breadcrumbs.length === 1 ? [] : breadcrumbs;
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
