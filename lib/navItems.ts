// Navigation items — static for now, later fetched from WordPress/ACF
export type NavSubItem = {
  label: string;
  href: string;
  toolCategory?: string; // Category to load tools from (rechner, vergleich, checkliste)
};

export type NavItem = {
  label: string;
  href: string;
  submenu?: NavSubItem[];
  featured?: boolean; // for Finanztools
  megamenu?: boolean; // for Finanzen, Versicherungen, Steuern, Recht
};

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Finanzen",
    href: "/finanzen",
    megamenu: true,
    submenu: [
      {
        label: "Geldanlagen",
        href: "/finanzen/geldanlagen",
        toolCategory: "rechner",
      },
      {
        label: "Kredite & Bauen",
        href: "/finanzen/kredite-bauen",
        toolCategory: "rechner",
      },
      {
        label: "Energiekosten",
        href: "/finanzen/energiekosten",
        toolCategory: "vergleich",
      },
      {
        label: "Weitere Themen",
        href: "/finanzen/weitere-themen",
        toolCategory: "rechner",
      },
    ],
  },
  {
    label: "Versicherungen",
    href: "/versicherungen",
    megamenu: true,
    submenu: [
      { label: "Altersvorsorge", href: "/versicherungen/altersvorsorge", toolCategory: "rechner" },
      { label: "Krankenversicherung", href: "/versicherungen/krankenversicherung", toolCategory: "rechner" },
      { label: "Berufsunfähigkeit", href: "/versicherungen/berufsunfaehigkeit", toolCategory: "rechner" },
      { label: "Unfallversicherung", href: "/versicherungen/unfallversicherung", toolCategory: "vergleich" },
      { label: "Sachversicherungen", href: "/versicherungen/sachversicherungen", toolCategory: "vergleich" },
      { label: "Tierversicherungen", href: "/versicherungen/tierversicherungen", toolCategory: "vergleich" },
      { label: "Sozialversicherungen", href: "/versicherungen/sozialversicherungen", toolCategory: "rechner" },
    ],
  },
  {
    label: "Steuern",
    href: "/steuern",
    megamenu: true,
    submenu: [
      { label: "Steuererklärung", href: "/steuern/steuererklaerung", toolCategory: "rechner" },
      { label: "Steuerarten", href: "/steuern/steuerarten", toolCategory: "rechner" },
      { label: "Steuerpflichtige", href: "/steuern/steuerpflichtige", toolCategory: "rechner" },
    ],
  },
  {
    label: "Recht",
    href: "/recht",
    megamenu: true,
    submenu: [
      { label: "Ehe & Familie", href: "/recht/ehe-familie", toolCategory: "rechner" },
      { label: "Arbeitsrecht", href: "/recht/arbeitsrecht", toolCategory: "rechner" },
      { label: "Mietrecht", href: "/recht/mietrecht", toolCategory: "checkliste" },
    ],
  },
  {
    label: "Finanztools",
    href: "/finanztools",
    featured: true,
    submenu: [
      { label: "Rechner", href: "/finanztools/rechner" },
      { label: "Checklisten", href: "/finanztools/checklisten" },
      { label: "Vergleiche", href: "/finanztools/vergleiche" },
    ],
  },
];
