/**
 * Liste der bekanntesten deutschen Versicherer
 *
 * Kuratierte Auswahl (~150) aus den Sparten Komposit, Leben, PKV, Rechtsschutz,
 * Direktversicherung, Spezial. Marken-orientiert (Mutter + relevante Töchter).
 *
 * Quellen: GDV-Mitgliederliste, BaFin-Versicherer-Register, Marktübersichten.
 */

export type Versicherer = { name: string; slug: string };

export const VERSICHERER: Versicherer[] = [
  { name: "AachenMünchener", slug: "aachenmuenchener" },
  { name: "ADAC Autoversicherung", slug: "adac" },
  { name: "ADCURI", slug: "adcuri" },
  { name: "ADVOCARD", slug: "advocard" },
  { name: "AGILA", slug: "agila" },
  { name: "Aioi Nissay Dowa", slug: "aioi-nissay-dowa" },
  { name: "AIG", slug: "aig" },
  { name: "Allcura", slug: "allcura" },
  { name: "Allianz", slug: "allianz" },
  { name: "Allianz Direct", slug: "allianz-direct" },
  { name: "Allianz Lebensversicherung", slug: "allianz-leben" },
  { name: "Allianz Private Krankenversicherung", slug: "allianz-pkv" },
  { name: "Allrecht", slug: "allrecht" },
  { name: "ALTE LEIPZIGER", slug: "alte-leipziger" },
  { name: "ALTE OLDENBURGER", slug: "alte-oldenburger" },
  { name: "ARAG", slug: "arag" },
  { name: "Asstel", slug: "asstel" },
  { name: "Auxilia", slug: "auxilia" },
  { name: "AXA", slug: "axa" },
  { name: "AXA Krankenversicherung", slug: "axa-krankenversicherung" },
  { name: "AXA Lebensversicherung", slug: "axa-leben" },
  { name: "Baloise", slug: "baloise" },
  { name: "Barmenia", slug: "barmenia" },
  { name: "Barmenia Krankenversicherung", slug: "barmenia-kv" },
  { name: "Bayerische Beamtenversicherung", slug: "bbv" },
  { name: "Bayerische Versicherungskammer", slug: "vkb" },
  { name: "BGV Badische Versicherungen", slug: "bgv" },
  { name: "BGV-Versicherung", slug: "bgv-versicherung" },
  { name: "Canada Life", slug: "canada-life" },
  { name: "Concordia", slug: "concordia" },
  { name: "Concordia oeco", slug: "concordia-oeco" },
  { name: "Concordia Rechtsschutz", slug: "concordia-rechtsschutz" },
  { name: "Continentale", slug: "continentale" },
  { name: "Continentale Krankenversicherung", slug: "continentale-kv" },
  { name: "CosmosDirekt", slug: "cosmosdirekt" },
  { name: "Cosmos Lebensversicherung", slug: "cosmos-leben" },
  { name: "D.A.S. Rechtsschutz", slug: "das-rechtsschutz" },
  { name: "DA Direkt", slug: "da-direkt" },
  { name: "DBV Deutsche Beamtenversicherung", slug: "dbv" },
  { name: "Debeka", slug: "debeka" },
  { name: "Debeka Krankenversicherung", slug: "debeka-kv" },
  { name: "Debeka Lebensversicherung", slug: "debeka-leben" },
  { name: "DEURAG", slug: "deurag" },
  { name: "DEVK", slug: "devk" },
  { name: "Die Bayerische", slug: "die-bayerische" },
  { name: "Die Haftpflichtkasse", slug: "haftpflichtkasse" },
  { name: "DKV Deutsche Krankenversicherung", slug: "dkv" },
  { name: "Domcura", slug: "domcura" },
  { name: "ERGO", slug: "ergo" },
  { name: "ERGO Direkt", slug: "ergo-direkt" },
  { name: "ERGO Lebensversicherung", slug: "ergo-leben" },
  { name: "ERV Europäische Reiseversicherung", slug: "erv" },
  { name: "Europa", slug: "europa" },
  { name: "Europa Lebensversicherung", slug: "europa-leben" },
  { name: "Familienschutz Versicherung", slug: "familienschutz" },
  { name: "Feuersozietät Berlin Brandenburg", slug: "feuersozietaet" },
  { name: "FRIDAY", slug: "friday" },
  { name: "Generali", slug: "generali" },
  { name: "Generali Lebensversicherung", slug: "generali-leben" },
  { name: "GHV Darmstadt", slug: "ghv" },
  { name: "Gothaer", slug: "gothaer" },
  { name: "Gothaer Lebensversicherung", slug: "gothaer-leben" },
  { name: "GVO Versicherung", slug: "gvo" },
  { name: "Hallesche Krankenversicherung", slug: "hallesche" },
  { name: "Hannoversche Lebensversicherung", slug: "hannoversche" },
  { name: "HanseMerkur", slug: "hansemerkur" },
  { name: "HanseMerkur Reiseversicherung", slug: "hansemerkur-reise" },
  { name: "HanseMerkur24", slug: "hansemerkur24" },
  { name: "HDI", slug: "hdi" },
  { name: "HDI Lebensversicherung", slug: "hdi-leben" },
  { name: "Helvetia", slug: "helvetia" },
  { name: "HUK24", slug: "huk24" },
  { name: "HUK-COBURG", slug: "huk-coburg" },
  { name: "HUK-COBURG Lebensversicherung", slug: "huk-coburg-leben" },
  { name: "HUK-COBURG Rechtsschutz", slug: "huk-coburg-rechtsschutz" },
  { name: "IDEAL Versicherung", slug: "ideal" },
  { name: "IDEAL Lebensversicherung", slug: "ideal-leben" },
  { name: "InterRisk", slug: "interrisk" },
  { name: "INTER Versicherungsgruppe", slug: "inter" },
  { name: "INTER Krankenversicherung", slug: "inter-kv" },
  { name: "Itzehoer Versicherungen", slug: "itzehoer" },
  { name: "Janitos", slug: "janitos" },
  { name: "Karlsruher Lebensversicherung", slug: "karlsruher-leben" },
  { name: "KRAVAG", slug: "kravag" },
  { name: "Lebensversicherung von 1871 (LV 1871)", slug: "lv1871" },
  { name: "Liberty Versicherung", slug: "liberty" },
  { name: "LVM", slug: "lvm" },
  { name: "mailo", slug: "mailo" },
  { name: "Mannheimer Versicherung", slug: "mannheimer" },
  { name: "Mecklenburgische Versicherung", slug: "mecklenburgische" },
  { name: "MetLife", slug: "metlife" },
  { name: "MLP", slug: "mlp" },
  { name: "Münchener Verein", slug: "muenchener-verein" },
  { name: "Munich Re", slug: "munich-re" },
  { name: "myLife", slug: "mylife" },
  { name: "NÜRNBERGER", slug: "nuernberger" },
  { name: "NÜRNBERGER Allgemeine", slug: "nuernberger-allgemeine" },
  { name: "NÜRNBERGER Krankenversicherung", slug: "nuernberger-kv" },
  { name: "NÜRNBERGER Lebensversicherung", slug: "nuernberger-leben" },
  { name: "NV-Versicherungen", slug: "nv" },
  { name: "Öffentliche Braunschweig", slug: "oeffentliche-braunschweig" },
  { name: "Öffentliche Sachsen-Anhalt", slug: "oeffentliche-sachsen-anhalt" },
  { name: "ÖRAG Rechtsschutz", slug: "oerag" },
  { name: "ÖSA Versicherungen", slug: "oesa" },
  { name: "Pangaea Life", slug: "pangaea-life" },
  { name: "Plus Lebensversicherung", slug: "plus-leben" },
  { name: "Provinzial Nord", slug: "provinzial-nord" },
  { name: "Provinzial Rheinland", slug: "provinzial-rheinland" },
  { name: "PVAG Polizeiversicherung", slug: "pvag" },
  { name: "R+V Allgemeine Versicherung", slug: "rv" },
  { name: "R+V 24", slug: "rv24" },
  { name: "R+V Krankenversicherung", slug: "rv-kv" },
  { name: "R+V Lebensversicherung", slug: "rv-leben" },
  { name: "Rhion Digital", slug: "rhion" },
  { name: "ROLAND Rechtsschutz", slug: "roland" },
  { name: "SDK Süddeutsche Krankenversicherung", slug: "sdk" },
  { name: "Signal Iduna", slug: "signal-iduna" },
  { name: "Signal Iduna Krankenversicherung", slug: "signal-iduna-kv" },
  { name: "Signal Iduna Lebensversicherung", slug: "signal-iduna-leben" },
  { name: "Sparkassen-Versicherung Sachsen", slug: "sv-sachsen" },
  { name: "Standard Life", slug: "standard-life" },
  { name: "Stuttgarter Lebensversicherung", slug: "stuttgarter" },
  { name: "SV SparkassenVersicherung", slug: "sv-sparkassen" },
  { name: "Swiss Life", slug: "swiss-life" },
  { name: "Talanx", slug: "talanx" },
  { name: "Targo Versicherung", slug: "targo" },
  { name: "Uelzener Versicherungen", slug: "uelzener" },
  { name: "uniVersa", slug: "universa" },
  { name: "VEMA Versicherung", slug: "vema" },
  { name: "VERSICHERUNGSKAMMER Bayern", slug: "vkb-bayern" },
  { name: "Verti", slug: "verti" },
  { name: "VGH Versicherungen", slug: "vgh" },
  { name: "VHV", slug: "vhv" },
  { name: "VHV Allgemeine", slug: "vhv-allgemeine" },
  { name: "vigo Krankenversicherung", slug: "vigo" },
  { name: "Volkswohl Bund", slug: "volkswohl-bund" },
  { name: "Waldenburger Versicherung", slug: "waldenburger" },
  { name: "WGV Württembergische Gemeinde-Versicherung", slug: "wgv" },
  { name: "Westfälische Provinzial", slug: "westfaelische-provinzial" },
  { name: "Württembergische", slug: "wuerttembergische" },
  { name: "Württembergische Lebensversicherung", slug: "wuerttembergische-leben" },
  { name: "Württembergische Versicherung", slug: "wuerttembergische-versicherung" },
  { name: "Würzburger Versicherung", slug: "wuerzburger" },
  { name: "Wüstenrot", slug: "wuestenrot" },
  { name: "Wüstenrot Bausparkasse", slug: "wuestenrot-bsk" },
  { name: "Zurich", slug: "zurich" },
  { name: "Zurich Deutscher Herold", slug: "zurich-herold" },
];

