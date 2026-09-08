"use client";

/**
 * Leos Wochenbrief: ein Feld, kein Formular. Anbindung an /api/newsletter kommt mit
 * Meilenstein 7; bis dahin bestätigt ein Toast die Eingabe.
 */
import { useState } from "react";
import { useFaden } from "./FadenProvider";

export default function WochenbriefForm({ klein }: { klein?: boolean }) {
  const { toast } = useFaden();
  const [mail, setMail] = useState("");
  return (
    <form
      className={klein ? "wb-form wb-form--klein" : "wb-form reihe"}
      onSubmit={(e) => {
        e.preventDefault();
        if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(mail)) { toast("Bitte eine gültige E-Mail-Adresse eintragen."); return; }
        toast("Danke. Der Wochenbrief-Versand wird mit Meilenstein 7 angeschlossen.");
        setMail("");
      }}
    >
      <input type="email" placeholder="ihre@adresse.de" aria-label="E-Mail für den Wochenbrief" value={mail} onChange={(e) => setMail(e.target.value)} />
      <button className="btn btn--klein btn--primary" type="submit">Eintragen</button>
    </form>
  );
}
