"use client";

/**
 * Setzt die Ergebnis-Blöcke eines Rechner-Schemas.
 *
 * Vorlage: „Finanzleser Vergleich & Rechner - Kursblatt.dc.html“:303-343 — Punktlinie mit
 * „ERGEBNIS“, drei Kacheln, Anteilsband, Verlaufskurve, Jahresübersicht, Hinweis.
 *
 * 🚨 Nutzt bewusst NICHT components/rechner/ui/RechnerResults.tsx. Dessen GSAP-Timeline
 * selektiert nach Klassennamen (.rechner-result-box, .rechner-result-value …) und würde
 * im Kursblatt-Satz stumm nichts animieren. Das Ergebnis öffnet hier über
 * `grid-template-rows: 0fr → 1fr`, wie die Übergabe es beschreibt.
 */
import { useZaehlwerkKb } from "@/lib/kursblatt/useZaehlwerkKb";
import Anteilsband from "@/components/kursblatt/teile/Anteilsband";
import Verlaufskurve from "@/components/kursblatt/teile/Verlaufskurve";
import Zeiger from "@/components/kursblatt/teile/Zeiger";
import Messlatte from "@/components/kursblatt/teile/Messlatte";
import { Punktzeile } from "@/components/kursblatt/teile/Kleinteile";
import type { ErgebnisBlock } from "@/lib/rechner/schema";
import type { Lauf } from "@/lib/kursblatt/useLauf";

function Kachel({ label, wert, text, haupt, verzug, lauf }: { label: string; wert: number; text: (v: number) => string; haupt?: boolean; verzug: number; lauf: Lauf }) {
  const laufend = useZaehlwerkKb(wert);
  return (
    <div
      className={"kb-kachel" + (haupt ? " kb-kachel--haupt" : "")}
      style={lauf.herz === "none" ? undefined : { animation: `${lauf.herz} .8s var(--kurve) ${verzug}s both` }}
    >
      <span className="kb__kicker">{label}</span>
      <b className="kb-kachel__wert">{text(laufend)}</b>
    </div>
  );
}

