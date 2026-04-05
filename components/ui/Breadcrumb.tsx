"use client";

import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  const breadcrumbs = items || [];

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav className="mb-3" style={{ fontSize: "14px", color: "var(--color-text-medium)" }}>
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
