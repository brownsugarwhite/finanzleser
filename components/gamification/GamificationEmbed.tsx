"use client";

import { useState, useRef, useEffect, useLayoutEffect, type ReactNode, type PointerEvent as ReactPointerEvent } from "react";

interface Props {
  gamType: string;
  fields: Record<string, string>;
}

const onlyNum = (s: string | undefined) => {
  const n = parseFloat(String(s ?? "").replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

// Auf Mobile sanft zur einsliddenden Auflösung scrollen. Erst NACH dem Settle der
// Box-Morph-/Slide-Animation (~0.6s) scrollen, sonst wandert das Ziel während des
// Smooth-Scrolls und es ruckelt.
function scrollAnswerIntoView(el: HTMLElement | null) {
  if (!el || typeof window === "undefined") return;
  if (!window.matchMedia("(max-width: 768px)").matches) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.setTimeout(() => {
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  }, 620);
}

/* ── Ticket-Button (geteilt: Mythos + Quiz) ── */
const TICKET_INSET = 7; // Basis-Abstand der äußeren Outline zur Buttonkante
const TICKET_R = 9; // invertierter Eckenradius (beide Outlines)
const TICKET_GAP = 4; // konstanter Abstand äußere ↔ innere Outline
const TICKET_HOVER_OUT = 1; // äußere wandert bei Hover px nach außen
const TICKET_HOVER_GAP = 6; // Ziel-Gap bei Hover

// Zwei invertierte Outlines, parallel mit konstantem Abstand (äußere dicker).
// Bei Hover wandert die äußere nach außen + innere nach innen (Gap → 6px),
// gleichförmig; die Schrift bewegt sich NICHT. Height-adaptiv via ResizeObserver.
function TicketButton({
  children,
  onClick,
  out,
  delay,
  result,
  className,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  out?: boolean;
  delay?: number;
  result?: "correct" | "wrong";
  className?: string;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hover, setHover] = useState(false);
  const [hp, setHp] = useState(0); // Hover-Progress 0..1
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const m = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    m();
    const ro = new ResizeObserver(m);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // Hover weich + GLEICHFÖRMIG tweenen (Pfade pro Frame neu, kein Scale).
  useEffect(() => {
    const target = hover ? 1 : 0;
    const from = hp;
    const t0 = performance.now();
    const dur = 180;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / dur);
      const e = 1 - (1 - t) * (1 - t);
      setHp(from + (target - from) * e);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hover]);
  const { w, h } = size;
  const ok = w > 0 && h > 0;
  const inset = TICKET_INSET - TICKET_HOVER_OUT * hp; // äußere nach außen
  const gap = TICKET_GAP + (TICKET_HOVER_GAP - TICKET_GAP) * hp; // innere nach innen
  const outer = ok ? buildInnerFramePath(inset, inset, w - 2 * inset, h - 2 * inset, TICKET_R) : "";
  const inner = ok ? buildInnerLinePath(inset, inset, w - 2 * inset, h - 2 * inset, TICKET_R, gap) : "";
  return (
    <button
      ref={ref}
      type="button"
      className={`fl-ticket-btn${out ? " is-out" : ""}${result ? ` is-${result}` : ""}${className ? ` ${className}` : ""}`}
      style={out ? { animationDelay: `${delay ?? 0}ms` } : undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      disabled={out || disabled}
    >
      {ok && (
        <>
          <svg className="fl-ticket-btn-outer" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
            <path d={outer} />
          </svg>
          <svg className="fl-ticket-btn-inner" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
            <path d={inner} />
          </svg>
        </>
      )}
      {children}
    </button>
  );
}

// Box-Basis-padding-bottom (= CSS) und Gap zwischen Buttons und Antwortblock.
const GAM_PAD_BOTTOM = 36;
const GAM_ANSWER_GAP = 16;

function MythosBox({ fields }: { fields: Record<string, string> }) {
  const [answer, setAnswer] = useState<"mythos" | "fakt" | null>(null);
  const [phase, setPhase] = useState<"idle" | "out" | "answered">("idle");
  const isFakt = (fields.stimmt ?? "").toLowerCase().startsWith("ja");
  const correct = answer !== null && (answer === "fakt") === isFakt;
  const timer = useRef<number | undefined>(undefined);

  const stageRef = useRef<HTMLDivElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);
  const [stageH, setStageH] = useState<number | undefined>(undefined);
  const [padBottom, setPadBottom] = useState<number | undefined>(undefined);
  const [open, setOpen] = useState(false);

  // Phase "answered": Buttons-Stage kollabiert auf 0 + Box-padding-bottom morpht
  // smooth auf die Antworthöhe. Die Antwort (fixe Größe) slidet von der Border hoch.
  useLayoutEffect(() => {
    if (phase !== "answered") return;
    const stage = stageRef.current;
    const ans = answerRef.current;
    if (!stage || !ans) return;
    setStageH(stage.offsetHeight); // Startwerte fixieren (= aktueller Stand)
    setPadBottom(GAM_PAD_BOTTOM);
    const id = requestAnimationFrame(() => {
      setStageH(0);
      setPadBottom(ans.offsetHeight + GAM_PAD_BOTTOM + GAM_ANSWER_GAP);
      setOpen(true);
      scrollAnswerIntoView(ans);
    });
    return () => cancelAnimationFrame(id);
  }, [phase]);

  const choose = (a: "mythos" | "fakt") => {
    if (phase !== "idle") return;
    setAnswer(a);
    setPhase("out"); // Buttons animieren aus
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setPhase("answered"), 840); // dann Antwort rein
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const out = phase !== "idle";
  const answered = phase === "answered";
  const resultOf = (a: "mythos" | "fakt") =>
    answer === a ? (correct ? "correct" : "wrong") : undefined;

  return (
    <aside className="fl-gam-mythos-box" style={padBottom !== undefined ? { paddingBottom: padBottom } : undefined}>
      <span className="fl-gam-mythos-legend">
        <img src="/icons/icon_mythos.svg" alt="" className="fl-gam-mythos-legend-icon" />
        Mythos oder Fakt?
      </span>
      <p className="fl-mythos-claim">{fields.aussage ?? fields.behauptung ?? ""}</p>
      <div ref={stageRef} className="fl-mythos-stage" style={stageH !== undefined ? { height: stageH } : undefined}>
        <div className="fl-mythos-choices">
          <TicketButton onClick={() => choose("mythos")} out={out} delay={answer === "mythos" ? 0 : 220} result={resultOf("mythos")}>
            <span className="fl-ticket-btn-label">MYTHOS</span>
          </TicketButton>
          <TicketButton onClick={() => choose("fakt")} out={out} delay={answer === "fakt" ? 0 : 220} result={resultOf("fakt")}>
            <span className="fl-ticket-btn-label">FAKT</span>
          </TicketButton>
        </div>
      </div>
      {out && (
        <div className="fl-gam-answer-clip">
          <div ref={answerRef} className={`fl-mythos-answer ${correct ? "is-correct" : "is-wrong"}${open ? " is-in" : ""}`}>
            <strong className="fl-mythos-answer-head">{correct ? "Richtig!" : "Leider falsch."}</strong>{" "}
            Es ist {isFakt ? "ein Fakt." : "ein Mythos."}
            {fields.aufloesung && <p className="fl-mythos-answer-text">{fields.aufloesung}</p>}
          </div>
        </div>
      )}
    </aside>
  );
}

/* ── Quiz – wie Mythos, aber Optionen untereinander; Buttons bleiben stehen ── */
function QuizBox({ fields }: { fields: Record<string, string> }) {
  const [picked, setPicked] = useState<string | null>(null);
  const opts = ["a", "b", "c", "d"].map((k) => ({ k: k.toUpperCase(), v: fields[k] })).filter((o) => o.v);
  const right = (fields.richtig ?? "").toUpperCase().trim().charAt(0);
  const correct = picked !== null && picked === right;

  const answerRef = useRef<HTMLDivElement>(null);
  const [padBottom, setPadBottom] = useState<number | undefined>(undefined);
  const [reveal, setReveal] = useState(false);

  // Buttons bleiben stehen; Box-padding-bottom morpht auf die Antworthöhe, die
  // Antwort slidet von der Border hoch (wie Mythos) — nur ohne Bounce.
  useLayoutEffect(() => {
    if (!picked) return;
    const ans = answerRef.current;
    if (!ans) return;
    setPadBottom(GAM_PAD_BOTTOM);
    const id = requestAnimationFrame(() => {
      setPadBottom(ans.offsetHeight + GAM_PAD_BOTTOM + GAM_ANSWER_GAP);
      setReveal(true);
      scrollAnswerIntoView(ans);
    });
    return () => cancelAnimationFrame(id);
  }, [picked]);

  const choose = (k: string) => {
    if (picked) return;
    setPicked(k);
  };

  // richtige Antwort immer primary (grün), falsch geklickte secondary (pink).
  const resultOf = (k: string): "correct" | "wrong" | undefined =>
    picked ? (k === right ? "correct" : k === picked ? "wrong" : undefined) : undefined;
  const animOf = (k: string) => (k === picked ? (correct ? " is-pulse" : " is-shake") : "");

  return (
    <aside className="fl-gam-mythos-box fl-gam-quiz-box" style={padBottom !== undefined ? { paddingBottom: padBottom } : undefined}>
      <span className="fl-gam-mythos-legend">
        <img src="/icons/icon_quiz.svg" alt="" className="fl-gam-mythos-legend-icon" />
        Quiz
      </span>
      <p className="fl-mythos-claim">{fields.frage ?? ""}</p>
      <div className="fl-quiz-options">
        {opts.map((o) => (
          <TicketButton
            key={o.k}
            className={`fl-quiz-opt${animOf(o.k)}`}
            onClick={() => choose(o.k)}
            disabled={picked !== null}
            result={resultOf(o.k)}
          >
            <span className="fl-quiz-opt-key">{o.k}</span>
            <span className="fl-quiz-opt-text">{o.v}</span>
          </TicketButton>
        ))}
      </div>
      {picked && (
        <div className="fl-gam-answer-clip">
          <div ref={answerRef} className={`fl-mythos-answer fl-quiz-answer ${correct ? "is-correct" : "is-wrong"}${reveal ? " is-in" : ""}`}>
            <strong className="fl-mythos-answer-head">{correct ? "Richtig!" : "Leider falsch."}</strong>
            {fields.erklaerung && <p className="fl-mythos-answer-text">{fields.erklaerung}</p>}
          </div>
        </div>
      )}
    </aside>
  );
}

/* ── Schätzfrage – cooler Schätz-Slider ── */
// Zahl von 0 auf target hochzählen (für den Score-Reveal).
function useCountUp(target: number, active: boolean, duration = 750): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!active) {
      setN(0);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      const e = 1 - (1 - t) * (1 - t); // easeOut
      setN(Math.round(target * e));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);
  return n;
}

