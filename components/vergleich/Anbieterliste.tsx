"use client";

/**
 * Klasse B: financeads liefert für neun Versicherungskategorien nur Name, Versicherer,
 * Logo, Prüfsiegel und Partnerlink — keine Beiträge, keine Deckungssummen (gemessen
 * 15.09.2026). Diese Liste zeigt genau das und nichts Erfundenes. Leistungsmerkmale
 * kann die Redaktion darüber als Tabellen-Statistik setzen.
 */
import type { VergleichProdukt } from "@/lib/financeads/typen";

export default function Anbieterliste({ zeilen, gezeigt }: { zeilen: VergleichProdukt[]; gezeigt: number }) {
  return (
    <ol className="vgl__anbieter-liste">
      {zeilen.slice(0, gezeigt).map((p, i) => (
        <li key={p.id} className="vgl__anbieter-zeile" style={{ animationDelay: `${Math.min(i, 12) * 0.05}s` }}>
          <span className="vgl__logo">
            {/* eslint-disable-next-line @next/next/no-img-element -- 200×50-Logo vom Partner-CDN, lazy; next/image würde jedes Logo durch die Netlify-Bild-Function ziehen */}
            {p.logo ? <img src={p.logo} alt={p.anbieter} width={100} height={25} loading="lazy" decoding="async" /> : <b>{p.anbieter}</b>}
          </span>
          <div className="vgl__tarif">
            <b className="vgl__anbieter">{p.anbieter}</b>
            <span className="vgl__tarifname"><span>{p.tarif}</span></span>
          </div>
          <span className="vgl__siegel">
            {/* eslint-disable-next-line @next/next/no-img-element -- Prüfsiegel-GIF vom Partner-CDN */}
            {(p.siegel || []).map((s) => <img key={s} src={s} alt="Prüfsiegel" height={40} loading="lazy" decoding="async" />)}
          </span>
          <div className="vgl__aktionen">
            <a className="vgl__link" href={p.link} target="_blank" rel="sponsored nofollow noopener" data-faden-aus="">Zum Angebot<i aria-hidden="true">↗</i></a>
          </div>
        </li>
      ))}
    </ol>
  );
}
