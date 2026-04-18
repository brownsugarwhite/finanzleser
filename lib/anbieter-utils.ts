/**
 * Trennt den WordPress-post_title (z. B. "Advocard Rechtsschutz Kontakt") in
 * einen kursiven Kicker ("Kontakt") und den eigentlichen Namen
 * ("Advocard Rechtsschutz"). Der post_title im CMS bleibt unverändert, weil
 * Google seit Jahren genau auf diese Form rankt — hier wird nur die Anzeige
 * gesplittet.
 */
export function splitAnbieterTitle(title: string): { name: string; kicker: string } {
  const match = title.match(/^(.*?)(\s+Kontakt)\s*$/i);
  if (match) {
    return { name: match[1].trim(), kicker: "Kontakt" };
  }
  return { name: title.trim(), kicker: "" };
}
