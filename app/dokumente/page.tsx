import { notFound } from "next/navigation";
import { getPageBySlug } from "@/lib/wordpress";
import LegalPageLayout from "@/components/layout/LegalPageLayout";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

const SLUG = "dokumente";
const TITLE = "Dokumente";
const EYEBROW = "Service";

export async function generateMetadata() {
  const page = await getPageBySlug(SLUG);
  return buildMetadata({
    title: TITLE,
    description:
      page?.seoDescription ||
      "Dokumente und PDF-Vorlagen zum Download.",
    path: `/${SLUG}`,
    modifiedTime: page?.modified,
    type: "website",
  });
}

export default async function DokumentePage() {
  const page = await getPageBySlug(SLUG);
  if (!page) notFound();
  return (
    <LegalPageLayout
      eyebrow={EYEBROW}
      title={page.title || TITLE}
      content={page.content}
      headingVariant="spark"
    />
  );
}