// Sinnvolle Schrittweite zur Spanne (≈100 Schritte, gerundet auf 1/2/5·10ⁿ).
// Bereich 0–1 → 0.01, Bereich 300k–700k → 5000 usw.
function niceStep(span: number): number {
  const raw = span / 100;
  if (raw <= 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const factor = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10;
  return factor * mag;
}

function SchaetzBox({ fields }: { fields: Record<string, string> }) {
  const min = onlyNum(fields.min) ?? 0;
  const max = Math.max(min + 1, onlyNum(fields.max) ?? 100);
  const answer = Math.min(max, Math.max(min, onlyNum(fields.antwort) ?? min));
  const unit = fields.einheit ?? "";
  const span = max - min;
  const step = niceStep(span);
  const decimals = step < 1 ? Math.max(0, -Math.floor(Math.log10(step))) : 0;
  const snap = (v: number) => Math.min(max, Math.max(min, Math.round(v / step) * step));

  const [val, setVal] = useState(snap((min + max) / 2));
  const [grabbing, setGrabbing] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reveal, setReveal] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [padBottom, setPadBottom] = useState<number | undefined>(undefined);
  const [actionsH, setActionsH] = useState<number | undefined>(undefined);

  const pct = (v: number) => ((v - min) / span) * 100;
  const fmt = (n: number) =>
    n.toLocaleString("de-DE", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const withUnit = (n: number) => `${fmt(n)}${unit ? ` ${unit}` : ""}`;

  const valFromClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return val;
    const rect = el.getBoundingClientRect();
    const t = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return snap(min + t * span);
  };

  // Drag über window (auch außerhalb des Tracks weiterziehen).
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (dragging.current) setVal(valFromClientX(e.clientX));
    };
    const up = () => {
      dragging.current = false;
      setGrabbing(false);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min, max]);

  const onTrackDown = (e: ReactPointerEvent) => {
    if (submitted) return;
    dragging.current = true;
    setGrabbing(true);
    setVal(valFromClientX(e.clientX));
  };

  const submit = () => {
    if (submitted) return;
    setSubmitted(true);
  };

  useLayoutEffect(() => {
    if (!submitted) return;
    const actions = actionsRef.current;
    const ans = answerRef.current;
    if (!actions || !ans) return;
    setActionsH(actions.offsetHeight); // Startwerte fixieren
    setPadBottom(GAM_PAD_BOTTOM);
    const id = requestAnimationFrame(() => {
      setActionsH(0); // Button-Bereich kollabiert
      setPadBottom(ans.offsetHeight + GAM_PAD_BOTTOM + GAM_ANSWER_GAP);
      setReveal(true);
      scrollAnswerIntoView(ans);
    });
    return () => cancelAnimationFrame(id);
  }, [submitted]);

  const diff = Math.abs(val - answer);
  const accuracy = Math.max(0, Math.round(100 - (diff / span) * 100));
  const tier = accuracy >= 90 ? "good" : accuracy >= 65 ? "ok" : "bad";
  const headline = tier === "good" ? "Stark geschätzt!" : tier === "ok" ? "Gar nicht übel!" : "Knapp vorbei.";
  const countAcc = useCountUp(accuracy, reveal);

  const gapLeft = Math.min(pct(val), pct(answer));
  const gapWidth = Math.abs(pct(val) - pct(answer));

  return (
    <aside className="fl-gam-mythos-box fl-gam-schaetz-box" style={padBottom !== undefined ? { paddingBottom: padBottom } : undefined}>
      <span className="fl-gam-mythos-legend">
        <img src="/icons/icon_slider.svg" alt="" className="fl-gam-mythos-legend-icon" />
        Schätzfrage
      </span>
      <p className="fl-mythos-claim">{fields.frage ?? ""}</p>

      <div className={`fl-schaetz${submitted ? ` is-done is-${tier}` : ""}`}>
        <div className="fl-schaetz-bubble" style={{ left: `${pct(val)}%` }}>
          {withUnit(val)}
        </div>
        <div ref={trackRef} className="fl-schaetz-track" onPointerDown={onTrackDown}>
          <div className="fl-schaetz-fill" style={{ width: `${pct(val)}%` }} />
          {submitted && <div className="fl-schaetz-gap" style={{ left: `${gapLeft}%`, width: `${gapWidth}%` }} />}
          {submitted && (
            <div className="fl-schaetz-target" style={{ left: `${pct(answer)}%` }}>
              <span className="fl-schaetz-target-flag">{withUnit(answer)}</span>
            </div>
          )}
          <div className={`fl-schaetz-thumb${grabbing ? " is-grab" : ""}${submitted ? " is-locked" : ""}`} style={{ left: `${pct(val)}%` }} />
        </div>
        <div className="fl-schaetz-scale">
          <span>{withUnit(min)}</span>
          <span>{withUnit(max)}</span>
        </div>
      </div>

      <div
        ref={actionsRef}
        className={`fl-schaetz-actions${reveal ? " is-gone" : ""}`}
        style={actionsH !== undefined ? { height: actionsH } : undefined}
      >
        <TicketButton className="fl-schaetz-submit" onClick={submit} disabled={submitted}>
          <span className="fl-ticket-btn-label">SCHÄTZUNG ABGEBEN</span>
        </TicketButton>
      </div>
      {submitted && (
        <div className="fl-gam-answer-clip">
          <div ref={answerRef} className={`fl-mythos-answer fl-schaetz-answer is-${tier}${reveal ? " is-in" : ""}`}>
            <strong className="fl-mythos-answer-head">{headline}</strong>{" "}
            Richtig sind {withUnit(answer)} — du lagst {withUnit(diff)} daneben.
            <span className="fl-schaetz-acc">{countAcc}%&nbsp;genau</span>
            {fields.aufloesung && <p className="fl-mythos-answer-text">{fields.aufloesung}</p>}
          </div>
        </div>
      )}
    </aside>
  );
}

