"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { buildDokumentUrl } from "@/lib/urls";
import type { Dokument } from "@/lib/types";

type Props = {
  dokumente: Dokument[];
};

const ALL_KEY = "__all__";

export default function DokumenteListClient({ dokumente }: Props) {
  const [activeKategorie, setActiveKategorie] = useState<string>(ALL_KEY);

  const kategorien = useMemo(() => {
    const map = new Map<string, { name: string; slug: string; count: number }>();
    for (const d of dokumente) {
      for (const k of d.dokumentKategorien?.nodes || []) {
        const existing = map.get(k.slug);
        if (existing) existing.count += 1;
        else map.set(k.slug, { name: k.name, slug: k.slug, count: 1 });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "de"));
  }, [dokumente]);

  const filtered = useMemo(() => {
    if (activeKategorie === ALL_KEY) return dokumente;
    return dokumente.filter((d) =>
      (d.dokumentKategorien?.nodes || []).some((k) => k.slug === activeKategorie)
    );
  }, [dokumente, activeKategorie]);

  return (
    <>
      {kategorien.length > 0 && (
        <div
          className="dokumente-filter"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 24,
          }}
        >
          <FilterPill
            active={activeKategorie === ALL_KEY}
            label="Alle Dokumente"
            count={dokumente.length}
            onClick={() => setActiveKategorie(ALL_KEY)}
          />
          {kategorien.map((k) => (
            <FilterPill
              key={k.slug}
              active={activeKategorie === k.slug}
              label={k.name}
              count={k.count}
              onClick={() => setActiveKategorie(k.slug)}
            />
          ))}
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((d) => {
            const beschreibung = d.excerpt ? stripHtml(d.excerpt) : "";
            const kategorieLabel = d.dokumentKategorien?.nodes?.[0]?.name;
            return (
              <Link
                key={d.id}
                href={buildDokumentUrl(d.slug)}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-lg transition bg-white"
                style={{
                  borderLeftWidth: 3,
                  borderLeftColor: "var(--color-tool-dokumente)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {kategorieLabel && (
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--color-tool-dokumente)",
                      fontFamily: "var(--font-body)",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    {kategorieLabel}
                  </span>
                )}
                <h3 className="font-semibold text-gray-900">{d.title}</h3>
                {beschreibung && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-3">
                    {beschreibung}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-lg text-gray-600">
            Keine Dokumente in dieser Kategorie.
          </p>
        </div>
      )}
    </>
  );
}

function FilterPill({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "transition",
        active ? "is-active" : ""
      )}
      style={{
        padding: "6px 14px",
        borderRadius: 999,
        border: "1px solid",
        borderColor: active ? "var(--color-tool-dokumente)" : "var(--color-border-default)",
        background: active ? "var(--color-tool-dokumente)" : "var(--color-pill-bg)",
        color: active ? "white" : "var(--color-text-primary)",
        fontFamily: "var(--font-body)",
        fontSize: 14,
        fontWeight: 500,
        cursor: "pointer",
      }}
    >
      {label}
      <span
        style={{
          marginLeft: 8,
          opacity: 0.7,
          fontSize: 12,
        }}
      >
        {count}
      </span>
    </button>
  );
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}
