"use client";

/**
 * Rechte Randspalte: Glossar der Sitzung (füllt sich mit Meilenstein 4, wenn die
 * grünen Begriffe im Text verlinkt sind), darunter Platz für „Leo fragt“ (Stufe 2).
 */
export default function RandRechts({ mobil, onZu }: { mobil?: boolean; onZu?: () => void }) {
  return (
    <aside className={"rand rand--rechts" + (mobil ? " mobil" : "")} id="randRechts" aria-label="Glossar der Sitzung">
      <div className="rand__lauf">
        <div className="rand__innen">
          <div className="rand__oben">
            <div>
              <h2>Glossar · Aktuelle Sitzung</h2>
              <div className="glossar-rail" id="glossarRail">
                <span className="rand__leer">Tippen Sie im Text auf einen <span className="begriff" style={{ cursor: "default" }}>grünen Begriff</span>. Die Erklärung landet hier und bleibt für diese Sitzung.</span>
              </div>
            </div>
          </div>
          <div className="rand__fuss" id="leoFrage" />
        </div>
      </div>
      {mobil && <button type="button" className="rand__zu btn btn--klein btn--still" onClick={onZu}>Schließen ✕</button>}
    </aside>
  );
}
