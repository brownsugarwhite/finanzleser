// Navigation items — static for now, later fetched from WordPress/ACF
export type NavSubItem = {
  label: string;
  href: string;
  tools?: string[]; // 3 tool slugs for this subcategory
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
        tools: ["zinsrechner-2026", "tagesgeld-rechner-2026", "festgeld-rechner-2026"],
      },
      {
        label: "Kredite & Bauen",
        href: "/finanzen/kredite-bauen",
        tools: ["kreditrechner-2026", "hauskreditrechner-2026", "hypothekenrechner-2026"],
      },
      {
        label: "Energiekosten",
        href: "/finanzen/energiekosten",
        tools: ["strompreisvergleich-2026", "gaspreisvergleich-2026", "gaspreise-vergleichen-2026"],
      },
      {
        label: "Weitere Themen",
        href: "/finanzen/weitere-themen",
        tools: ["haushaltsrechner-2026", "rentenrechner-2026", "gehaltsrechner-2026"],
      },
    ],
  },
  {
    label: "Versicherungen",
    href: "/versicherungen",
    megamenu: true,
    submenu: [
      {
        label: "Altersvorsorge",
        href: "/versicherungen/altersvorsorge",
        tools: ["riesterrente-rechner-2026", "rentenversicherung-rechner-2026", "basisrente-rechner-2026"],
      },
      {
        label: "Krankenversicherung",
        href: "/versicherungen/krankenversicherung",
        tools: ["private-krankenversicherung-rechner-2026", "gesetzliche-krankenversicherung-rechner-2026", "auslandskrankenversicherung-rechner-2026"],
      },
      {
        label: "Berufsunfähigkeit",
        href: "/versicherungen/berufsunfaehigkeit",
        tools: ["berufsunfaehigkeitsversicherung-rechner-2026", "erwerbsminderungsrente-beantragen", "checkliste-altersrente-beantragen"],
      },
      {
        label: "Unfallversicherung",
        href: "/versicherungen/unfallversicherung",
        tools: ["unfallversicherung-rechner-2026", "unfallversicherung-vergleich-2026", "berufsunfaehigkeitsversicherung-vergleich-2026"],
      },
      {
        label: "Sachversicherungen",
        href: "/versicherungen/sachversicherungen",
        tools: ["kfz-versicherung-vergleich-2026", "hausratversicherung-vergleich-2026", "gebaeudeversicherung-vergleich-2026"],
      },
      {
        label: "Tierversicherungen",
        href: "/versicherungen/tierversicherungen",
        tools: ["hundekrankenversicherung-vergleich-2026", "tierversicherung-worauf-sie-achten-sollten", "kostenplanung-neuanschaffung-hundes"],
      },
      {
        label: "Sozialversicherungen",
        href: "/versicherungen/sozialversicherungen",
        tools: ["elterngeldrechner-2026", "mutterschutz-rechner-2026", "kindergeldrechner-2026"],
      },
    ],
  },
  {
    label: "Steuern",
    href: "/steuern",
    megamenu: true,
    submenu: [
      {
        label: "Steuererklärung",
        href: "/steuern/steuererklaerung",
        tools: ["lohnsteuerrechner-2026", "einkommensteuerrechner-2026", "steuerrechner-2026"],
      },
      {
        label: "Steuerarten",
        href: "/steuern/steuerarten",
        tools: ["brutto-netto-rechner-2026", "lohnrechner-2026", "kfz-steuerrechner-2026"],
      },
      {
        label: "Steuerpflichtige",
        href: "/steuern/steuerpflichtige",
        tools: ["steuerklassenrechner-2026", "rentenbesteuerung-rechner-2026", "kirchensteuer-rechner-2026"],
      },
    ],
  },
  {
    label: "Recht",
    href: "/recht",
    megamenu: true,
    submenu: [
      {
        label: "Ehe & Familie",
        href: "/recht/ehe-familie",
        tools: ["unterhaltsrechner-2026", "kindesunterhalt-rechner-2026", "elternzeit-rechner-2026"],
      },
      {
        label: "Arbeitsrecht",
        href: "/recht/arbeitsrecht",
        tools: ["arbeitslosengeldrechner-2026", "altersteilzeitrechner-2026", "kreditrechner-2026"],
      },
      {
        label: "Mietrecht",
        href: "/recht/mietrecht",
        tools: ["mietkaution-rechner-2026", "haushaltsrechner-2026", "finanzielle-planung-checkliste"],
      },
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
