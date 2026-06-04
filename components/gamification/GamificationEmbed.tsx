"use client";

import { useState, useRef, useEffect } from "react";

interface Props {
  gamType: string;
  fields: Record<string, string>;
}

const onlyNum = (s: string | undefined) => {
  const n = parseFloat(String(s ?? "").replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

/* ── Mythos oder Fakt – antippen, dann Feedback ── */
function MythosBox({ fields }: { fields: Record<string, string> }) {
  const [answer, setAnswer] = useState<"mythos" | "fakt" | null>(null);
  const isFakt = (fields.stimmt ?? "").toLowerCase().startsWith("ja");
  const correct = answer !== null && (answer === "fakt") === isFakt;
  return (
    <aside className="fl-gam fl-gam-mythos">
      <span className="fl-gam-tag">Mythos oder Fakt?</span>
      <p className="fl-gam-claim">{fields.aussage ?? fields.behauptung ?? ""}</p>
      {answer === null ? (
        <div className="fl-gam-choices">
          <button type="button" className="fl-gam-choice" onClick={() => setAnswer("mythos")}>Mythos</button>
          <button type="button" className="fl-gam-choice" onClick={() => setAnswer("fakt")}>Fakt</button>
        </div>
      ) : (
        <div className={`fl-gam-result ${correct ? "is-correct" : "is-wrong"}`}>
          <strong>{correct ? "Richtig!" : "Leider falsch."}</strong> Es ist {isFakt ? "ein Fakt." : "ein Mythos."}
          <p className="fl-gam-reveal">{fields.aufloesung ?? ""}</p>
        </div>
      )}
    </aside>
  );
}

/* ── Quiz – Multiple-Choice ── */
function QuizBox({ fields }: { fields: Record<string, string> }) {
  const [picked, setPicked] = useState<string | null>(null);
  const opts = ["a", "b", "c", "d"].map((k) => ({ k: k.toUpperCase(), v: fields[k] })).filter((o) => o.v);
  const right = (fields.richtig ?? "").toUpperCase().trim().charAt(0);
  return (
    <aside className="fl-gam fl-gam-quiz">
      <span className="fl-gam-tag">Quiz</span>
      <p className="fl-gam-claim">{fields.frage ?? ""}</p>
      <div className="fl-gam-options">
        {opts.map((o) => {
          const state = picked ? (o.k === right ? "right" : o.k === picked ? "wrong" : "") : "";
          return (
            <button key={o.k} type="button" className={`fl-gam-option ${state}`} disabled={picked !== null} onClick={() => setPicked(o.k)}>
              <span className="fl-gam-option-key">{o.k}</span>
              <span>{o.v}</span>
            </button>
          );
        })}
      </div>
      {picked && (
        <div className={`fl-gam-result ${picked === right ? "is-correct" : "is-wrong"}`}>
          <strong>{picked === right ? "Richtig!" : "Leider falsch."}</strong>
          <p className="fl-gam-reveal">{fields.erklaerung ?? ""}</p>
        </div>
      )}
    </aside>
  );
}

/* ── Schätzfrage – Schieberegler ── */
function SchaetzBox({ fields }: { fields: Record<string, string> }) {
  const min = onlyNum(fields.min) ?? 0;
  const max = Math.max(min + 1, onlyNum(fields.max) ?? 100);
  const answer = onlyNum(fields.antwort) ?? min;
  const unit = fields.einheit ?? "";
  const step = Math.max(1, Math.round((max - min) / 100));
  const [val, setVal] = useState(Math.round((min + max) / 2));
  const [done, setDone] = useState(false);
  const closeness = Math.max(0, 100 - Math.round((Math.abs(val - answer) / (max - min)) * 100));
  const fmt = (n: number) => n.toLocaleString("de-DE");
  return (
    <aside className="fl-gam fl-gam-schaetzen">
      <span className="fl-gam-tag">Schätzfrage</span>
      <p className="fl-gam-claim">{fields.frage ?? ""}</p>
      <div className="fl-gam-slider-row">
        <input type="range" min={min} max={max} step={step} value={val} disabled={done}
          onChange={(e) => setVal(Number(e.target.value))} className="fl-gam-slider" aria-label="Schätzung" />
        <span className="fl-gam-slider-val">{fmt(val)} {unit}</span>
      </div>
      {!done ? (
        <button type="button" className="fl-gam-toggle" onClick={() => setDone(true)}>Schätzung abgeben</button>
      ) : (
        <div className="fl-gam-result is-info">
          Richtig sind <strong>{fmt(answer)} {unit}</strong> – du warst {closeness}% nah dran.
          <p className="fl-gam-reveal">{fields.aufloesung ?? ""}</p>
        </div>
      )}
    </aside>
  );
}

/* ── Karteikarte – 3D-Flip ── */
function KarteBox({ fields }: { fields: Record<string, string> }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <aside className="fl-gam fl-gam-karte">
      <span className="fl-gam-tag">Begriff erklärt</span>
      <button type="button" className={`fl-card${flipped ? " is-flipped" : ""}`} onClick={() => setFlipped((v) => !v)} aria-pressed={flipped}>
        <span className="fl-card-inner">
          <span className="fl-card-face fl-card-front">
            <span className="fl-card-term">{fields.begriff ?? ""}</span>
            <span className="fl-card-hint">Karte umdrehen →</span>
          </span>
          <span className="fl-card-face fl-card-back">
            <span className="fl-card-def">{fields.erklaerung ?? ""}</span>
            <span className="fl-card-hint">← zurück</span>
          </span>
        </span>
      </button>
    </aside>
  );
}

/* ── Schon gewusst – Freirubbeln ── */
function GewusstBox({ fields }: { fields: Record<string, string> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    canvas.width = w;
    canvas.height = h;
    ctx.fillStyle = "#dfe3da";
    ctx.fillRect(0, 0, w, h);
    ctx.font = "600 13px 'Open Sans', system-ui, sans-serif";
    ctx.fillStyle = "#7a8472";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✦ Zum Aufdecken rubbeln ✦", w / 2, h / 2);
    ctx.globalCompositeOperation = "destination-out";
  }, []);

  const scratch = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.arc(clientX - rect.left, clientY - rect.top, 20, 0, Math.PI * 2);
    ctx.fill();
    // grob prüfen, wie viel weggerubbelt ist (jedes 40. Pixel)
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let cleared = 0, total = 0;
    for (let i = 3; i < data.length; i += 4 * 40) { total++; if (data[i] === 0) cleared++; }
    if (total && cleared / total > 0.55) setRevealed(true);
  };

  const onDown = (x: number, y: number) => { drawing.current = true; scratch(x, y); };
  const onMove = (x: number, y: number) => { if (drawing.current) scratch(x, y); };
  const onUp = () => { drawing.current = false; };

  return (
    <aside className="fl-gam fl-gam-gewusst">
      <span className="fl-gam-tag">Schon gewusst?</span>
      <div ref={wrapRef} className={`fl-gam-scratch${revealed ? " is-revealed" : ""}`}>
        <p className="fl-gam-text">{fields.text ?? ""}</p>
        {!revealed && (
          <canvas
            ref={canvasRef}
            className="fl-gam-scratch-canvas"
            onMouseDown={(e) => onDown(e.clientX, e.clientY)}
            onMouseMove={(e) => onMove(e.clientX, e.clientY)}
            onMouseUp={onUp}
            onMouseLeave={onUp}
            onTouchStart={(e) => { const t = e.touches[0]; onDown(t.clientX, t.clientY); }}
            onTouchMove={(e) => { const t = e.touches[0]; onMove(t.clientX, t.clientY); }}
            onTouchEnd={onUp}
          />
        )}
      </div>
    </aside>
  );
}