export default function Ergebnis({
  bloecke, offen, veraltet, lauf, kopfRef,
}: {
  bloecke: ErgebnisBlock[];
  offen: boolean;
  veraltet: boolean;
  lauf: Lauf;
  kopfRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="kb-ergebnis" data-offen={offen ? "an" : "aus"}>
      <div className="kb-ergebnis__innen" data-veraltet={veraltet ? "an" : "aus"}>
        <div className="kb-ergebnis__inhalt">
          {/* 🚨 Der Sprung zielt auf die ERGEBNIS-Zeile, nicht auf den Kasten: dessen
              Oberkante liegt 40 px höher und ist unsichtbar (Innenabstand). Gemessen
              landete die sichtbare Zeile dadurch auf 130 px statt der 90 px des Handoffs. */}
          <div className="kb-ergebnis__kopf" ref={kopfRef}>
            <i style={lauf.mitte === "none" || !offen ? undefined : { animation: `${lauf.mitte} .9s var(--kurve) both` }} aria-hidden="true" />
            <span>ERGEBNIS</span>
            <i style={lauf.mitte === "none" || !offen ? undefined : { animation: `${lauf.mitte} .9s var(--kurve) both` }} aria-hidden="true" />
          </div>

          {/* 🚨 Ring und Säulen stehen NEBENEINANDER (Vorlage K, Ergebnis oben): der Ring
              links in fester Breite, die Säulen daneben. Als zwei Blöcke untereinander
              wirkt der Ring wie ein einsames Bild und die Säulen wie ein zweites Thema.
              Steht auf einen `zeiger` unmittelbar eine `messlatte`, werden sie hier zu
              einer Zeile gefasst — der Rest der Liste bleibt, wie er ist. */}
          {bloecke.map((b, i) => {
            if (b.art === "messlatte" && bloecke[i - 1]?.art === "zeiger") return null;
            if (b.art === "zeiger" && bloecke[i + 1]?.art === "messlatte") {
              const m = bloecke[i + 1];
              if (m.art !== "messlatte") return null;
              return (
                <div key={i} className="kb-ergebnis__ringzeile">
                  <Zeiger label={b.label} wert={b.wert} max={b.max} einheit={b.einheit} zeichnen={lauf.zeichnen} aktiv={offen} />
                  <Messlatte
                    titel={m.titel} wert={m.wert} schnitt={m.schnitt} einheit={m.einheit}
                    wertLabel={m.wertLabel} schnittLabel={m.schnittLabel}
                  />
                </div>
              );
            }
            switch (b.art) {
              case "kacheln":
                return (
                  <div key={i} className="kb-kacheln">
                    {b.kacheln.map((k, j) => (
                      <Kachel key={k.label} {...k} verzug={0.2 + j * 0.12} lauf={lauf} />
                    ))}
                  </div>
                );
              case "anteilsband":
                return <Anteilsband key={i} titel={b.titel} teile={b.teile} />;
              case "kurve":
                return (
                  <Verlaufskurve
                    key={i} titel={b.titel} werte={b.werte} xText={b.xText} scrubText={b.scrubText}
                    yText={(v) => Math.round(v).toLocaleString("de-DE") + " €"}
                    zeichnen={offen ? lauf.zeichnen : "none"} aktiv={offen}
                  />
                );
              case "tabelle": {
                /* K:337-341 — Spaltenmaß der Vorlage: die Jahresspalte schmaler, die
                   letzte breiter, dazwischen gleich. Als Variable, damit Kopf und Zeilen
                   sie aus DERSELBEN Quelle bekommen — zwei Grids mit eigenen Angaben
                   stehen nicht untereinander. */
                const raster = b.spalten
                  .map((_, n) => (n === 0 ? ".7fr" : n === b.spalten.length - 1 ? "1.2fr" : "1fr"))
                  .join(" ");
                return (
                  <div key={i} className="kb-tabelle" style={{ ["--kb-tab-raster" as string]: raster }}>
                    <span className="kb__kicker">{b.titel}</span>
                    {/* Der Linienstapel trägt die Doppellinie, das Band darin die Versalien. */}
                    <div className="kb__kopfstapel kb-tabelle__stapel">
                      <div className="kb-tabelle__kopf">
                        {b.spalten.map((s) => (
                          <span key={s.key} data-rechts={s.rechts ? "an" : undefined}>{s.label}</span>
                        ))}
                      </div>
                      {b.zeilen.map((z, j) => (
                        <div
                          key={j}
                          className="kb-tabelle__zeile"
                          data-betont={b.letzteBetont && j === b.zeilen.length - 1 ? "an" : undefined}
                          style={lauf.herz === "none" || !offen ? undefined : { animation: `${lauf.herz} .6s ${(0.5 + j * 0.06).toFixed(2)}s both` }}
                        >
                          {b.spalten.map((s) => (
                            <span key={s.key} data-rechts={s.rechts ? "an" : undefined} data-ton={s.ton}>{z[s.key]}</span>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              case "punktzeilen":
                return (
                  <div key={i} className="kb-punktblock">
                    {b.titel && <span className="kb__kicker">{b.titel}</span>}
                    {b.zeilen.map((z) => <Punktzeile key={z.k} k={z.k} v={z.v} ton={z.ton} />)}
                  </div>
                );
              case "zeiger":
                return <Zeiger key={i} label={b.label} wert={b.wert} max={b.max} einheit={b.einheit} zeichnen={lauf.zeichnen} aktiv={offen} />;
              case "messlatte":
                return <Messlatte key={i} titel={b.titel} wert={b.wert} schnitt={b.schnitt} einheit={b.einheit} wertLabel={b.wertLabel} schnittLabel={b.schnittLabel} />;
              case "hinweis":
                return <div key={i} className="kb-ergebnis__hinweis">{b.text}</div>;
            }
          })}
        </div>
      </div>
    </div>
  );
}
