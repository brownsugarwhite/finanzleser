/** Die zwölf Themen-Wappen des Sammelalbums (Port aus dem Prototyp, 05-js-neu.html WAPPEN). */
export interface Wappen { key: string; name: string; ikon: string }

export const WAPPEN: Wappen[] = [
  { key: "haftpflicht", name: "Haftpflicht", ikon: "schirm" },
  { key: "hausrat", name: "Hausrat", ikon: "sofa" },
  { key: "hund", name: "Tier", ikon: "hund" },
  { key: "steuer", name: "Steuer", ikon: "scheine" },
  { key: "rente", name: "Rente", ikon: "sessel" },
  { key: "kinder", name: "Kinder", ikon: "baby" },
  { key: "kfz", name: "Kfz", ikon: "auto" },
  { key: "wohnen", name: "Wohnen", ikon: "haus" },
  { key: "vorsorge", name: "Vorsorge", ikon: "sanduhr" },
  { key: "recht", name: "Recht", ikon: "waage" },
  { key: "sparen", name: "Sparen", ikon: "spar" },
  { key: "kassensturz", name: "Kassensturz", ikon: "kurve" },
];

export const WAPPEN_FARBEN = ["#45A117", "#D3005E", "#06D496", "#9953c9", "#E07A5F", "#e3b341"];
