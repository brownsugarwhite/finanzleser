import Image from "next/image";

/**
 * KI-Transparenzhinweis (EU-KI-Verordnung Art. 50) mit offiziellem EU-Label
 * „AI MODIFIED" — sitzt direkt unter der Autorenbox im Artikel.
 */
export default function KiHinweis() {
  return (
    <div className="flex items-center gap-3" style={{ marginTop: "14px" }}>
      <Image
        src="/assets/icons/eu-ai-modified.png"
        alt="EU-Kennzeichnung: AI Modified – Inhalt mit KI-Unterstützung erstellt"
        width={90}
        height={20}
        style={{ flexShrink: 0 }}
      />
      <p style={{ fontSize: "13px", lineHeight: "1.35em", color: "var(--color-text-medium)" }}>
        Unsere Inhalte entstehen mit KI-Unterstützung und werden vor Veröffentlichung
        redaktionell geprüft.
      </p>
    </div>
  );
}
