"use client";

/**
 * Die Tokens des Verzeichnisses, so wie der Browser sie wirklich sieht.
 *
 * 🚨 Die Werte stehen NICHT in dieser Datei und auch nicht in lib/faden/tokenliste.ts.
 * Sie werden zur Laufzeit aus dem lebenden Baum gelesen (`getComputedStyle`) — eine
 * abgeschriebene Liste veraltet beim ersten Umbau, und dann zeigt der Schaukasten etwas
 * anderes als die Seite. Deshalb ändert sich diese Tafel automatisch mit app/tokens.css.
 *
 * Neue Tokens bekommen ihren NAMEN und ihre AUFGABE in lib/faden/tokenliste.ts.
 */
import { useEffect, useRef, useState } from "react";
import { ALLE_TOKEN, TOKENGRUPPEN, type Tokengruppe } from "@/lib/faden/tokenliste";

function Gruppe({ g, werte }: { g: Tokengruppe; werte: Record<string, string> }) {
  return (
    <section className="token__gruppe">
      <h3 className="token__titel">{g.titel}</h3>
      {g.regel && <p className="token__regel">{g.regel}</p>}
      <ul className={"token__liste token__liste--" + g.art}>
        {g.tokens.map(([k, was]) => (
          <li key={k}>
            {g.art === "farbe" && <i className="token__probe" style={{ background: `var(${k})` }} />}
            {g.art === "linie" && <i className="token__strich" style={{ background: `var(${k})` }} />}
            {g.art === "mass" && <i className="token__balken" style={{ width: `var(${k})` }} />}
            {g.art === "form" && (
              <i
                className="token__form"
                style={k.startsWith("--radius")
                  ? { borderRadius: `var(${k})`, border: "1px solid var(--ink)" }
                  : { boxShadow: `var(${k})`, background: "var(--auflage)" }}
              />
            )}
            {g.art === "bewegung" && <i className="token__lauf" style={{ animationTimingFunction: `var(${k})` }} />}
            {g.art === "schrift" && <span className="token__satz" style={{ font: `var(${k})` }}>Finanzleser · 0123</span>}
            <code>{k}</code>
            <b>{werte[k] || "…"}</b>
            <span>{was}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function SchaukastenTokens() {
  const anker = useRef<HTMLDivElement>(null);
  const [werte, setWerte] = useState<Record<string, string>>({});

  useEffect(() => {
    const el = anker.current?.closest(".faden-shell") || anker.current;
    if (!el) return;
    const s = getComputedStyle(el);
    setWerte(Object.fromEntries(ALLE_TOKEN.map((k) => [k, s.getPropertyValue(k).trim()])));
  }, []);

  const fehlt = ALLE_TOKEN.filter((k) => Object.keys(werte).length > 0 && !werte[k]);

  return (
    <div className="token" ref={anker}>
      {fehlt.length > 0 && (
        <p className="hinweis">
          🚨 {fehlt.length} Token ohne Wert: <code>{fehlt.join(", ")}</code>. Entweder steht der
          Name nicht mehr in app/tokens.css, oder er bezieht sich auf sich selbst
          (<code>--x: var(--x)</code>) — das liefert LEER statt des Ersatzwerts.
        </p>
      )}
      {TOKENGRUPPEN.map((g) => <Gruppe key={g.titel} g={g} werte={werte} />)}
    </div>
  );
}