/* ── Begriff erklärt – Flip-Karte ── */
const KARTE_LINE_INSET = 8; // Abstand der inneren (invertierten) Linie zur Kartenkante (näher = schmalerer Rahmen)
const KARTE_LINE_R = 10; // invertierter Eckenradius der inneren Linie

function KarteBox({ fields }: { fields: Record<string, string> }) {
  const [flipped, setFlipped] = useState(false);
  const cardRef = useRef<HTMLButtonElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  // Kartengröße messen → innere Linie (SVG) passend generieren.
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { w, h } = size;
  const linePath =
    w > 0 && h > 0
      ? buildInnerFramePath(KARTE_LINE_INSET, KARTE_LINE_INSET, w - 2 * KARTE_LINE_INSET, h - 2 * KARTE_LINE_INSET, KARTE_LINE_R)
      : "";
  const lineSvg = linePath ? (
    <svg className="fl-karte-line-svg" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path d={linePath} className="fl-karte-line" />
    </svg>
  ) : null;

  return (
    <aside className="fl-gam-karte-box">
      <span className="fl-gam-karte-legend">
        <img src="/icons/icon_cardRotate.svg" alt="" className="fl-gam-karte-legend-icon" />
        Begriff erklärt
      </span>
      {/* grüner Rahmen (Hintergrund) */}
      <div className="fl-karte-frame">
        {/* Aufhänge-Kreise (cremefarben), tangential an Ober-/Unterkante der Karte */}
        <span className="fl-karte-circle fl-karte-circle-top" />
        <span className="fl-karte-circle fl-karte-circle-bottom" />
        {/* die komplette weiße Karte dreht */}
        <button
          ref={cardRef}
          type="button"
          className={`fl-karte-flip${flipped ? " is-flipped" : ""}`}
          onClick={() => setFlipped((v) => !v)}
          aria-pressed={flipped}
        >
          <span className="fl-karte-stage">
          <span className="fl-karte-inner">
            <span className="fl-karte-face fl-karte-front">
              {lineSvg}
              <span className="fl-karte-content">
                <span className="fl-karte-dash" />
                <span className="fl-karte-term">{fields.begriff ?? ""}</span>
                <span className="fl-karte-hint">umdrehen</span>
              </span>
            </span>
            <span className="fl-karte-face fl-karte-back">
              {lineSvg}
              <span className="fl-karte-content">
                <span className="fl-karte-def">{fields.erklaerung ?? ""}</span>
                <span className="fl-karte-back-hint">
                  <svg className="fl-karte-arrow" width="46" height="14" viewBox="0 0 46 14" fill="none" aria-hidden="true">
                    <path d="M1 7 H45 M1 7 L8 2 M1 7 L8 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  zurück
                </span>
              </span>
            </span>
          </span>
          </span>
        </button>
      </div>
    </aside>
  );
}

