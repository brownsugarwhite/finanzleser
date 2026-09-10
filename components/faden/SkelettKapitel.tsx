"use client";

/**
 * Das Skelett, das im Moment des Klicks an den Faden gehängt wird — Port von
 * `ladeDann` aus dem Prototyp (`docs/prototype/src/05-js-neu.html:246-247`).
 *
 * Der Prototyp hatte alle Inhalte inline und trotzdem ein Skelett: Er zeigt zuerst
 * einen Platzhalter und springt dorthin, dann kommt der Inhalt. Der Platzhalter ist
 * deshalb kein Schmuck, sondern der Anker, auf den der Sprung sofort zielen kann.
 *
 * 🚨 Seit dem 10.09.2026 hat das Skelett die Silhouette seines Ziels (lib/faden/skelett.ts):
 * dieselbe Kopfzeile wie das Kapitel (KapitelKopf, samt Anzeige), der echte Titel aus dem
 * Link, darunter die Form eines Ratgebers, eines Werkzeugs, einer Rubrik, eines Begriffs.
 * Das Kapitel erscheint später an genau dieser Stelle — Kopfzeile auf Kopfzeile, Titel auf
 * Titel — und blendet nur über die Deckkraft ein. Ein einziges Skelett für alles hieß:
 * beim Austausch springt der Titel um 200 px, weil die Silhouette nicht stimmte.
 *
 * Es füllt mindestens das Bild (app/faden.css), damit der Sprung dorthin immer möglich ist.
 */
import { useLayoutEffect, useRef } from "react";
import { merkeKnoten, zeigeAnfang } from "@/lib/faden/scrollen";
import type { SkelettSorte } from "@/lib/faden/skelett";
import KapitelKopf from "./KapitelKopf";

/** Eine schimmernde Zeile; `h` in Pixeln, Standard sind 12 (Fließtext). */
function Z({ w, h }: { w: string; h?: number }) {
  return <i className="skelett__zeile" style={{ width: w, height: h }} />;
}

function Zeilen({ breiten, h }: { breiten: string[]; h?: number }) {
  return <>{breiten.map((w, i) => <Z key={i} w={w} h={h} />)}</>;
}

function Titel({ titel, klasse, w, h }: { titel?: string; klasse: string; w: string; h: number }) {
  return titel ? <h1 className={klasse}>{titel}</h1> : <Z w={w} h={h} />;
}

export default function SkelettKapitel({ sorte = "seite", titel, pfad = [], lange }: { sorte?: SkelettSorte; titel?: string; pfad?: string[]; lange?: boolean }) {
  const node = useRef<HTMLElement>(null);

  // Sofort nach dem Einfügen dorthin springen (Prototyp: `anhaengen` + `zeigeAnfang`).
  // `immer`, weil der Sprung vom Leser ausgelöst ist — die Lesestelle hat `navigieren`
  // vorher gemerkt.
  useLayoutEffect(() => {
    merkeKnoten(node.current);
    zeigeAnfang(node.current, true);
  }, []);

  let koerper: React.ReactNode;
  if (sorte === "ratgeber") {
    koerper = (
      <>
        <Z w="34%" h={12} />
        <Titel titel={titel} klasse="artikel__titel" w="46%" h={22} />
        <div className="skelett__block"><Z w="88%" h={34} /><Z w="62%" h={34} /></div>
        <div className="skelett__block"><Zeilen breiten={["96%", "90%", "58%"]} h={14} /></div>
        <div className="skelett__autor"><i className="skelett__ring" /><Z w="42%" h={12} /></div>
        <i className="skelett__bild" />
        <Z w="40%" h={12} />
        <Z w="52%" h={22} />
        <div className="skelett__block"><Zeilen breiten={["100%", "97%", "99%", "94%", "70%"]} h={14} /></div>
        <div className="skelett__inhalt"><Z w="14%" h={11} /><Zeilen breiten={["58%", "64%", "49%", "71%", "55%"]} h={14} /></div>
        <Z w="22%" h={11} />
        <Z w="72%" h={26} />
        <div className="skelett__block"><Zeilen breiten={["100%", "98%", "96%", "99%", "93%", "64%"]} h={14} /></div>
      </>
    );
  } else if (sorte === "werkzeug") {
    koerper = (
      <>
        <Z w="34%" h={12} />
        <Z w="22%" h={20} />
        <Titel titel={titel} klasse="artikel__untertitel" w="70%" h={34} />
        <div className="skelett__block"><Zeilen breiten={["94%", "66%"]} h={14} /></div>
        <i className="skelett__karte" />
      </>
    );
  } else if (sorte === "rubrik" || sorte === "thema") {
    koerper = (
      <>
        <Z w="34%" h={12} />
        <Titel titel={titel} klasse="artikel__untertitel" w="60%" h={34} />
        <div className="skelett__block"><Zeilen breiten={["90%", "50%"]} h={14} /></div>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skelett__eintrag"><Z w="30%" h={11} /><Z w="80%" h={18} /><Z w="95%" h={12} /></div>
        ))}
      </>
    );
  } else if (sorte === "begriff") {
    koerper = (
      <>
        <Z w="34%" h={12} />
        <Z w="18%" h={20} />
        <Titel titel={titel} klasse="artikel__untertitel" w="50%" h={34} />
        <div className="skelett__block"><Zeilen breiten={["100%", "97%", "92%", "60%"]} h={14} /></div>
      </>
    );
  } else {
    koerper = (
      <>
        <Z w="34%" h={12} />
        <Titel titel={titel} klasse="artikel__untertitel" w="55%" h={34} />
        <div className="skelett__block"><Zeilen breiten={["100%", "96%", "98%", "72%"]} h={14} /></div>
        <i className="skelett__karte" />
      </>
    );
  }

  return (
    <section className={`kapitel kapitel--skelett kapitel--skelett-${sorte}`} ref={node} aria-busy="true">
      <KapitelKopf pfad={pfad} />
      <div className="kapitel__inhalt">
        <div className="artikel skelett">
          <span className="kicker skelett__hinweis">{lange ? "Dauert länger als gewohnt – der Faden wartet" : "Kette wird geladen"}</span>
          {koerper}
        </div>
      </div>
    </section>
  );
}
