"use client";

/**
 * Setzt die Felder eines Rechner-Schemas — je nach `baustein` das passende Werkzeug.
 *
 * Vorlage der Anordnung: „Finanzleser Vergleich & Rechner - Kursblatt.dc.html“:250-288.
 * Ein breites Feld nimmt die volle Satzbreite, alles andere steht in zwei Spalten.
 */
import Lineal from "@/components/kursblatt/eingabe/Lineal";
import Drehring from "@/components/kursblatt/eingabe/Drehring";
import Zaehlwerk from "@/components/kursblatt/eingabe/Zaehlwerk";
import Setzzeile from "@/components/kursblatt/eingabe/Setzzeile";
import Register from "@/components/kursblatt/eingabe/Register";
import { Schalter } from "@/components/kursblatt/teile/Kleinteile";
import type { Feld, Werte } from "@/lib/rechner/schema";

function Kopf({ f }: { f: Feld }) {
  return (
    <div className="kb__feldkopf">
      <b>{f.label}</b>
      {f.bereich && <span>{f.bereich}</span>}
    </div>
  );
}

function EinFeld({ f, werte, setzen }: { f: Feld; werte: Werte; setzen: (k: string, v: number | string | boolean) => void }) {
  const zahl = Number(werte[f.key] ?? 0);

  switch (f.baustein) {
    case "lineal":
      return (
        <div>
          <Kopf f={f} />
          <Lineal
            ariaLabel={f.label} wert={zahl} onWert={(v) => setzen(f.key, v)}
            min={f.min ?? 0} max={f.max ?? 100} schritt={f.schritt ?? 1}
            px={f.px} major={f.major} mittel={f.mittel} einheit={f.einheit} dez={f.dez}
            marken={f.marken} werkzeug="magenta"
          />
        </div>
      );
    case "drehring":
      return (
        <div>
          <Kopf f={f} />
          <div style={{ marginTop: 4 }}>
            <Drehring
              ariaLabel={f.label} wert={zahl} onWert={(v) => setzen(f.key, v)}
              min={f.min ?? 0} max={f.max ?? 100} schritt={f.schritt ?? 1}
              gross={f.gross} beschriftet={f.beschriftet} einheit={f.einheit ?? ""}
              unter={f.unter} werkzeug="magenta"
            />
          </div>
        </div>
      );
    case "zaehlwerk":
      return (
        <div>
          <Kopf f={f} />
          <Zaehlwerk
            ariaLabel={f.label} wert={zahl} onWert={(v) => setzen(f.key, v)}
            min={f.min ?? 0} max={f.max ?? 100} schritt={f.schritt ?? 0.1} dez={f.dez ?? 1}
            einheit={f.einheit} schnellwahl={f.schnellwahl} hinweis={f.hinweis} werkzeug="magenta"
          />
        </div>
      );
    case "setzzeile":
      return (
        <Setzzeile
          label={f.label} wert={zahl} onWert={(v) => setzen(f.key, v)}
          einheit={f.einheit} min={f.min ?? 0} max={f.max ?? 1e9} schritt={f.schritt ?? 1} dez={f.dez}
          platzhalter={f.platzhalter} vorschlaege={f.vorschlaege} vorschlaegeImmer={f.vorschlaegeImmer}
          stepper={f.stepper} hinweis={f.hinweis} werkzeug="magenta"
        />
      );
    case "register":
      return (
        <Register
          label={f.label} wert={String(werte[f.key] ?? "")} onWert={(v) => setzen(f.key, v)}
          optionen={f.optionen.map((o) => ({
            wert: String(o.wert),
            label: o.label,
            meta: typeof o.meta === "function" ? o.meta(werte) : o.meta,
          }))}
          maxHoehe={f.maxHoehe} werkzeug="magenta"
        />
      );
    case "schalter":
      return <Schalter label={f.label} an={Boolean(werte[f.key])} onSchalten={(an) => setzen(f.key, an)} />;
  }
}

export default function Felder({
  felder, werte, setzen,
}: {
  felder: Feld[];
  werte: Werte;
  setzen: (k: string, v: number | string | boolean) => void;
}) {
  const sichtbar = felder.filter((f) => !f.wenn || f.wenn(werte));
  const gruppen: { breit: boolean; felder: Feld[] }[] = [];
  for (const f of sichtbar) {
    const breit = Boolean(f.breit);
    const letzte = gruppen[gruppen.length - 1];
    if (letzte && letzte.breit === breit && !breit) letzte.felder.push(f);
    else gruppen.push({ breit, felder: [f] });
  }

  return (
    <>
      {gruppen.map((g, i) => (
        <div key={i} className={g.breit ? "kb-rechner__breit" : "kb__zweispalt kb-rechner__paar"}>
          {g.felder.map((f) => (
            <EinFeld key={f.key} f={f} werte={werte} setzen={setzen} />
          ))}
        </div>
      ))}
    </>
  );
}
