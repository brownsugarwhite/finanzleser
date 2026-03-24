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

    let path = "";
    segments.forEach((segment, index) => {
      path += `/${segment}`;

      // Format label: convert slug to readable text
      const label = segment
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      // Don't add the last segment (usually the current page slug) if it's too long
      // or if it's a UUID-like string
      const isLastSegment = index === segments.length - 1;
      const isPageSlug = isLastSegment && (segment.length > 20 || segment.includes("-"));

      if (!isPageSlug) {
        breadcrumbs.push({ label, href: path });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <nav className="mb-6" style={{ fontSize: "14px", color: "var(--color-text-medium)" }}>
      <ul style={{ display: "flex", alignItems: "center", gap: "8px", listStyle: "none", padding: 0, margin: 0 }}>
        {breadcrumbs.map((item, index) => (
          <li key={item.href} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {index > 0 && <span style={{ color: "var(--color-text-medium)" }}>&gt;</span>}
            {index === breadcrumbs.length - 1 ? (
              <span style={{ color: "var(--color-text-primary)" }}>{item.label}</span>
            ) : (
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
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
