"use client";

import GlossarRail from "./glossar/GlossarRail";
import Einschub from "./Einschub";
import LeoFragt from "./leo/LeoFragt";
import KofferRail from "./KofferRail";

/**
 * Rechte Randspalte: Glossar der Sitzung (jeder angetippte grüne Begriff bleibt hier),
 * darunter der Aktenkoffer, im Fuß „Leo fragt“ (LeoFragt, mountet #leoFrage über der Anzeige).
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
                <GlossarRail />
              </div>
            </div>
            <KofferRail />
          </div>
          <div className="rand__fuss"><LeoFragt /><Einschub format="halfpage" nr={1} /></div>
        </div>
      </div>
      {mobil && <button type="button" className="rand__zu btn btn--klein btn--still" onClick={onZu}>Schließen ✕</button>}
    </aside>
  );
}