// ─────────────────────────────────────────────
// Gruppierung A-Z (Umlaut-Mapping)
// ─────────────────────────────────────────────

const UMLAUT_MAP: Record<string, string> = {
  Ä: "A", Ö: "O", Ü: "U",
  ä: "A", ö: "O", ü: "U",
};

function firstLetter(name: string): string {
  const ch = name.trim().charAt(0).toUpperCase();
  if (UMLAUT_MAP[ch]) return UMLAUT_MAP[ch];
  return /[A-Z]/.test(ch) ? ch : "#";
}

export type VersichererGruppe = { letter: string; entries: Versicherer[] };

export function groupByLetter(items: Versicherer[]): VersichererGruppe[] {
  const map = new Map<string, Versicherer[]>();
  for (const item of items) {
    const letter = firstLetter(item.name);
    if (!map.has(letter)) map.set(letter, []);
    map.get(letter)!.push(item);
  }
  return Array.from(map.entries())
    .map(([letter, entries]) => ({
      letter,
      entries: entries.sort((a, b) => a.name.localeCompare(b.name, "de")),
    }))
    .sort((a, b) => {
      if (a.letter === "#") return 1;
      if (b.letter === "#") return -1;
      return a.letter.localeCompare(b.letter, "de");
    });
}

export function filterVersicherer(query: string): Versicherer[] {
  const q = query.trim().toLowerCase();
  if (!q) return VERSICHERER;
  return VERSICHERER.filter((v) => v.name.toLowerCase().includes(q));
}
