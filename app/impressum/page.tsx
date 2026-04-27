import { notFound } from "next/navigation";
import { getPageBySlug } from "@/lib/wordpress";
import LegalPageLayout from "@/components/layout/LegalPageLayout";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

const SLUG = "impressum";
const TITLE = "Impressum";
const EYEBROW = "Rechtliches";

export async function generateMetadata() {
  const page = await getPageBySlug(SLUG);
  return buildMetadata({
    title: TITLE,
    description: page?.seoDescription,
    path: `/${SLUG}`,
    modifiedTime: page?.modified,
    type: "article",
  });
}

export default async function ImpressumPage() {
  const page = await getPageBySlug(SLUG);
  if (!page) notFound();
  return (
    <LegalPageLayout
      eyebrow={EYEBROW}
      title={page.title || TITLE}
      content={page.content}
    />
  );
}
