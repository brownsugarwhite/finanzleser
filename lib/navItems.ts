// Navigation items — static for now, later fetched from WordPress/ACF
export type NavSubItem = {
  label: string;
  href: string;
};

export type NavItem = {
  label: string;
  href: string;
  submenu?: NavSubItem[];
  featured?: boolean; // for Finanztools
};

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Finanzen",
    href: "/finanzen",
    submenu: [
      { label: "Geldanlagen", href: "/finanzen/geldanlagen" },
      { label: "Kredite & Bauen", href: "/finanzen/kredite-bauen" },
      { label: "Energiekosten", href: "/finanzen/energiekosten" },
      { label: "Weitere Themen", href: "/finanzen/weitere-themen" },
    ],
  },
  {
    label: "Versicherungen",
    href: "/versicherungen",
    submenu: [
      { label: "Altersvorsorge", href: "/versicherungen/altersvorsorge" },
      { label: "Krankenversicherung", href: "/versicherungen/krankenversicherung" },
      { label: "Berufsunfähigkeit", href: "/versicherungen/berufsunfaehigkeit" },
      { label: "Unfallversicherung", href: "/versicherungen/unfallversicherung" },
      { label: "Sachversicherungen", href: "/versicherungen/sachversicherungen" },
      { label: "Tierversicherungen", href: "/versicherungen/tierversicherungen" },
      { label: "Sozialversicherungen", href: "/versicherungen/sozialversicherungen" },
    ],
  },
  {
    label: "Steuern",
    href: "/steuern",
    submenu: [
      { label: "Steuererklärung", href: "/steuern/steuererklaerung" },
      { label: "Steuerarten", href: "/steuern/steuerarten" },
      { label: "Steuerpflichtige", href: "/steuern/steuerpflichtige" },
    ],
  },
  {
    label: "Recht",
    href: "/recht",
    submenu: [
      { label: "Ehe & Familie", href: "/recht/ehe-familie" },
      { label: "Arbeitsrecht", href: "/recht/arbeitsrecht" },
      { label: "Mietrecht", href: "/recht/mietrecht" },
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
