/**
 * Dokumente-Kopf: Spike-Label „Dokumente" (Zacken oben am Badge, bündig zur
 * 750px-Body-Breite) + Untertitel + durchgehende Linie im breiten Container.
 * Wird identisch im Artikel (ArticleContent) und auf Kategorie-Seiten genutzt.
 */
export default function DokumenteHead({
  headingId,
  subtitle = "Passende Formulare und Broschüren",
}: {
  headingId: string;
  subtitle?: string;
}) {
  return (
    <div className="dok-head">
      <span className="dok-head-line" aria-hidden />
      {/* Innerer Container fluchtet mit dem 750px-Body (zentriert),
          die Linie läuft im breiteren Eltern-Container durch. */}
      <div className="dok-head-inner">
        <h2 id={headingId} className="dok-head-h">
          <span className="dok-head-label">Dokumente</span>
        </h2>
        <span className="dok-head-subtitle">{subtitle}</span>
      </div>
    </div>
  );
}
