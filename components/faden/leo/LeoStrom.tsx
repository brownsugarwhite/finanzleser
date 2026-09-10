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
import { mitlaufen } from "@/lib/faden/tippen";
import { FrageBlase, LeoRede } from "./Blase";

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
      <LeoRede text={text}>
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
      </LeoRede>
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
  //  - Leos Antwort läuft mit wie in einem Chat (unten), siehe nächsten Effekt. Kein
  //    Sprung an ihren Anfang, wenn sie fertig ist — das riss den Leser vom Ende weg.
  useEffect(() => {
    if (!letzte) return;
    const el = document.getElementById(`leo-${letzte.id}`);
    if (!el) return;
    merkeKnoten(el);
    if (letzte.role === "user") zeigeAnfang(el, true);
  }, [letzte?.id, letzte?.role]);

  // 🚨 Mitlaufen beim Schreiben (Regel 3 des Scroll-Plans): Solange die Antwort strömt,
  // bleibt ihr Ende über der Eingabe — hart, um genau die Differenz (lib/faden/tippen.ts
  // `mitlaufen`), ausgelöst vom Wachsen des Knotens, nicht von jedem Token. Vorher stand
  // hier `if (laeuft) return` — die Antwort wuchs 400 px unter den Rand, ohne dass sich
  // etwas bewegte. Wer während des Schreibens nach oben scrollt (Rad, Taste, Finger),
  // will zurücklesen: dann hört das Mitlaufen für diese Antwort auf.
  useEffect(() => {
    if (!letzte || letzte.role !== "assistant" || !laeuft) return;
    const el = document.getElementById(`leo-${letzte.id}`);
    if (!el) return;
    let folge = folgt();
    const nach = mitlaufen(el);
    let fingerY = 0;
    const rad = (ev: WheelEvent) => { if (ev.deltaY < 0) folge = false; };
    const taste = (ev: KeyboardEvent) => { if (["ArrowUp", "PageUp", "Home"].includes(ev.key)) folge = false; };
    const fingerAn = (ev: TouchEvent) => { fingerY = ev.touches[0]?.clientY ?? 0; };
    const finger = (ev: TouchEvent) => { const y = ev.touches[0]?.clientY ?? 0; if (y > fingerY + 8) folge = false; };
    const opts: AddEventListenerOptions = { passive: true };
    window.addEventListener("wheel", rad, opts);
    window.addEventListener("keydown", taste, opts);
    window.addEventListener("touchstart", fingerAn, opts);
    window.addEventListener("touchmove", finger, opts);
    const ro = new ResizeObserver(() => { if (folge) nach(); });
    ro.observe(el);
    if (folge) nach();
    return () => {
      ro.disconnect();
      window.removeEventListener("wheel", rad);
      window.removeEventListener("keydown", taste);
      window.removeEventListener("touchstart", fingerAn);
      window.removeEventListener("touchmove", finger);
    };
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
          <div key={m.id} id={`leo-${m.id}`} className="wort wort--frage"><FrageBlase text={getMessageText(m)}><p>{getMessageText(m)}</p></FrageBlase></div>
        ) : (
          <div key={m.id} id={`leo-${m.id}`}><LeoWort m={m} laeuft={laeuft && i === nachrichten.length - 1} /></div>
        )
      ))}
      {status === "submitted" && letzte?.role === "user" && (
        <div className="wort wort--leo"><span className="kicker kicker--gruen">Leo</span><LeoRede><div className="tippt" aria-label="Leo schreibt"><i /><i /><i /></div></LeoRede></div>
      )}
      {status === "error" && fehler && (
        <div className="wort wort--leo wort--fehler">
          <span className="kicker kicker--pink">Leo · gerade nicht erreichbar</span>
          <LeoRede fehler>
            <p>{/429|limit|pause/i.test(fehler.message) ? "Leo macht gerade eine kurze Pause. Bitte versuchen Sie es in einer Minute erneut." : "Leo ist gerade nicht erreichbar. Bitte versuchen Sie es später noch einmal."}</p>
          </LeoRede>
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
