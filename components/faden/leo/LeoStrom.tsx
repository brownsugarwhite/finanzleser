"use client";

/**
 * Leo im Faden: Fragen und Antworten zum lebenden Kapitel, direkt unter der Seite.
 * Die Antworten kommen über /api/chat (SSE-Proxy aufs Heroku-Backend) als
 * AI-SDK-Stream; nichts davon steht im SSR-HTML. Beim Kapitelwechsel friert der
 * Schnappschuss den Wortwechsel mit ein (FadenProvider), das neue Kapitel beginnt leer.
 */
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { useFaden } from "@/components/faden/FadenProvider";
import { getMessageText, getSources, type LeoUIMessage } from "@/lib/ai/leoMessage";
import { kopfHoehe, zeigeAnfang, merkeKnoten, folgt } from "@/lib/faden/scrollen";
import { FrageBlase, LeoBlase } from "./Blase";

// Siehe components/faden/leo/LeoMarkdown.tsx: der Markdown-Parser wird erst geladen,
// wenn eine Antwort da ist, nicht auf jeder Faden-Seite.
const LeoMarkdown = dynamic(() => import("./LeoMarkdown"), { ssr: false });

interface Chip { text: string; tun: () => void; art?: "leo" | "still" }

function LeoWort({ m, laeuft }: { m: LeoUIMessage; laeuft: boolean }) {
  const { toast } = useFaden();
  const text = getMessageText(m);
  const quellen = getSources(m);
  const vorlesen = () => {
    if (!("speechSynthesis" in window)) { toast("Vorlesen wird von diesem Browser nicht unterstützt."); return; }
    if (window.speechSynthesis.speaking) { window.speechSynthesis.cancel(); return; }
    const u = new SpeechSynthesisUtterance(text.slice(0, 6000)); u.lang = "de-DE"; window.speechSynthesis.speak(u);
  };
  const kopieren = async () => { try { await navigator.clipboard.writeText(text); toast("Antwort kopiert"); } catch { /* egal */ } };
  return (
    <div className="wort wort--leo">
      <span className="kicker kicker--gruen">Leo</span>
      <LeoBlase>
        {!text && laeuft ? (
          <div className="tippt" aria-label="Leo schreibt"><i /><i /><i /></div>
        ) : (
          <div className="prose leo-markdown">
            <LeoMarkdown text={text} />
            {laeuft && <span className="cursor" aria-hidden="true" />}
          </div>
        )}
        {!laeuft && quellen.length > 0 && (
          <div className="quellen"><b>Quellen</b>{quellen.map((q, i) => <span key={i}>› {q.title}{q.pages ? ` · ${q.pages}` : ""}</span>)}</div>
        )}
      </LeoBlase>
      {!laeuft && text && (
        <div className="werkzeuge">
          <button type="button" className="textlink textlink--still" onClick={vorlesen}>Vorlesen</button>
          <button type="button" className="textlink textlink--still" onClick={kopieren}>Kopieren</button>
        </div>
      )}
    </div>
  );
}

export default function LeoStrom() {
  const { leo, fragen, navigieren } = useFaden();
  const pathname = usePathname();
  const { nachrichten, status, fehler } = leo;
  const letzte = nachrichten[nachrichten.length - 1];
  const laeuft = status === "submitted" || status === "streaming";
  const [chipsWeg, setChipsWeg] = useState<string>("");

  // Scroll-Grammatik des Prototyps (lib/faden/scrollen.ts):
  //  - Eigene Frage = vom Leser ausgelöster Sprung → `immer`, rollt unter den Kopf.
  //  - Leos Antwort → nur wenn der Leser am Ende steht (`folgt()`). Wer hochgescrollt
  //    liest, wird von einer eintreffenden Antwort nicht weggerissen.
  useEffect(() => {
    if (!letzte) return;
    const el = document.getElementById(`leo-${letzte.id}`);
    if (!el) return;
    merkeKnoten(el);
    if (letzte.role === "user") { zeigeAnfang(el, true); return; }
    if (laeuft) return;                 // erst wenn die Antwort steht, nicht bei jedem Token
    if (folgt()) zeigeAnfang(el);
  }, [letzte?.id, letzte?.role, laeuft]);

  // Folge-Chips nach einer fertigen Antwort: Kurzfassung, „Dazu passt“, Werkzeug des Kapitels.
  const chips = useMemo<Chip[]>(() => {
    if (typeof document === "undefined" || !letzte || letzte.role !== "assistant" || laeuft || chipsWeg === letzte.id) return [];
    const live = document.getElementById("kapitel-live");
    if (!live) return [];
    const out: Chip[] = [];
    if (live.querySelector(".aktionen")) out.push({ text: "Kurzfassung von Leo", art: "leo", tun: () => document.dispatchEvent(new CustomEvent("faden:kurzfassung")) });
    live.querySelectorAll<HTMLAnchorElement>(".dazu a.dazu__eintrag").forEach((a, i) => { if (i < 2) out.push({ text: a.textContent || "", tun: () => navigieren(a.getAttribute("href") || "/") }); });
    const kasten = live.querySelector<HTMLElement>("[data-werkzeug]");
    const titel = kasten?.querySelector("h3")?.textContent;
    if (kasten && titel) out.push({ text: `Zum Werkzeug „${titel}“`, art: "still", tun: () => { const reduziert = window.matchMedia("(prefers-reduced-motion: reduce)").matches; window.scrollTo({ top: kasten.getBoundingClientRect().top + window.scrollY - kopfHoehe() - 12, behavior: reduziert ? "auto" : "smooth" }); } });
    return out.slice(0, 4);
  }, [letzte, laeuft, chipsWeg, navigieren, pathname]);

  if (!nachrichten.length && !fehler) return <div className="leo-strom" id="leo-strom" />;
  return (
    <div className="leo-strom" id="leo-strom" aria-live="polite">
      {nachrichten.map((m, i) => (
        m.role === "user" ? (
          <div key={m.id} id={`leo-${m.id}`} className="wort wort--frage"><FrageBlase><p>{getMessageText(m)}</p></FrageBlase></div>
        ) : (
          <div key={m.id} id={`leo-${m.id}`}><LeoWort m={m} laeuft={laeuft && i === nachrichten.length - 1} /></div>
        )
      ))}
      {status === "submitted" && letzte?.role === "user" && (
        <div className="wort wort--leo"><span className="kicker kicker--gruen">Leo</span><LeoBlase><div className="tippt" aria-label="Leo schreibt"><i /><i /><i /></div></LeoBlase></div>
      )}
      {status === "error" && fehler && (
        <div className="wort wort--leo wort--fehler">
          <span className="kicker kicker--pink">Leo · gerade nicht erreichbar</span>
          <LeoBlase fehler>
            <p>{/429|limit|pause/i.test(fehler.message) ? "Leo macht gerade eine kurze Pause. Bitte versuchen Sie es in einer Minute erneut." : "Leo ist gerade nicht erreichbar. Bitte versuchen Sie es später noch einmal."}</p>
          </LeoBlase>
          {letzte?.role === "user" && <div className="werkzeuge"><button type="button" className="textlink" onClick={() => fragen(getMessageText(letzte))}>Noch einmal fragen</button></div>}
        </div>
      )}
      {chips.length > 0 && (
        <div className="chips leo-chips">
          {chips.map((c) => <button key={c.text} type="button" className={"chip" + (c.art === "leo" ? " chip--leo" : c.art === "still" ? " chip--still" : "")} onClick={() => { setChipsWeg(letzte?.id || ""); c.tun(); }}>{c.text}</button>)}
        </div>
      )}
    </div>
  );
}