/* ── Schon gewusst – Freirubbeln (Ticket-Look) ── */
const TICKET_TOOTH_D = 13; // Zacken-Tiefe (px, horizontal)
const TICKET_TOOTH_H = 19; // Ziel-Höhe je Zacke (kleiner → mehr Zacken)
const WIN_X = TICKET_TOOTH_D + 12; // 12px Abstand der inneren Box zu den Zacken (Tal bei x=13)
const WIN_Y = 6; // 6px Abstand oben/unten
const WIN_R = 12; // invertierter Eckenradius des Fensters (Grün↔Cream)
const INNER_OFFSET = 3; // konstanter Gap zur zweiten Linie
// Spark/Funkel-Pfad (12×12, = Heading-Deko) für die Canvas-Sparks im Cover.
const GAM_SPARK_PATH =
  "M12 6.00047C10.3384 5.64978 8.28716 5.41362 7.24241 3.91374C6.47491 2.81169 6.27276 1.28871 6.00024 0.000471365C5.61861 1.71435 5.40087 3.79684 3.79407 4.83384C2.69548 5.54325 1.25351 5.72142 0 6.01226C1.28705 6.29225 2.79561 6.48692 3.89751 7.25194C5.4174 8.30686 5.61672 10.3366 6.00024 12.0005C6.17594 11.1204 6.33322 10.2272 6.62463 9.37638C7.27878 7.46453 8.37832 6.85223 10.2643 6.37379L12 6.00047Z";

