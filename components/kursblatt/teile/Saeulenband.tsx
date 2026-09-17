"use client";

/**
 * Das Säulen-Marktband im Kursblatt — eine Säule je Angebot, links gut, rechts schlecht.
 *
 * Übergabe „Finanzleser Heute“, Baustein 2b: Es ersetzt das Punkte-Streuband. Dieselbe
 * Grafik steht klein im Vergleichs-Teaser der Startseite; die Rechnung teilen sich beide
 * (`lib/kursblatt/saeulen.ts`), nur die Feldhöhe unterscheidet sich.
 *
 * 🚨 Warum Säulen statt Punkte: Auf einer Achse liegen die Angebote so, wie die Werte
 * streuen — bei zwölf Krediten zwischen 0,68 % und 6,91 % klumpen sie in der Mitte, und
 * es brauchte Klassen, Etagen und ein „+3“ über dem Stapel, damit überhaupt etwas zu
 * sehen war. Die Säulenreihe gibt jedem Angebot denselben Platz und zeigt an der HÖHE,
 * was es besser macht als das schlechteste. Kein Stapeln, kein Überdrucken.
 *
 * Was bleibt: die feste Legendenzeile (links Bestwert, rechts Durchschnitt), der Klick,
 * der die Angebotszeile unten öffnet, und die Verbindung Säule ↔ Zeile in beide
 * Richtungen über `hover`.
 */
import type { SpalteDef, VergleichProdukt } from "@/lib/financeads/typen";
import { formatKennwert } from "@/lib/financeads/format";
import { saeulenSkala } from "@/lib/kursblatt/saeulen";

export interface SaeulenbandProps {
  haupt: SpalteDef;
  zeilen: VergleichProdukt[];
  best?: VergleichProdukt;
  /** Hervorgehobenes Angebot — gilt in beide Richtungen: Säule ↔ Zeile. */
  hover: number | null;
  onHover: (id: number | null) => void;
  onOeffnen: (id: number) => void;
  /** Animationsnamen aus useLauf, damit die Legende neu druckt. */
  druck: string;
}

export default function Saeulenband({ haupt, zeilen, best, hover, onHover, onOeffnen, druck }: SaeulenbandProps) {
  const mitWert = zeilen.filter((p) => typeof p.kennzahlen[haupt.key] === "number");
  if (mitWert.length < 2) return null;
  const werte = mitWert.map((p) => p.kennzahlen[haupt.key] as number);
  const hoch = haupt.richtung === "hoch";
  const skala = saeulenSkala(werte, hoch);

  // Vom besten zum schlechtesten — die Reihenfolge der Liste zählt hier nicht.
  const slots = [...mitWert].sort((a, b) => {
    const x = a.kennzahlen[haupt.key] as number;
    const y = b.kennzahlen[haupt.key] as number;
    return hoch ? y - x : x - y;
  });
  const bestId = best?.id ?? slots[0].id;
  // Über zwanzig Angeboten rücken die Säulen enger und die Namen verschwinden.
  const dicht = slots.length > 20;

  return (
    <div className="kb-band">
      {/* 🚨 Die LEGENDE steht fest über dem Band, nicht über ihrem Wert. Sie wanderte
          früher mit und überlief sich selbst; das ist seit Runde 2 des Kursblatts erledigt
          und bleibt es auch mit Säulen. */}
      <div className="kb-band__legende">
        <span className="kb-band__legende-best" style={{ animation: druck === "none" ? undefined : `${druck} .6s .6s both` }}>
          <i aria-hidden="true" />
          Bestwert {formatKennwert(haupt, skala.best)}
          {best ? ` · ${best.anbieter}` : ""}
        </span>
        {/* Ohne „ab": der Durchschnitt von lauter Untergrenzen ist keine Untergrenze. */}
        <span className="kb-band__legende-schnitt">
          <i aria-hidden="true" />
          Durchschnitt {formatKennwert({ ...haupt, ab: false }, skala.schnitt)}
        </span>
      </div>

      <div className={"kb-saeulen" + (dicht ? " kb-saeulen--dicht" : "")}>
        <div className="kb-saeulen__feld">
          {slots.map((p, i) => {
            const wert = p.kennzahlen[haupt.key] as number;
            const h = skala.hoehe(wert);
            const ist = p.id === bestId;
            return (
              <button
                key={p.id}
                type="button"
                className="kb-saeulen__slot"
                data-ist={ist ? "an" : "aus"}
                data-hell={hover === p.id ? "an" : "aus"}
                aria-label={`${p.anbieter}: ${formatKennwert(haupt, wert)}`}
                onMouseEnter={() => onHover(p.id)}
                onMouseLeave={() => onHover(null)}
                onFocus={() => onHover(p.id)}
                onBlur={() => onHover(null)}
                onClick={() => onOeffnen(p.id)}
              >
                <span className="kb-saeulen__wert" style={{ bottom: `${h}%` }}>{formatKennwert({ ...haupt, ab: false }, wert)}</span>
                <i className="kb-saeulen__saeule" style={{ height: `${h}%`, animationDelay: `calc(.25s + ${i} * .05s)` }} aria-hidden="true" />
                <span className="kb-saeulen__name">{p.anbieter}</span>
              </button>
            );
          })}
          {/* Ø-Linie und Grundlinie liegen ÜBER den Säulen, aber ohne Tastfläche. */}
          <i className="kb-saeulen__schnitt" style={{ bottom: `${skala.hoehe(skala.schnitt)}%` }} aria-hidden="true" />
          <i className="kb-saeulen__grund" aria-hidden="true" />
        </div>
      </div>

      <div className="kb-band__fuss">
        <span>{skala.guenstiger ? "günstig" : "viel"}</span>
        <span className="kb__kicker">Ersparnis gegenüber dem {skala.guenstiger ? "teuersten" : "schwächsten"}</span>
        <span>{skala.guenstiger ? "teuer" : "wenig"}</span>
      </div>
    </div>
  );
}
