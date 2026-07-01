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
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "var(--color-text-medium)",
                textDecoration: "none",
                transition: "opacity 0.2s",
              }}
              className="hover:opacity-80"
            >
              {index === 0 && item.label === "Home" && (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 268.42 268.42"
                  fill="currentColor"
                  aria-hidden="true"
                  style={{ flexShrink: 0 }}
                >
                  <path d="M254.18,30.74c-4.6-6.33-10.17-11.9-16.5-16.5C218.09,0,190.13,0,134.21,0S50.33,0,30.74,14.24c-6.33,4.6-11.9,10.17-16.5,16.5C0,50.33,0,78.29,0,134.21s0,83.88,14.24,103.48c4.6,6.33,10.17,11.9,16.5,16.5,19.6,14.24,47.56,14.24,103.47,14.24s83.88,0,103.48-14.24c6.33-4.6,11.9-10.17,16.5-16.5,14.24-19.6,14.24-47.56,14.24-103.48s0-83.88-14.24-103.47ZM219.96,125.61c-1.68,1.56-4.01,2.52-6.4,2.56l-7.67.1v71.87c-.07,2.86-2.05,6.99-5.34,7.01l-44.24.18v-48.76c0-2.98-1.96-5.26-5.06-5.46h-30.3c-3.07.08-5.23,2.36-5.23,5.45v48.76s-44.22-.18-44.22-.18c-3.29-.01-5.28-4.13-5.32-7.01v-71.87s-7.68-.11-7.68-.11c-2.76-.04-5.29-1.18-7.06-3.26-2.02-2.36-2.26-6.1.23-8.4l77.78-71.91c4.16-3.85,10.55-3.77,14.66.1l75.83,71.33c2.87,2.7,2.93,6.9.03,9.59Z" />
                </svg>
              )}
              {item.label}
            </Link>
            {index < breadcrumbs.length - 1 && <span style={{ color: "var(--color-text-medium)" }}>&gt;</span>}
          </li>
        ))}
      </ul>
    </nav>
  );
}
