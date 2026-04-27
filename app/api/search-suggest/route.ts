import { NextRequest, NextResponse } from "next/server";

type Suggestion = { title: string; url: string };

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&#(\d+);/g, (_m, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([a-f0-9]+);/gi, (_m, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ suggestions: [] satisfies Suggestion[] });
  }

  const wpGraphqlUrl = process.env.WORDPRESS_API_URL;
  if (!wpGraphqlUrl) {
    return NextResponse.json({ suggestions: [] satisfies Suggestion[] });
  }
  const wpBase = wpGraphqlUrl.replace(/\/graphql\/?$/, "");

  try {
    const res = await fetch(
      `${wpBase}/wp-json/wp/v2/search?search=${encodeURIComponent(q)}&per_page=8&_fields=title,url`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) {
      return NextResponse.json({ suggestions: [] satisfies Suggestion[] });
    }
    const raw: { title?: string; url?: string }[] = await res.json();

    const suggestions: Suggestion[] = raw
      .filter((it) => it.title && it.url)
      .map((it) => {
        let pathname = "/";
        try {
          pathname = new URL(it.url!).pathname;
        } catch {
          pathname = it.url!;
        }
        return {
          title: decodeHtmlEntities(it.title!),
          url: pathname,
        };
      });

    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] satisfies Suggestion[] });
  }
}
