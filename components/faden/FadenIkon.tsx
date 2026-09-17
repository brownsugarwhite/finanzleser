/**
 * Strich-Ikonen im 24er-Raster (Port aus dem Prototyp, 05-js-neu.html `IKON`), die der
 * Plus-Bereich braucht: Wappen, Aktenkoffer, Wächter. Eigene, statische SVG-Pfade.
 */
const PFADE: Record<string, string> = {
  koffer: '<rect x="3" y="7.5" width="18" height="12" rx="2"/><path d="M9 7.5V5.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5.5v2M3 12h18"/>',
  sessel: '<path d="M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4M3 13a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5H3zM6 18v2M18 18v2"/>',
  haus: '<path d="M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6"/>',
  frage: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17h.01"/>',
  kurve: '<path d="M3 20h18M4 16l5-6 4 3 7-8M16 5h4v4"/>',
  sanduhr: '<path d="M6 3h12M6 21h12M8 3c0 5 4 6 4 9s-4 4-4 9M16 3c0 5-4 6-4 9s4 4 4 9"/>',
  schirm: '<path d="M3 12a9 9 0 0 1 18 0zM12 12v6a2 2 0 0 0 4 0M12 3v1"/>',
  sofa: '<path d="M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3M2 13a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4H2zM5 17v2M19 17v2"/>',
  waage: '<path d="M12 3v18M5 21h14M3 7h18M6 7l-3 7a3 3 0 0 0 6 0zM18 7l-3 7a3 3 0 0 0 6 0z"/>',
  spar: '<path d="M4 12a6 5 0 0 1 12 0h2l2 2-2 2v1a2 2 0 0 1-2 2h-1l-1-2H9l-1 2H7a2 2 0 0 1-2-2v-1a4 4 0 0 1-1-4M9 7l1-3 3 2"/>',
  glocke: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  dokument: '<path d="M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6"/>',
  flieger: '<path d="M3 11l18-8-8 18-2-8z"/>',
  auto: '<path d="M5 16l1.5-5h11L19 16M3 16h18v3H3zM7 19v2M17 19v2"/>',
  baby: '<circle cx="12" cy="7" r="4"/><path d="M6 21v-3a6 6 0 0 1 12 0v3"/>',
  hund: '<path d="M4 10l3-6 4 3h3l3-3 3 6-2 2v6H6v-6zM9 14h.01M15 14h.01M11 17h2"/>',
  haken: '<path d="M5 12l5 5 9-10"/>',
  scheine: '<rect x="3" y="7" width="18" height="11" rx="2"/><circle cx="12" cy="12.5" r="2.5"/><path d="M6 10h.01M18 15h.01"/>',
  person: '<circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
};

export default function FadenIkon({ name, className }: { name: string; className?: string }) {
  const pfad = PFADE[name] || PFADE.frage;
  return <svg className={"ikon" + (className ? " " + className : "")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: pfad }} />;
}
