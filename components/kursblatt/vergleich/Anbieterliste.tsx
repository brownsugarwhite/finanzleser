"use client";

/**
 * Klasse B im Kursblatt-Satz: die neun Versicherungskategorien.
 *
 * 🚨 financeads liefert hier NUR Name, Versicherer, Logo, Prüfsiegel und Partnerlink —
 * keine Beiträge, keine Deckungssummen, keine Vorteile (gemessen 15.09.2026 über
 * 40 Privathaftpflicht-Tarife: Logo 40/40, Siegel 11/40, `vorteile` 0/40,
 * `kennzahlen` 0/40). Es gibt also nichts zu streuen, nichts zu kürzen und keinen
 * Bestwert — Zinsband, Kennzahlen, Podest und Filterzeile entfallen ersatzlos.
 *
 * Das ist kein Notbehelf, sondern dieselbe Ehrlichkeit wie in der alten Liste: eine
 * erfundene Beitragsspalte wäre schlimmer als keine.
 *
 * Die Zeile folgt trotzdem dem Satz der Angebotsliste (K:186-209) — Logorahmen, Name in
 * Merriweather, Tarif darunter, Pille rechts —, damit eine Versicherungsseite nicht wie
 * ein fremdes Dokument aussieht.
 */
import type { DefLite, VergleichProdukt } from "@/lib/financeads/typen";
import PilleCTA from "@/components/kursblatt/teile/PilleCTA";
import { Logorahmen, MerkenKnopf } from "@/components/kursblatt/teile/Kleinteile";

export interface AnbieterlisteProps {
  def: DefLite;
  zeilen: VergleichProdukt[];
  gezeigt: number;
  alle: boolean;
  onAlle: () => void;
  gemerkt: number[];
  onMerken: (id: number) => void;
  /** Animationsname aus useLauf. */
  herz: string;
}

export default function Anbieterliste({ def, zeilen, gezeigt, alle, onAlle, gemerkt, onMerken, herz }: AnbieterlisteProps) {
  return (
    <section className="kb-liste kb-liste--anbieter">
      <b className="kb-liste__titel">Alle {zeilen.length} {def.mehrzahl}</b>

      <p className="kb__erklaer kb-liste__ohne-zahlen">
        Beiträge nennt unser Partner für diese {def.mehrzahl} nicht – sie hängen von Ihren
        Angaben ab und stehen erst beim Versicherer. Die Reihenfolge stammt ebenfalls von
        dort; sie richtet sich nach Produktkonditionen und danach, wie oft ein Tarif
        gewählt wird.
      </p>

      <div className="kb-liste__kopf">
        <span className="kb-liste__kopf-namen">Versicherer · {def.einzahl}</span>
        <span className="kb-liste__kopf-dritte">Prüfsiegel</span>
        <span />
      </div>

      {zeilen.slice(0, gezeigt).map((p, i) => (
        <div
          key={p.id}
          className="kb__zeile"
          style={herz === "none" ? undefined : { animation: `${herz} .7s var(--kb-kurve) ${(Math.min(i, 12) * 0.05).toFixed(2)}s both` }}
        >
          <i className="kb__zeile-linie kb__zeile-linie--oben" aria-hidden="true" />
          <i className="kb__zeile-linie kb__zeile-linie--unten" aria-hidden="true" />

          <div className="kb__zeile-raster">
            <Logorahmen quelle={p.logo} name={p.anbieter} groesse="zeile" />
            <div className="kb__zeile-namen">
              <b>{p.anbieter}</b>
              <span>{p.tarif}</span>
            </div>
            <span className="kb-zeile__siegel">
              {(p.siegel ?? []).map((s) => (
                // eslint-disable-next-line @next/next/no-img-element -- Prüfsiegel-GIF vom Partner-CDN; next/image zöge jedes durch die Netlify-Bild-Function
                <img key={s} src={s} alt="Prüfsiegel" height={34} loading="lazy" decoding="async" />
              ))}
            </span>
            <PilleCTA
              text="Zum Angebot" glyph="extern" werkzeug="tuerkis" fuellung klein
              href={p.link} rel="sponsored nofollow noopener" target="_blank"
              ariaLabel={`Zum Angebot von ${p.anbieter}`}
            />
          </div>

          <div className="kb__zeile-aktionen">
            <MerkenKnopf gemerkt={gemerkt.includes(p.id)} onKlick={() => onMerken(p.id)} klein />
          </div>
        </div>
      ))}

      {!alle && zeilen.length > gezeigt && (
        <button type="button" className="kb-liste__mehr" onClick={onAlle}>
          Alle {zeilen.length} {def.mehrzahl} zeigen
        </button>
      )}

    </section>
  );
}