// Sägezahn-Ticket-Pfad: TIPS an den Ecken (x=0 / x=w), flache Ober-/Unterkante
// auf Tip-Höhe → oben/unten je eine HALBE Zacke mit flacher Seite, dazwischen
// volle Zacken (scharf). Höhenabhängig → gleichmäßig bei jeder Texthöhe.
function buildTicketPath(w: number, h: number): string {
  if (w <= 0 || h <= 0) return "";
  const d = TICKET_TOOTH_D;
  const n = Math.max(2, Math.round(h / TICKET_TOOTH_H));
  const s = h / n;
  let p = `M 0 0 L ${w} 0`; // flache Oberkante (Tip-Höhe)
  for (let i = 0; i < n; i++) p += ` L ${w - d} ${(i + 0.5) * s} L ${w} ${(i + 1) * s}`;
  p += ` L 0 ${h}`; // flache Unterkante
  for (let i = 0; i < n; i++) p += ` L ${d} ${h - (i + 0.5) * s} L 0 ${h - (i + 1) * s}`;
  return p + " Z";
}

// Innenrahmen mit INVERTIERTEM Eckenradius (konkave Ecken — Bögen mit Mittelpunkt
// in der Außenecke, sweep-flag 0). Fällt bei zu kleinen Maßen auf ein Rechteck zurück.
function buildInnerFramePath(x: number, y: number, w: number, h: number, r: number): string {
  if (w <= 2 * r || h <= 2 * r) return `M ${x} ${y} h ${w} v ${h} h ${-w} Z`;
  return [
    `M ${x + r} ${y}`,
    `L ${x + w - r} ${y}`,
    `A ${r} ${r} 0 0 0 ${x + w} ${y + r}`,
    `L ${x + w} ${y + h - r}`,
    `A ${r} ${r} 0 0 0 ${x + w - r} ${y + h}`,
    `L ${x + r} ${y + h}`,
    `A ${r} ${r} 0 0 0 ${x} ${y + h - r}`,
    `L ${x} ${y + r}`,
    `A ${r} ${r} 0 0 0 ${x + r} ${y}`,
    "Z",
  ].join(" ");
}

