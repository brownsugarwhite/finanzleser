import type { Metadata } from "next";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.finanzleser.de"
).replace(/\/$/, "");

export const SITE_NAME = "Finanzleser.de";
export const SITE_DESCRIPTION =
  "Ratgeber, Rechner und Vergleiche zu Steuern, Geldanlage und Versicherungen.";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/assets/og-default.jpg`;

export function absoluteUrl(path: string): string {
  if (!path) return SITE_URL;
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function stripHtml(input?: string | null): string {
  if (!input) return "";
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncate(text: string, max = 160): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

export interface BuildMetadataInput {
  title: string;
  description?: string;
  path: string;
  image?: string;
  imageAlt?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  noIndex?: boolean;
}

export function buildMetadata(input: BuildMetadataInput): Metadata {
  const description = truncate(input.description || SITE_DESCRIPTION, 160);
  const url = absoluteUrl(input.path);
  const image = input.image || DEFAULT_OG_IMAGE;

  return {
    title: input.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: input.type || "website",
      url,
      title: input.title,
      description,
      siteName: SITE_NAME,
      locale: "de_DE",
      images: [{ url: image, alt: input.imageAlt || input.title }],
      ...(input.publishedTime && { publishedTime: input.publishedTime }),
      ...(input.modifiedTime && { modifiedTime: input.modifiedTime }),
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description,
      images: [image],
    },
    robots: input.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}
