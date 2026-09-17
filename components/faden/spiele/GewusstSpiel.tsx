"use client";

/**
 * „Schon gewusst" im Zeitungssatz.
 *
 * 🚨 Auch hierfür gibt es im Handoff keine Vorlage. Das Rubbeln bleibt — es IST das Spiel,
 * und der Auftrag lautete umstylen, nicht abschaffen. Was fällt, ist das Drumherum: das
 * Sägezahn-Ticket, die Münze, der Kasten. Übrig bleibt eine Fläche mit Haarlinie, über die
 * eine schraffierte Schicht liegt — dieselbe Schraffur, die v2 für seine Anzeigenplatzhalter
 * benutzt (Handoff 1271: `repeating-linear-gradient(135deg, …)`).
 *
 * Feld aus dem CMS: `text`.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import SpielKopf from "./SpielKopf";

/** Ab so viel freigerubbelter Fläche deckt sich der Rest von selbst auf. */
const SCHWELLE = 0.45;
const RADIUS = 22;

export default function GewusstSpiel({ felder }: { felder: Record<string, string> }) {
  const flaeche = useRef<HTMLDivElement>(null);
  const tuch = useRef<HTMLCanvasElement>(null);
  const [frei, setFrei] = useState(false);
  const malt = useRef(false);

  /** Die Schraffur auf das Tuch legen — bei jeder Größenänderung neu. */
  const decken = useCallback(() => {
    const c = tuch.current;
    const box = flaeche.current;
    if (!c || !box || frei) return;
    const { width: w, height: h } = box.getBoundingClientRect();
    if (w < 2 || h < 2) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
    c.style.width = `${w}px`;
    c.style.height = `${h}px`;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    // 🚨 Die Farben aus dem Verzeichnis lesen, nicht abschreiben. Auf einer Leinwand
    // gibt es keine Custom Properties — also einmal am Element nachschlagen. Stand vorher
    // als #ebeae7/#f3f1ec hier drin und wäre bei jeder Palettenänderung liegengeblieben.
    const t = getComputedStyle(box);
    const token = (name: string, ersatz: string) => t.getPropertyValue(name).trim() || ersatz;
    ctx.scale(dpr, dpr);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = token("--placeholder", "#ebeae7");
    ctx.fillRect(0, 0, w, h);
    // Schraffur 135°, 6 px hell / 6 px dunkel — wie der Anzeigenplatzhalter der Vorlage.
    ctx.strokeStyle = token("--paper", "#faf9f6");
    ctx.lineWidth = 6;
    for (let x = -h; x < w + h; x += 12) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + h, h);
      ctx.stroke();
    }
    // 🚨 Die Aufforderung gehört AUFS Los, nicht darunter: ein Los ohne Aufdruck sieht
    // aus wie eine leere Fläche. Sie stand früher so da und ist beim Umstylen verloren
    // gegangen. Sie wird mitgerubbelt — deshalb steht sie auf der Leinwand und nicht im
    // HTML. Die Sterne sind dieselben wie in der Vorlage, nur in Tinte statt in Weiß:
    // auf dem hellen Los wäre Weiß unlesbar.
    const grad = Math.max(12, Math.min(17, Math.round(w / 34)));
    ctx.save();
    ctx.fillStyle = token("--ink-45", "rgba(51,74,39,.45)");
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `italic 600 ${grad}px ${token("--serif", "Georgia, serif")}`;
    // Sperrung wie bei einer Versalienzeile im Satz; ältere Browser können sie nicht,
    // dann steht das Wort eben enger — kein Grund, gar nichts zu schreiben.
    try { (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${(grad * 0.16).toFixed(1)}px`; } catch { /* kann der Browser nicht */ }
    ctx.fillText("✦ ✦  ZUM AUFDECKEN RUBBELN  ✦ ✦", w / 2, h / 2);
    ctx.restore();
  }, [frei]);

  useEffect(() => {
    decken();
    const box = flaeche.current;
    if (!box || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(decken);
    ro.observe(box);
    return () => ro.disconnect();
  }, [decken]);

  /** Anteil bereits freigelegter Fläche — grob, über ein Raster statt jeden Bildpunkt. */
  const anteilFrei = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const d = ctx.getImageData(0, 0, w, h).data;
    let leer = 0, geprueft = 0;
    for (let i = 3; i < d.length; i += 4 * 40) { geprueft++; if (d[i] === 0) leer++; }
    return geprueft ? leer / geprueft : 0;
  };

  const reiben = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!malt.current || frei) return;
    const c = tuch.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const r = c.getBoundingClientRect();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(e.clientX - r.left, e.clientY - r.top, RADIUS, 0, Math.PI * 2);
    ctx.fill();
    if (anteilFrei(ctx, c.width, c.height) > SCHWELLE) setFrei(true);
  };

  return (
    <div className="spiel spiel--gewusst">
      <SpielKopf kicker="Schon gewusst" hinweis={frei ? "Aufgedeckt" : "Freirubbeln"} />
      <div className="spiel-gewusst__flaeche" ref={flaeche}>
        <p className="spiel-gewusst__text">{felder.text ?? ""}</p>
        {!frei && (
          <canvas
            className="spiel-gewusst__tuch"
            ref={tuch}
            onPointerDown={(e) => { malt.current = true; e.currentTarget.setPointerCapture(e.pointerId); reiben(e); }}
            onPointerMove={reiben}
            onPointerUp={() => { malt.current = false; }}
            onPointerLeave={() => { malt.current = false; }}
          />
        )}
      </div>
      {/* Ohne Zeigegerät geht Rubbeln nicht — deshalb derselbe Weg über die Tastatur.
          Der Text steht ohnehin im HTML und wird vorgelesen; das Tuch ist reine Optik. */}
      {!frei && (
        <button type="button" className="spiel-gewusst__wink strich-link" onClick={() => setFrei(true)}>
          Mit dem Finger freirubbeln — oder hier aufdecken
        </button>
      )}
    </div>
  );
}
