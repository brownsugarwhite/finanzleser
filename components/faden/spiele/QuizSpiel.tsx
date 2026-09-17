"use client";

/**
 * Quiz im Zeitungssatz — 1:1 nach Handoff 1090–1096.
 *
 * Felder aus dem CMS: `frage`, `a`…`d`, `richtig` („B"), `aufloesung`.
 */
import { useState } from "react";
import SpielKopf from "./SpielKopf";
import Antwortliste from "./Antwortliste";

export default function QuizSpiel({ felder }: { felder: Record<string, string> }) {
  const [gewaehlt, setGewaehlt] = useState<number | null>(null);
  const richtig = (felder.richtig ?? "").toUpperCase().trim().charAt(0);
  const antworten = ["a", "b", "c", "d"]
    .filter((k) => felder[k])
    .map((k) => ({ zeichen: k.toUpperCase(), text: felder[k], richtig: k.toUpperCase() === richtig }));
  const getroffen = gewaehlt !== null && antworten[gewaehlt].richtig;

  if (!antworten.length) return null;

  return (
    <div className="spiel spiel--quiz">
      <SpielKopf kicker="Quiz" hinweis="Eine Frage" />
      <p className="spiel__frage">{felder.frage ?? ""}</p>
      <Antwortliste antworten={antworten} gewaehlt={gewaehlt} onWahl={setGewaehlt} />
      <p className={"spiel__aufloesung" + (gewaehlt === null ? "" : getroffen ? " spiel__aufloesung--richtig" : " spiel__aufloesung--falsch")} aria-live="polite">
        {gewaehlt !== null && (
          <>
            <b>{getroffen ? "Richtig." : "Leider nicht."}</b> {felder.aufloesung || ""}
          </>
        )}
      </p>
    </div>
  );
}
