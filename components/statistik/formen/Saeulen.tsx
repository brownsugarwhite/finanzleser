"use client";

/**
 * Säulen — Design A v2, Handoff Zeile 966–985, Logik 1876–1877.
 *
 * Bis zu zwei Reihen je Kategorie. Die Säulen wachsen über scaleY aus der Grundlinie,
 * gestaffelt um 0,09 s je Kategorie; die Zahl darüber blendet kurz danach auf.
 */
import type { StatSaeulen } from "@/lib/statistik/schema";
import { useZeichnen } from "@/lib/statistik/useZeichnen";
import { formatWert } from "@/lib/statistik/formeln";
import Wertetabelle from "./Wertetabelle";

const REIHENFARBE = ["var(--ink)", "var(--green)"];
/** Die Zahl über der hellen Säule braucht das dunklere Grün, sonst ist sie auf Papier zu schwach. */
const ZAHLFARBE = ["var(--ink)", "var(--green-ink)"];

export default function Saeulen({ st }: { st: StatSaeulen }) {
  const [wurzel, an] = useZeichnen<HTMLDivElement>();
  const alle = st.kategorien.flatMap((k) => k.werte);
  const maximum = st.maximum ?? (Math.max(...alle, 0) * 1.1 || 1);
  const spalten = `repeat(${st.kategorien.length},1fr)`;

  return (
    <div className="st-saeulen" ref={wurzel}>
      {st.reihen.length > 1 && (
        <div className="st-saeulen__legende">
          {st.reihen.map((r, j) => (
            <span key={r.label}><i style={{ background: r.farbe || REIHENFARBE[j] }} />{r.label}</span>
          ))}
        </div>
      )}
      <div className="st-saeulen__buehne" aria-hidden="true">
        <i className="st-saeulen__linie" style={{ top: "33%" }} />
        <i className="st-saeulen__linie" style={{ top: "66%" }} />
        <div className="st-saeulen__gitter" style={{ gridTemplateColumns: spalten }}>
          {st.kategorien.map((k, i) => (
            <div key={k.label} className="st-saeulen__gruppe">
              {k.werte.map((v, j) => (
                <span
                  key={j} className="st-saeulen__stab"
                  style={{
                    height: `${(v / maximum) * 100}%`,
                    background: st.reihen[j]?.farbe || REIHENFARBE[j],
                    transform: `scaleY(${an ? 1 : 0})`,
                    transitionDelay: `${(j ? 0.06 : 0) + i * 0.09}s`,
                  }}
                >
                  <b style={{ color: ZAHLFARBE[j], opacity: an ? 1 : 0, transitionDelay: `${0.06 + i * 0.09}s` }}>{formatWert(v, "")}</b>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="st-saeulen__achse" style={{ gridTemplateColumns: spalten }} aria-hidden="true">
        {st.kategorien.map((k) => <span key={k.label}>{k.label}</span>)}
      </div>
      <Wertetabelle
        titel={st.titel}
        spalte="Kategorie"
        reihen={st.reihen.map((r) => r.label)}
        zeilen={st.kategorien.map((k) => ({ name: k.label, werte: k.werte.map((v) => formatWert(v, st.einheit)) }))}
      />
    </div>
  );
}