/* ── Mini-Selbsttest (alt) – Rückwärtskompatibilität, aufklappbar ── */
function TestBox({ fields }: { fields: Record<string, string> }) {
  const [open, setOpen] = useState(false);
  return (
    <aside className="fl-gam fl-gam-quiz">
      <span className="fl-gam-tag">Kurz nachgedacht</span>
      <p className="fl-gam-claim">{fields.frage ?? ""}</p>
      <button type="button" className="fl-gam-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        {open ? "Verbergen" : "Antwort anzeigen"}
        <span className="fl-gam-toggle-icon" aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      {open && <p className="fl-gam-reveal">{fields.antwort ?? ""}</p>}
    </aside>
  );
}

/**
 * Interaktive Gamification-Box im Artikel. Quelle: <div data-finanzleser-gamification="TYP">
 * mit data-gam-field-Feldern, vom Content Studio erzeugt und in ArticleContent.parseContent()
 * ausgelesen. Redaktioneller Look (siehe app/gamification.css).
 */
export default function GamificationEmbed({ gamType, fields }: Props) {
  switch (gamType) {
    case "mythos": return <MythosBox fields={fields} />;
    case "quiz": return <QuizBox fields={fields} />;
    case "schaetzen": return <SchaetzBox fields={fields} />;
    case "karte": return <KarteBox fields={fields} />;
    case "gewusst": return <GewusstBox fields={fields} />;
    case "test": return <TestBox fields={fields} />;
    default: return null;
  }
}
