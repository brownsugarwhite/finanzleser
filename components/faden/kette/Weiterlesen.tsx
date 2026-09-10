"use client";

/**
 * „Dazu wird oft gefragt“ am Ende eines Fachabschnitts: die Leo-Fragen aus dem CMS
 * (leo_fragen) als Chips. Der Wortwechsel läuft an Ort und Stelle ab — direkt unter dem
 * Chip, nicht am Ende des Fadens.
 *
 * 🚨 Der Chip WIRD zur Frage und verschwindet dabei. Beim Antippen wird sein Rechteck
 * gemerkt, der Chip fällt aus der Reihe, und die Sprechblase fährt von genau dieser
 * Stelle in ihre eigene Lage. Danach schreibt Leo seine Antwort darunter ein
 * (Schreibmaschine wie im Prototyp), und der Blick läuft mit wie in einem echten Chat.
 *
 * 🚨 Und Leo lässt das Gespräch nicht abreißen: die noch nicht gestellten Fragen rücken
 * unter die frische Antwort nach, dazu immer „Etwas anderes fragen“. Unter einer Antwort
 * steht also nie nichts mehr zum Antippen.
 *
 * SEO: Alle Antworten stehen vollständig im SSR-HTML, nur ausgeblendet. Deshalb bleibt
 * die Renderreihenfolge die des CMS; die Reihenfolge des Gesprächs macht `order`.
 */
import { useLayoutEffect, useRef, useState } from "react";
import gsap from "@/lib/gsapConfig";
import type { FadenFrage } from "@/lib/types";
import { FrageBlase, LeoRede } from "@/components/faden/leo/Blase";
import { reduzierteBewegung } from "@/lib/faden/belohnung";
import { mitlaufen, tippenText } from "@/lib/faden/tippen";

const FLUG = 0.5;    // Sekunden vom Chip in die Blase

export default function Weiterlesen({ fragen }: { fragen: FadenFrage[] }) {
  const [gestellt, setGestellt] = useState<number[]>([]);
  const chips = useRef<Map<number, HTMLButtonElement>>(new Map());
  const blasen = useRef<Map<number, HTMLDivElement>>(new Map());
  const saetze = useRef<Map<number, HTMLParagraphElement>>(new Map());
  // Das Rechteck des angetippten Chips. Es muss VOR dem Rendern gemerkt werden — danach
  // ist der Chip aus der Reihe verschwunden und hat kein Rechteck mehr.
  const start = useRef<{ nr: number; von: DOMRect } | null>(null);

  const waehlen = (i: number) => {
    const chip = chips.current.get(i);
    start.current = chip ? { nr: i, von: chip.getBoundingClientRect() } : null;
    setGestellt((alt) => (alt.includes(i) ? alt : [...alt, i]));
  };

  useLayoutEffect(() => {
    const s = start.current;
    start.current = null;
    if (!s) return;
    const blase = blasen.current.get(s.nr);
    const satz = saetze.current.get(s.nr);
    const schreiben = () => { if (satz) tippenText(satz, fragen[s.nr].antwort, mitlaufen(satz)); };
    if (!blase || reduzierteBewegung()) { schreiben(); return; }
    if (satz) satz.textContent = "";   // Leo beginnt bei null, sonst gäbe es nichts einzuschreiben
    // 🚨 Gleichmäßig skalieren, nicht auf die Chipform stauchen. Chip und Blase haben
    // ganz verschiedene Seitenverhältnisse; eine getrennte Y-Skalierung quetscht die
    // Schrift zur Unkenntlichkeit. Ein weicher Maßstab plus Aufblenden liest sich als
    // dieselbe Sache, die größer wird.
    const nach = blase.getBoundingClientRect();
    const mass = Math.min(1, s.von.width / Math.max(1, nach.width));
    gsap.set(blase, { transformOrigin: "0 0", x: s.von.left - nach.left, y: s.von.top - nach.top, scale: mass, opacity: 0.3 });
    gsap.to(blase, { x: 0, y: 0, scale: 1, opacity: 1, duration: FLUG, ease: "power3.out" });
    // 🚨 Der Inhalt hängt NICHT am onComplete des Tweens.
    // GSAP tickt über requestAnimationFrame; steht der still (verborgener Tab, ein Fehler
    // im Tween), käme onComplete nie — die Blase bliebe auf Chipgröße gestaucht und Leos
    // Antwort stünde nie da. Also entscheidet die Uhr: nach der Flugzeit wird der
    // Endzustand hart gesetzt und geschrieben.
    const uhr = window.setTimeout(() => { gsap.set(blase, { clearProps: "all" }); schreiben(); }, FLUG * 1000 + 60);
    return () => window.clearTimeout(uhr);
  }, [gestellt, fragen]);

  const zumEingabefeld = () => {
    const feld = document.getElementById("frage") as HTMLInputElement | null;
    feld?.focus();
  };

  const offeneFragen = fragen.map((_, i) => i).filter((i) => !gestellt.includes(i));
  return (
    <div className="weiterlesen">
      {gestellt.length === 0 && <span className="kicker kicker--gruen">Dazu wird oft gefragt</span>}
      {fragen.map((f, i) => {
        const platz = gestellt.indexOf(i);
        return (
          <div key={i} className="antwort" hidden={platz < 0} style={platz < 0 ? undefined : { order: platz + 1 }}>
            <div className="wort wort--frage">
              <FrageBlase text={f.frage} blaseRef={(el) => { if (el) blasen.current.set(i, el); else blasen.current.delete(i); }}>
                <p>{f.frage}</p>
              </FrageBlase>
            </div>
            <div className="wort wort--leo">
              <span className="kicker kicker--gruen">Leo</span>
              <LeoRede text={f.antwort}>
                <p ref={(el) => { if (el) saetze.current.set(i, el); else saetze.current.delete(i); }}>{f.antwort}</p>
                {f.quellen.length > 0 && (
                  <div className="quellen"><b>Quellen</b>{f.quellen.map((q, j) => <span key={j}>› {q}</span>)}</div>
                )}
              </LeoRede>
            </div>
          </div>
        );
      })}
      <div className="fragen" style={{ order: fragen.length + 2 }}>
        {gestellt.length > 0 && offeneFragen.length > 0 && <span className="kicker kicker--gruen fragen__kopf">Sie könnten Leo auch fragen</span>}
        {offeneFragen.map((i) => (
          <button
            key={i}
            type="button"
            ref={(el) => { if (el) chips.current.set(i, el); else chips.current.delete(i); }}
            className="chip"
            onClick={() => waehlen(i)}
          >
            {fragen[i].frage}
          </button>
        ))}
        {gestellt.length > 0 && <button type="button" className="chip chip--still" onClick={zumEingabefeld}>Etwas anderes fragen</button>}
      </div>
    </div>
  );
}