// Zweite Linie als KONSTANTER Innen-Offset des Fensters: Bögen konzentrisch zu den
// Fenster-Ecken (gleicher Mittelpunkt, Radius r+o) → Abstand überall gleich (=o).
function buildInnerLinePath(wx: number, wy: number, ww: number, wh: number, r: number, o: number): string {
  if (ww <= 0 || wh <= 0) return "";
  const r2 = r + o;
  const k = Math.sqrt(Math.max(0, r2 * r2 - o * o));
  const L = wx, T = wy, R = wx + ww, B = wy + wh; // Fenster-Eck-Mittelpunkte
  const topY = wy + o, botY = wy + wh - o, leftX = wx + o, rightX = wx + ww - o;
  if (ww - 2 * k <= 0 || wh - 2 * k <= 0) {
    return `M ${leftX} ${topY} L ${rightX} ${topY} L ${rightX} ${botY} L ${leftX} ${botY} Z`;
  }
  return [
    `M ${L + k} ${topY}`,
    `L ${R - k} ${topY}`,
    `A ${r2} ${r2} 0 0 0 ${rightX} ${T + k}`,
    `L ${rightX} ${B - k}`,
    `A ${r2} ${r2} 0 0 0 ${R - k} ${botY}`,
    `L ${L + k} ${botY}`,
    `A ${r2} ${r2} 0 0 0 ${leftX} ${B - k}`,
    `L ${leftX} ${T + k}`,
    `A ${r2} ${r2} 0 0 0 ${L + k} ${topY}`,
    "Z",
  ].join(" ");
}

