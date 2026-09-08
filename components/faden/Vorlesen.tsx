"use client";

/** Textlink „Vorlesen“: liest den Inhalt des Elements mit der übergebenen id vor (Web Speech API). */
import { useFaden } from "./FadenProvider";

export default function Vorlesen({ zielId }: { zielId: string }) {
  const { toast } = useFaden();
  const vorlesen = () => {
    if (!("speechSynthesis" in window)) { toast("Vorlesen wird von diesem Browser nicht unterstützt."); return; }
    if (window.speechSynthesis.speaking) { window.speechSynthesis.cancel(); return; }
    const el = document.getElementById(zielId);
    if (!el) return;
    const u = new SpeechSynthesisUtterance(el.innerText.slice(0, 6000));
    u.lang = "de-DE";
    window.speechSynthesis.speak(u);
  };
  return <button type="button" className="textlink textlink--still" onClick={vorlesen}>Vorlesen</button>;
}
