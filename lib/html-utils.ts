/**
 * Dekodiert HTML-Entities zu Unicode-Zeichen
 * z.B. &#8211; → –, &amp; → &, &nbsp; →
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return text;

  const textarea = typeof document !== "undefined"
    ? document.createElement("textarea")
    : null;

  // Server-side: nutze manuelle Replacements
  if (!textarea) {
    return text
      .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(parseInt(dec, 10)))
      .replace(/&#x([a-f0-9]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/&nbsp;/g, "\u00A0")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&ldquo;/g, "\u201C")
      .replace(/&rdquo;/g, "\u201D")
      .replace(/&lsquo;/g, "\u2018")
      .replace(/&rsquo;/g, "\u2019")
      .replace(/&ndash;/g, "\u2013")
      .replace(/&mdash;/g, "\u2014");
  }

  // Client-side: nutze browser API
  textarea.innerHTML = text;
  return textarea.value;
}

/**
 * Entfernt Visual Composer / WPBakery Shortcodes aus dem Content
 */
export function stripVCShortcodes(html: string): string {
  if (!html) return html;
  return html
    .replace(/\[\/?(vc_row|vc_column|vc_column_text|vc_row_inner|vc_column_inner)(\s[^\]]*)?\]/g, "")
    .replace(/\[templatera[^\]]*\]\[\/templatera\]/g, "")
    .replace(/\[templatera[^\]]*\]/g, "");
}

/**
 * Dekodiert alle relevanten Felder eines Post-Objekts
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function decodePostContent(post: any): any {
  return {
    ...post,
    title: decodeHtmlEntities(post.title),
    content: decodeHtmlEntities(post.content),
    excerpt: decodeHtmlEntities(post.excerpt),
  };
}
