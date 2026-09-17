/**
 * Strich-Ikonen im 24er-Raster (Port aus dem Prototyp, 05-js-neu.html `IKON`/`ikon()`):
 * nur die Namen, die der Kassensturz braucht (Antwortkarten, Lücken, Nachher-Kasten).
 * Statische, eigene SVG-Pfade — deshalb per innerHTML, 1:1 wie die Vorlage.
 */
const IKON: Record<string, string> = {
  koffer: '<rect x="3" y="7.5" width="18" height="12" rx="2"/><path d="M9 7.5V5.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5.5v2M3 12h18"/>',
  werkzeug: '<path d="M14.5 6.5a4 4 0 0 0-5.3 5.3L4 17l3 3 5.2-5.2a4 4 0 0 0 5.3-5.3l-2.6 2.6-2.2-.6-.6-2.2z"/>',
  sessel: '<path d="M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4M3 13a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5H3zM6 18v2M18 18v2"/>',
  hut: '<path d="M3 10l9-4 9 4-9 4zM7 12v4c0 1.5 2.5 3 5 3s5-1.5 5-3v-4M21 10v5"/>',
  person: '<circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  paar: '<circle cx="9" cy="8" r="3.5"/><circle cx="17" cy="9" r="3"/><path d="M2 20c1-4 3.5-6 7-6s6 2 7 6M14 20c.5-3 2-4.5 4-4.5s3.5 1.5 4 4.5"/>',
  familie: '<circle cx="8" cy="7" r="3"/><circle cx="16" cy="7" r="3"/><circle cx="12" cy="14" r="2"/><path d="M2 20c1-3.5 3-5.5 6-5.5M22 20c-1-3.5-3-5.5-6-5.5M9 21c.5-2 1.5-3 3-3s2.5 1 3 3"/>',
  allein: '<circle cx="10" cy="7" r="3.2"/><circle cx="17" cy="12" r="2"/><path d="M3 20c1-4 3.5-6 7-6M14 20c.3-2.5 1.5-4 3-4s2.7 1.5 3 4"/>',
  schluessel: '<circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3M15 12v2"/>',
  haus: '<path d="M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6"/>',
  haus2: '<path d="M2 12l7-6 7 6M4 11v8h10v-8M14 9l4-3 4 3v10h-8"/>',
  dach: '<path d="M2 12L12 3l10 9M5 10v10h14V10M9 20v-5h6v5"/>',
  schildJa: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  schildNein: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9.5 9.5l5 5M14.5 9.5l-5 5"/>',
  frage: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17h.01"/>',
  bank: '<path d="M3 10l9-6 9 6M4 10h16M6 10v7M10 10v7M14 10v7M18 10v7M3 20h18"/>',
  kurve: '<path d="M3 20h18M4 16l5-6 4 3 7-8M16 5h4v4"/>',
  sanduhr: '<path d="M6 3h12M6 21h12M8 3c0 5 4 6 4 9s-4 4-4 9M16 3c0 5-4 6-4 9s4 4 4 9"/>',
  schirm: '<path d="M3 12a9 9 0 0 1 18 0zM12 12v6a2 2 0 0 0 4 0M12 3v1"/>',
  sofa: '<path d="M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3M2 13a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4H2zM5 17v2M19 17v2"/>',
  waage: '<path d="M12 3v18M5 21h14M3 7h18M6 7l-3 7a3 3 0 0 0 6 0zM18 7l-3 7a3 3 0 0 0 6 0z"/>',
  unfall: '<path d="M12 3l9 16H3zM12 9v5M12 17h.01"/>',
  spar: '<path d="M4 12a6 5 0 0 1 12 0h2l2 2-2 2v1a2 2 0 0 1-2 2h-1l-1-2H9l-1 2H7a2 2 0 0 1-2-2v-1a4 4 0 0 1-1-4M9 7l1-3 3 2"/>',
  sparHalb: '<path d="M4 12a6 5 0 0 1 12 0h2l2 2-2 2v1a2 2 0 0 1-2 2h-1l-1-2H9l-1 2H7a2 2 0 0 1-2-2v-1a4 4 0 0 1-1-4M8 12h6"/>',
  sparLeer: '<path d="M4 12a6 5 0 0 1 12 0h2l2 2-2 2v1a2 2 0 0 1-2 2h-1l-1-2H9l-1 2H7a2 2 0 0 1-2-2v-1a4 4 0 0 1-1-4M9 10l4 4M13 10l-4 4"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  flieger: '<path d="M3 11l18-8-8 18-2-8z"/>',
  baby: '<circle cx="12" cy="7" r="4"/><path d="M6 21v-3a6 6 0 0 1 12 0v3"/>',
  stern: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
};

export default function Ikon({ name, className }: { name: string; className?: string }) {
  return (
    <svg
      className={"ikon" + (className ? " " + className : "")}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: IKON[name] || IKON.stern }}
    />
  );
}