function GewusstBox({ fields }: { fields: Record<string, string> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ticketRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [coverReady, setCoverReady] = useState(false); // grüner Cover gezeichnet?
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [coin, setCoin] = useState({ x: 0, y: 0, show: false });
  const drawing = useRef(false);

  // Ticket-Maße messen (Höhe = Antworttext) und bei Resize nachziehen.
  useEffect(() => {
    const el = ticketRef.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const outerPath = buildTicketPath(size.w, size.h);
  // Fenster (Cream-Bereich, nur dieser wird gerubbelt) — invertierte Ecken.
  const winW = Math.max(0, size.w - 2 * WIN_X);
  const winH = Math.max(0, size.h - 2 * WIN_Y);
  const windowPath =
    winW > 0 && winH > 0 ? buildInnerFramePath(WIN_X, WIN_Y, winW, winH, WIN_R) : "";
  // Zweite Linie: konstanter Innen-Offset des Fensters (überall gleicher Abstand).
  const innerLinePath =
    winW > 0 && winH > 0 ? buildInnerLinePath(WIN_X, WIN_Y, winW, winH, WIN_R, INNER_OFFSET) : "";

  // Cover auf den Canvas zeichnen (grüner Grund + cremefarbene Innenlinie + Hinweis).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || revealed || size.w === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w, h } = size;
    // HiDPI: Backing-Store mit devicePixelRatio skalieren → scharfe Schrift/Linien.
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // in CSS-Pixeln zeichnen
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#248085"; // Gamification-Dark; Cover füllt das Fenster (CSS-Clip)
    ctx.fillRect(0, 0, w, h);
    // cremefarbene zweite Linie (Pendant zur grünen Reveal-Linie)
    ctx.strokeStyle = "#faf9f6"; // = --color-bg-page
    ctx.lineWidth = 1.5;
    const lpath = buildInnerLinePath(WIN_X, WIN_Y, w - 2 * WIN_X, h - 2 * WIN_Y, WIN_R, INNER_OFFSET);
    if (lpath) ctx.stroke(new Path2D(lpath));
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "2px";
    const spark = new Path2D(GAM_SPARK_PATH);
    const drawSpark = (cx: number, cy: number, px: number) => {
      const s = px / 12;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(s, s);
      ctx.translate(-6, -6);
      ctx.fill(spark);
      ctx.restore();
    };
    // Schmal (Mobile): Hinweis 3-zeilig gestapelt, je ein Spark oben + unten.
    if (w < 440) {
      ctx.font = "italic 600 17px Merriweather, Georgia, serif";
      const lines = ["ZUM", "AUFDECKEN", "RUBBELN"];
      const lineH = 25;
      const SP = 15; // Spark-Größe
      const sparkGap = 13; // Abstand Spark ↔ Textblock
      const blockH = lines.length * lineH;
      const totalH = SP + sparkGap + blockH + sparkGap + SP;
      let y = h / 2 - totalH / 2;
      ctx.fillStyle = "#ffffff";
      drawSpark(w / 2, y + SP / 2, SP); // Spark oben
      y += SP + sparkGap;
      ctx.fillStyle = "#faf9f6";
      lines.forEach((ln, i) => ctx.fillText(ln, w / 2, y + lineH / 2 + i * lineH));
      y += blockH + sparkGap;
      ctx.fillStyle = "#ffffff";
      drawSpark(w / 2, y + SP / 2, SP); // Spark unten
    } else {
      // Breit (Desktop): eine Zeile, Sparks links + rechts (wie Heading-Deko).
      ctx.font = "italic 600 19px Merriweather, Georgia, serif";
      ctx.fillStyle = "#faf9f6";
      const label = "ZUM AUFDECKEN RUBBELN";
      ctx.fillText(label, w / 2, h / 2 + 2); // nur der Text 3px nach unten
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = "#ffffff";
      const sparkY = h / 2;
      const lx = w / 2 - tw / 2; // linke Textkante
      const rx = w / 2 + tw / 2; // rechte Textkante
      const GT = 9, GS = 5, LG = 18, SM = 12; // Gaps + Größen
      drawSpark(lx - GT - LG / 2, sparkY, LG); // links groß
      drawSpark(lx - GT - LG - GS - SM / 2, sparkY, SM); // links klein
      drawSpark(rx + GT + LG / 2, sparkY, LG); // rechts groß
      drawSpark(rx + GT + LG + GS + SM / 2, sparkY, SM); // rechts klein
    }
    ctx.globalCompositeOperation = "destination-out"; // ab jetzt radiert fill()
    setCoverReady(true); // Text darf nun (verdeckt) gerendert werden → beim Rubbeln sichtbar
  }, [size, revealed]);

  const scratch = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.arc(clientX - rect.left, clientY - rect.top, 20, 0, Math.PI * 2);
    ctx.fill();
    // Fortschritt nur im Fenster-Bereich messen (Backing ist dpr-skaliert).
    const dpr = window.devicePixelRatio || 1;
    const wx = Math.max(0, Math.round(WIN_X * dpr));
    const wy = Math.max(0, Math.round(WIN_Y * dpr));
    const ww = Math.min(canvas.width - wx, Math.round((size.w - 2 * WIN_X) * dpr));
    const wh = Math.min(canvas.height - wy, Math.round((size.h - 2 * WIN_Y) * dpr));
    if (ww <= 0 || wh <= 0) return;
    const data = ctx.getImageData(wx, wy, ww, wh).data;
    let cleared = 0, total = 0;
    for (let i = 3; i < data.length; i += 4 * 40) { total++; if (data[i] === 0) cleared++; }
    if (total && cleared / total > 0.5) setRevealed(true);
  };

  const trackCoin = (clientX: number, clientY: number) => {
    const el = ticketRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setCoin({ x: clientX - r.left, y: clientY - r.top, show: true });
  };

  // Maus-Drag startet auf dem Canvas, läuft aber über window weiter → solange die
  // Taste gedrückt ist, bleibt es rubbelbar (und die Münze sichtbar), auch wenn
  // der Cursor das Feld verlässt.
  const cleanupDrag = useRef<() => void>(() => {});
  useEffect(() => () => cleanupDrag.current(), []);

  const startMouseScratch = (clientX: number, clientY: number) => {
    drawing.current = true;
    scratch(clientX, clientY);
    trackCoin(clientX, clientY);
    const onWinMove = (e: MouseEvent) => { scratch(e.clientX, e.clientY); trackCoin(e.clientX, e.clientY); };
    const onWinUp = () => {
      drawing.current = false;
      window.removeEventListener("mousemove", onWinMove);
      window.removeEventListener("mouseup", onWinUp);
      setCoin((c) => ({ ...c, show: false }));
    };
    cleanupDrag.current = () => {
      window.removeEventListener("mousemove", onWinMove);
      window.removeEventListener("mouseup", onWinUp);
    };
    window.addEventListener("mousemove", onWinMove);
    window.addEventListener("mouseup", onWinUp);
  };

  // Touch fängt Bewegungen implizit am Canvas ein → läuft auch außerhalb weiter.
  const onTouchDown = (x: number, y: number) => { drawing.current = true; scratch(x, y); };
  const onTouchMove = (x: number, y: number) => { if (drawing.current) scratch(x, y); };
  const onTouchUp = () => { drawing.current = false; };

  // Canvas nur auf das Fenster begrenzen → nur der innere Bereich ist rubbelbar.
  const clip = windowPath ? { clipPath: `path('${windowPath}')`, WebkitClipPath: `path('${windowPath}')` } : undefined;

  return (
    <aside className="fl-gam-gewusst-box">
      <span className="fl-gam-gewusst-legend">
        <img src="/icons/icon_rubbleCoin.svg" alt="" className="fl-gam-gewusst-legend-icon" />
        Schon gewusst?
      </span>
      <div ref={ticketRef} className={`fl-gam-ticket${revealed ? " is-revealed" : ""}`}>
        {outerPath && (
          <svg
            className="fl-gam-ticket-svg"
            width={size.w}
            height={size.h}
            viewBox={`0 0 ${size.w} ${size.h}`}
            aria-hidden="true"
          >
            {/* Grünes Ticket = Fill (Zacken-Außenform minus Fenster), keine Outline */}
            <path d={`${outerPath} ${windowPath}`} fillRule="evenodd" className="fl-gam-ticket-fill" />
            {/* Zweite Linie im Cream (nur Outline) */}
            {innerLinePath && <path d={innerLinePath} className="fl-gam-ticket-line" />}
          </svg>
        )}
        <p
          className="fl-gam-ticket-text"
          style={{ visibility: coverReady || revealed ? "visible" : "hidden" }}
        >
          {fields.text ?? ""}
        </p>
        {!revealed && (
          <canvas
            ref={canvasRef}
            className="fl-gam-ticket-canvas"
            style={clip}
            onMouseDown={(e) => startMouseScratch(e.clientX, e.clientY)}
            onMouseMove={(e) => { if (!drawing.current) trackCoin(e.clientX, e.clientY); }}
            onMouseEnter={(e) => { if (!drawing.current) trackCoin(e.clientX, e.clientY); }}
            onMouseLeave={() => { if (!drawing.current) setCoin((c) => ({ ...c, show: false })); }}
            onTouchStart={(e) => { const t = e.touches[0]; onTouchDown(t.clientX, t.clientY); }}
            onTouchMove={(e) => { const t = e.touches[0]; onTouchMove(t.clientX, t.clientY); }}
            onTouchEnd={onTouchUp}
          />
        )}
        {!revealed && coin.show && (
          <img
            src="/icons/rubbelCoin.png"
            alt=""
            className="fl-gam-coin"
            style={{ left: coin.x, top: coin.y }}
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
