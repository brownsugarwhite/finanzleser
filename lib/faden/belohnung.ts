/**
 * Belohnung im Faden (Port aus dem Prototyp, 03-js-core.html belohne()): Konfetti aus
 * der Kartenmitte, „+N Punkte“-Abzeichen, Puls am Register-Eintrag, Leo freut sich.
 * Reine DOM-Helfer; der Punktestand lebt im FadenProvider.
 */
const FARBEN = ["#45A117", "#D3005E", "#06D496", "#9953c9", "#E07A5F", "#e3b341"];

export function reduzierteBewegung(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function konfetti(kasten: HTMLElement): void {
  const cv = document.createElement("canvas");
  cv.className = "konfetti";
  kasten.appendChild(cv);
  const r = kasten.getBoundingClientRect();
  cv.width = r.width; cv.height = r.height;
  const ctx = cv.getContext("2d");
  if (!ctx) { cv.remove(); return; }
  const teile = Array.from({ length: 110 }, (_, i) => ({
    x: r.width / 2 + (Math.random() - 0.5) * 80, y: r.height * 0.42,
    vx: (Math.random() - 0.5) * 10, vy: -Math.random() * 10 - 3,
    w: 5 + Math.random() * 5, h: 3 + Math.random() * 4,
    rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3, f: FARBEN[i % FARBEN.length],
  }));
  const t0 = performance.now();
  const frame = () => {
    const t = (performance.now() - t0) / 1000;
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (const q of teile) {
      q.vy += 0.22; q.x += q.vx; q.y += q.vy; q.vx *= 0.99; q.rot += q.vr;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, 1.6 - t * 0.7));
      ctx.translate(q.x, q.y); ctx.rotate(q.rot); ctx.fillStyle = q.f;
      ctx.fillRect(-q.w / 2, -q.h / 2, q.w, q.h);
      ctx.restore();
    }
    if (t < 2.3) requestAnimationFrame(frame); else cv.remove();
  };
  requestAnimationFrame(frame);
}

export function abzeichen(kasten: HTMLElement, text: string): void {
  const b = document.createElement("div");
  b.className = "belohnung";
  b.textContent = text;
  kasten.appendChild(b);
  setTimeout(() => b.classList.add("an"), 30);
  setTimeout(() => b.remove(), 2500);
}

/** Klasse kurz neu setzen, damit die Animation erneut läuft. */
export function nochmal(el: Element | null, klasse: string): void {
  if (!el) return;
  el.classList.remove(klasse);
  void (el as HTMLElement).offsetWidth;
  el.classList.add(klasse);
}

/** Etwas fliegt von einem Element zu einem Ziel (Koffer-Flug, Glossar-Flug, Frage steigt auf). */
export function flugZu(von: Element | null, zu: Element | null, text: string, klasse = "flug"): Promise<void> {
  return new Promise((fertig) => {
    if (!von || !zu || reduzierteBewegung()) { fertig(); return; }
    const a = von.getBoundingClientRect(), b = zu.getBoundingClientRect();
    const f = document.createElement("div");
    f.className = klasse;
    f.textContent = text;
    Object.assign(f.style, { position: "fixed", left: `${a.left + a.width / 2}px`, top: `${a.top + a.height / 2}px`, transform: "translate(-50%, -50%)", zIndex: "90", pointerEvents: "none" });
    document.body.appendChild(f);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    const anim = f.animate([
      { transform: "translate(-50%, -50%) scale(1)", opacity: 1, offset: 0 },
      { transform: `translate(calc(-50% + ${dx * 0.5}px), calc(-50% + ${dy * 0.5 - 40}px)) scale(.9)`, opacity: 1, offset: 0.5 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.3)`, opacity: 0.2, offset: 1 },
    ], { duration: 650, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" });
    anim.onfinish = () => { f.remove(); fertig(); };
  });
}
