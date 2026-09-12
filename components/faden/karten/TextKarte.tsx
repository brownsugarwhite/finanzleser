import { medienHtml } from "@/lib/faden/medien";

/** Statische Seite (Impressum, Datenschutz, AGB …) als Textkarte im Faden. */
export default function TextKarte({ content }: { content: string }) {
  return (
    <div className="kasten kasten--still kasten--text">
      <div className="prose legal-prose" dangerouslySetInnerHTML={{ __html: medienHtml(content) }} />
    </div>
  );
}
