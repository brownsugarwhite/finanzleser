"use client";

/**
 * „Mythos oder Fakt" im Zeitungssatz.
 *
 * 🚨 Für dieses Spiel gibt es im Handoff KEINE Vorlage (null Treffer für „Mythos" im
 * ganzen Dokument). Es übernimmt deshalb das Muster, das v2 für das Quiz vorgibt
 * (Zeilen 1090–1096): Behauptung wie eine Quiz-Frage, zwei Zeilen im Optionsraster,
 * Auflösung darunter. Damit sieht es aus wie etwas, das aus derselben Werkstatt kommt.
 *
 * Felder aus dem CMS: `aussage` (oder `behauptung`), `stimmt` („ja…" = Fakt), `aufloesung`.
 */
import { useState } from "react";
import SpielKopf from "./SpielKopf";
import Antwortliste from "./Antwortliste";

export default function MythosSpiel({ felder }: { felder: Record<string, string> }) {
  const [gewaehlt, setGewaehlt] = useState<number | null>(null);
  const istFakt = (felder.stimmt ?? "").toLowerCase().startsWith("ja");
  const behauptung = felder.aussage ?? felder.behauptung ?? "";

  const antworten = [
    { zeichen: "M", text: "Das ist ein Mythos.", richtig: !istFakt },
    { zeichen: "F", text: "Das ist ein Fakt.", richtig: istFakt },
  ];
  const getroffen = gewaehlt !== null && antworten[gewaehlt].richtig;

  return (
    <div className="spiel spiel--mythos">
      <SpielKopf kicker="Mythos oder Fakt" hinweis="Zwei Antworten, eine stimmt" />
      <p className="spiel__frage">{behauptung}</p>
      <Antwortliste antworten={antworten} gewaehlt={gewaehlt} onWahl={setGewaehlt} />
      <p className={"spiel__aufloesung" + (gewaehlt === null ? "" : getroffen ? " spiel__aufloesung--richtig" : " spiel__aufloesung--falsch")} aria-live="polite">
        {gewaehlt !== null && (
          <>
            <b>{getroffen ? "Stimmt." : "Stimmt nicht."}</b>{" "}
            {felder.aufloesung || `Es ist ${istFakt ? "ein Fakt" : "ein Mythos"}.`}
          </>
        )}
      </p>
    </div>
  );
}
