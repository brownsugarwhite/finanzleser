import { getAllDokumente } from "@/lib/wordpress";
import DokumenteHead from "@/components/dokumente/DokumenteHead";
import DokumenteEmbed from "@/components/dokumente/DokumenteEmbed";

/**
 * Passende Dokumente einer (Sub-)Kategorie — EXAKT wie im Artikel dargestellt
 * (Spike-Label „Dokumente" + Linie via DokumenteHead, Vorschau via DokumenteEmbed),
 * aber über die volle Breite (Content + Rails), unterhalb des Werbe-/Rail-Bereichs.
 * Auswahl heuristisch: Treffer über dokumentKategorien/Keywords zuerst, dann neueste.
 */
const PICK = 4;

function tokens(s: string): string[] {
  return (s || "").toLowerCase().replace(/[^a-zäöüß0-9\s]/g, " ").split(/\s+/).filter((w) => w.length >= 4);
}

interface CategoryDokumenteProps {
  mainCategorySlug?: string;
  mainCategoryName?: string;
  categoryName?: string;
  categorySlug?: string;
}

export default async function CategoryDokumente({ mainCategorySlug, mainCategoryName, categoryName, categorySlug }: CategoryDokumenteProps) {
  const dokumente = await getAllDokumente();
  if (!dokumente || dokumente.length === 0) return null;

  const keywords = Array.from(new Set([...tokens(categoryName || ""), ...tokens(mainCategoryName || "")]));

  const scored = dokumente.map((d) => {
    const text = `${d.title} ${d.excerpt || ""} ${d.dokumentKategorien?.nodes?.map((n) => n.name).join(" ") || ""}`.toLowerCase();
    let s = 0;
    for (const k of keywords) if (text.includes(k)) s++;
    if (d.dokumentKategorien?.nodes?.some((n) => n.slug === categorySlug || n.slug === mainCategorySlug)) s += 3;
    return { d, s };
  });
  const matched = scored.filter((o) => o.s > 0).sort((a, b) => b.s - a.s);
  const rest = scored.filter((o) => o.s <= 0);
  const slugs = [...matched, ...rest].slice(0, PICK).map((o) => o.d.slug);
  if (slugs.length === 0) return null;

  return (
    <section className="category-dokumente">
      <DokumenteHead headingId="category-dokumente-head" />
      <DokumenteEmbed slugs={slugs} />
    </section>
  );
}
