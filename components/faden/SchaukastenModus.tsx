"use client";

/**
 * Setzt `data-schaukasten` auf den Body, solange eine Schaukasten-Seite offen ist.
 *
 * Zwei Dinge hängen daran (app/faden.css):
 *  1. **Anzeigen sind aus.** Sie laden nach und schieben dabei den ganzen Faden —
 *     beim Durchsehen zerstört das jeden Fluss. Werbung wird gesondert geprüft.
 *  2. **Alles ist ausgeklappt.** Was sonst hinter einem Klick liegt (Leos Antworten
 *     unter „Dazu wird oft gefragt", die Kurzfassung), steht hier offen da — man soll
 *     jedes Element sehen, ohne es erst suchen zu müssen.
 */
import { useEffect } from "react";

export default function SchaukastenModus() {
  useEffect(() => {
    document.body.setAttribute("data-schaukasten", "");
    return () => document.body.removeAttribute("data-schaukasten");
  }, []);
  return null;
}
