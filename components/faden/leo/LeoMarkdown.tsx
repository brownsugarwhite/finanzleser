"use client";

/**
 * Leos Antworttext als Markdown.
 *
 * 🚨 Eigene Datei, damit `react-markdown` samt `remark-gfm`, `micromark`, `mdast` und
 * `unified` erst geladen wird, wenn Leo tatsächlich geantwortet hat. Bisher hing der
 * Import direkt in LeoStrom, das auf JEDER Faden-Seite gerendert wird — der Leser
 * bezahlte den Parser also auch dann, wenn er Leo nie fragt. Im SSR-HTML steht ohnehin
 * nie eine Antwort (sie kommt über /api/chat als Stream), deshalb `ssr: false`.
 */
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function LeoMarkdown({ text }: { text: string }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>;
}
