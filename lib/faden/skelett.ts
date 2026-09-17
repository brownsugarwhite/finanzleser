/**
 * Die Sorte des Ziels einer Navigation — aus der Adresse, bevor der Inhalt da ist.
 *
 * Damit hat das Skelett die Silhouette des Kapitels, das gleich an seiner Stelle erscheint
 * (docs/PLAN_faden_scroll.md, Baustein B): Ein Ratgeber beginnt mit Krumen, Titel,
 * Vorspann, Autorenzeile und Bild; ein Werkzeug mit Titel und Karte; eine Rubrik mit einer
 * Liste. Die Muster sind die aus lib/urls.ts — eine andere Quelle darf es nicht geben,
 * sonst zeigt das Skelett eine Form und das Kapitel eine andere.
 */
import { isMainCategory } from "@/lib/categories";
import type { NavItem } from "@/lib/NavContext";

export type SkelettSorte = "heute" | "ratgeber" | "thema" | "rubrik" | "werkzeug" | "begriff" | "seite";

function segmente(href: string): string[] {
  return href.split(/[?#]/)[0].split("/").filter(Boolean);
}

export function skelettFuer(href: string): SkelettSorte {
  const seg = segmente(href);
  if (!seg.length) return "heute";
  if (seg[0] === "finanztools") {
    if (seg.length === 3 && ["rechner", "checklisten", "vergleiche"].includes(seg[1])) return "werkzeug";
    return "rubrik"; // Übersichten der Werkzeuge: Listen
  }
  if (seg[0] === "dokumente" && seg.length === 2) return "werkzeug";
  if (seg[0] === "glossar" && seg.length === 2) return "begriff";
  if (isMainCategory(seg[0])) return seg.length >= 3 ? "ratgeber" : seg.length === 2 ? "thema" : "rubrik";
  return "seite";
}

function schoen(slug: string): string {
  return slug.replace(/-/g, " ").replace(/^\p{L}/u, (c) => c.toUpperCase());
}

/**
 * Pfad für die Kopfzeile des Skeletts („Kapitel n · Rubrik › Thema“) — Namen aus der
 * Navigation, sonst der Slug in Schönschrift. Dieselbe Zeile trägt später das Kapitel
 * selbst (KapitelKopf mit den Krumen); Skelett und Kapitel sollen sich hier nicht
 * unterscheiden, sonst rückt die Kopfzeile beim Austausch.
 */
export function pfadFuer(href: string, nav: NavItem[]): string[] {
  const seg = segmente(href);
  if (!seg.length) return [];
  if (seg[0] === "finanztools") {
    const art = seg[1] === "rechner" ? "Rechner" : seg[1] === "checklisten" ? "Checklisten" : seg[1] === "vergleiche" ? "Vergleiche" : null;
    return art ? ["Finanztools", art] : ["Finanztools"];
  }
  if (seg[0] === "glossar") return ["Service", "Glossar"];
  if (seg[0] === "dokumente") return ["Service", "Dokumente"];
  if (!isMainCategory(seg[0])) return [];
  const ohne = (h: string) => h.replace(/\/$/, "");
  const haupt = nav.find((n) => ohne(n.href) === `/${seg[0]}`);
  const pfad = [haupt?.label || schoen(seg[0])];
  if (seg.length >= 2) {
    const sub = haupt?.submenu.find((s) => ohne(s.href) === `/${seg[0]}/${seg[1]}`);
    pfad.push(sub?.label || schoen(seg[1]));
  }
  return pfad;
}
